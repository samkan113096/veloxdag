package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/veloxdag/veloxdag/pkg/chain"
	"github.com/veloxdag/veloxdag/pkg/p2p"
	"github.com/veloxdag/veloxdag/pkg/rpc"
)

func main() {
	dataDir := flag.String("datadir", defaultDataDir(), "blockchain data directory")
	port := flag.Int("port", 8545, "RPC port")
	p2pPort := flag.Int("p2pport", 37373, "P2P listen port")
	lan := flag.Bool("lan", false, "listen on all interfaces (0.0.0.0) for LAN mining")
	seeds := flag.String("seeds", "", "comma-separated seed peers, e.g. 1.2.3.4:37373")
	flag.Parse()

	if err := os.MkdirAll(*dataDir, 0755); err != nil {
		log.Fatal(err)
	}

	state := chain.NewState(*dataDir)
	if err := state.Load(); err != nil {
		log.Fatal(err)
	}
	if err := state.InitGenesis(); err != nil {
		log.Fatal(err)
	}

	blocks, diff, supply, tips := state.GetChainInfo()
	log.Printf("Chain loaded: %d blocks, difficulty %d, supply %s VELX, %d tips",
		blocks, diff, formatSupply(supply), tips)

	// Start P2P node
	var seedList []string
	if *seeds != "" {
		for _, s := range strings.Split(*seeds, ",") {
			s = strings.TrimSpace(s)
			if s != "" {
				seedList = append(seedList, s)
			}
		}
	}
	p2pNode := p2p.NewNode(state, *p2pPort, seedList)
	p2pNode.Start()
	log.Printf("P2P node listening on :%d (%d seed peers)", *p2pPort, len(seedList))

	// HTTP RPC server
	srv := rpc.NewServer(state, p2pNode)
	host := "127.0.0.1"
	if *lan {
		host = "0.0.0.0"
	}
	addr := fmt.Sprintf("%s:%d", host, *port)
	log.Printf("VeloxDAG RPC listening on http://%s", addr)
	if *lan {
		printLANURLs(*port, *p2pPort)
	}
	log.Printf("Fair launch PoW BlockDAG — no premine, no ICO")
	log.Fatal(http.ListenAndServe(addr, srv.Routes()))
}

func formatSupply(satoshi uint64) string {
	return fmt.Sprintf("%d.%08d", satoshi/1_00000000, satoshi%1_00000000)
}

func printLANURLs(rpcPort, p2pPort int) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return
	}
	log.Printf("LAN miners can connect to:")
	for _, iface := range ifaces {
		addrs, _ := iface.Addrs()
		for _, a := range addrs {
			if ipnet, ok := a.(*net.IPNet); ok && ipnet.IP.To4() != nil && !ipnet.IP.IsLoopback() {
				log.Printf("  RPC: http://%s:%d", ipnet.IP.String(), rpcPort)
				log.Printf("  P2P: %s:%d  (pass to -seeds on other nodes)", ipnet.IP.String(), p2pPort)
			}
		}
	}
}

func defaultDataDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".veloxdag")
}
