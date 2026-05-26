package p2p

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"sync"
	"time"
)

const (
	DefaultPort    = 37373
	MaxPeers       = 50
	HandshakeTimeout = 10 * time.Second
	SyncInterval   = 30 * time.Second
)

type MsgType string

const (
	MsgHandshake  MsgType = "handshake"
	MsgGetBlocks  MsgType = "getblocks"
	MsgBlocks     MsgType = "blocks"
	MsgNewBlock   MsgType = "newblock"
	MsgGetPeers   MsgType = "getpeers"
	MsgPeers      MsgType = "peers"
	MsgPing       MsgType = "ping"
	MsgPong       MsgType = "pong"
)

type Message struct {
	Type    MsgType         `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type HandshakePayload struct {
	Version    string `json:"version"`
	Height     uint64 `json:"height"`
	GenesisHash string `json:"genesisHash"`
	ListenPort int    `json:"listenPort"`
	UserAgent  string `json:"userAgent"`
}

type GetBlocksPayload struct {
	FromHeight uint64 `json:"fromHeight"`
	Limit      int    `json:"limit"`
}

type PeersPayload struct {
	Peers []string `json:"peers"`
}

// ChainAdapter is implemented by the chain.State to avoid import cycles.
type ChainAdapter interface {
	GetBlockCount() uint64
	GetGenesisHash() string
	GetBlocksFromHeight(from uint64, limit int) []json.RawMessage
	HandleRemoteBlock(raw json.RawMessage) error
}

type Peer struct {
	addr       string
	conn       net.Conn
	writer     *json.Encoder
	reader     *bufio.Scanner
	listenPort int
	height     uint64
	mu         sync.Mutex
}

func (p *Peer) Send(msg Message) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.writer.Encode(msg)
}

type Node struct {
	chain      ChainAdapter
	listenPort int
	seeds      []string

	mu    sync.RWMutex
	peers map[string]*Peer

	blockCh chan json.RawMessage // blocks to broadcast
}

func NewNode(chain ChainAdapter, listenPort int, seeds []string) *Node {
	return &Node{
		chain:      chain,
		listenPort: listenPort,
		seeds:      seeds,
		peers:      make(map[string]*Peer),
		blockCh:    make(chan json.RawMessage, 256),
	}
}

func (n *Node) Start() {
	go n.listen()
	go n.connectSeeds()
	go n.broadcastLoop()
	go n.syncLoop()
}

func (n *Node) BroadcastBlock(raw json.RawMessage) {
	select {
	case n.blockCh <- raw:
	default:
	}
}

func (n *Node) PeerCount() int {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return len(n.peers)
}

func (n *Node) PeerAddrs() []string {
	n.mu.RLock()
	defer n.mu.RUnlock()
	out := make([]string, 0, len(n.peers))
	for a := range n.peers {
		out = append(out, a)
	}
	return out
}

func (n *Node) ConnectPeer(addr string) error {
	n.mu.RLock()
	_, exists := n.peers[addr]
	n.mu.RUnlock()
	if exists {
		return nil
	}
	go n.dial(addr)
	return nil
}

func (n *Node) listen() {
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", n.listenPort))
	if err != nil {
		log.Printf("[p2p] listen error: %v", err)
		return
	}
	log.Printf("[p2p] listening on :%d", n.listenPort)
	for {
		conn, err := ln.Accept()
		if err != nil {
			continue
		}
		go n.handleConn(conn, "")
	}
}

func (n *Node) connectSeeds() {
	time.Sleep(2 * time.Second)
	for _, s := range n.seeds {
		n.dial(s)
	}
}

func (n *Node) dial(addr string) {
	conn, err := net.DialTimeout("tcp", addr, HandshakeTimeout)
	if err != nil {
		log.Printf("[p2p] dial %s: %v", addr, err)
		return
	}
	n.handleConn(conn, addr)
}

func (n *Node) handleConn(conn net.Conn, remoteAddr string) {
	defer conn.Close()
	if remoteAddr == "" {
		remoteAddr = conn.RemoteAddr().String()
	}

	peer := &Peer{
		addr:   remoteAddr,
		conn:   conn,
		writer: json.NewEncoder(conn),
		reader: bufio.NewScanner(conn),
	}
	peer.reader.Buffer(make([]byte, 4*1024*1024), 4*1024*1024)

	// Handshake
	hs := HandshakePayload{
		Version:    "1.0.0",
		Height:     n.chain.GetBlockCount(),
		GenesisHash: n.chain.GetGenesisHash(),
		ListenPort: n.listenPort,
		UserAgent:  "VeloxDAG/1.0",
	}
	raw, _ := json.Marshal(hs)
	if err := peer.Send(Message{Type: MsgHandshake, Payload: raw}); err != nil {
		return
	}

	// Read remote handshake
	if !peer.reader.Scan() {
		return
	}
	var msg Message
	if err := json.Unmarshal(peer.reader.Bytes(), &msg); err != nil {
		return
	}
	if msg.Type != MsgHandshake {
		return
	}
	var remoteHS HandshakePayload
	if err := json.Unmarshal(msg.Payload, &remoteHS); err != nil {
		return
	}
	if remoteHS.GenesisHash != n.chain.GetGenesisHash() {
		log.Printf("[p2p] peer %s on different chain (genesis=%s), dropping", remoteAddr, remoteHS.GenesisHash)
		return
	}
	peer.height = remoteHS.Height
	if remoteHS.ListenPort > 0 {
		host, _, _ := net.SplitHostPort(remoteAddr)
		peer.addr = fmt.Sprintf("%s:%d", host, remoteHS.ListenPort)
	}

	// Register
	n.mu.Lock()
	if len(n.peers) >= MaxPeers {
		n.mu.Unlock()
		return
	}
	n.peers[peer.addr] = peer
	n.mu.Unlock()
	log.Printf("[p2p] connected peer %s (height=%d)", peer.addr, peer.height)

	defer func() {
		n.mu.Lock()
		delete(n.peers, peer.addr)
		n.mu.Unlock()
		log.Printf("[p2p] disconnected peer %s", peer.addr)
	}()

	// Request their blocks if they're ahead
	if peer.height > n.chain.GetBlockCount() {
		n.requestBlocks(peer, n.chain.GetBlockCount())
	}

	// Message loop
	for peer.reader.Scan() {
		var m Message
		if err := json.Unmarshal(peer.reader.Bytes(), &m); err != nil {
			continue
		}
		n.handleMessage(peer, m)
	}
}

func (n *Node) handleMessage(peer *Peer, msg Message) {
	switch msg.Type {
	case MsgNewBlock:
		if err := n.chain.HandleRemoteBlock(msg.Payload); err == nil {
			n.gossip(peer.addr, msg)
		}
	case MsgGetBlocks:
		var p GetBlocksPayload
		if err := json.Unmarshal(msg.Payload, &p); err != nil {
			return
		}
		if p.Limit <= 0 || p.Limit > 500 {
			p.Limit = 500
		}
		blocks := n.chain.GetBlocksFromHeight(p.FromHeight, p.Limit)
		for _, b := range blocks {
			raw, _ := json.Marshal(b)
			_ = peer.Send(Message{Type: MsgBlocks, Payload: raw})
		}
	case MsgBlocks:
		_ = n.chain.HandleRemoteBlock(msg.Payload)
	case MsgGetPeers:
		addrs := n.PeerAddrs()
		raw, _ := json.Marshal(PeersPayload{Peers: addrs})
		_ = peer.Send(Message{Type: MsgPeers, Payload: raw})
	case MsgPeers:
		var p PeersPayload
		if err := json.Unmarshal(msg.Payload, &p); err == nil {
			for _, addr := range p.Peers {
				if addr != peer.addr {
					_ = n.ConnectPeer(addr)
				}
			}
		}
	case MsgPing:
		_ = peer.Send(Message{Type: MsgPong})
	}
}

func (n *Node) gossip(exceptAddr string, msg Message) {
	n.mu.RLock()
	defer n.mu.RUnlock()
	for addr, p := range n.peers {
		if addr != exceptAddr {
			_ = p.Send(msg)
		}
	}
}

func (n *Node) broadcastLoop() {
	for raw := range n.blockCh {
		msg := Message{Type: MsgNewBlock, Payload: raw}
		n.mu.RLock()
		for _, p := range n.peers {
			_ = p.Send(msg)
		}
		n.mu.RUnlock()
	}
}

func (n *Node) syncLoop() {
	ticker := time.NewTicker(SyncInterval)
	for range ticker.C {
		n.mu.RLock()
		for _, peer := range n.peers {
			if peer.height > n.chain.GetBlockCount() {
				n.requestBlocks(peer, n.chain.GetBlockCount())
			}
			// Exchange peer lists
			_ = peer.Send(Message{Type: MsgGetPeers})
		}
		n.mu.RUnlock()
	}
}

func (n *Node) requestBlocks(peer *Peer, from uint64) {
	raw, _ := json.Marshal(GetBlocksPayload{FromHeight: from, Limit: 500})
	_ = peer.Send(Message{Type: MsgGetBlocks, Payload: raw})
}
