package chain

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"

	"github.com/veloxdag/veloxdag/pkg/pow"
	"github.com/veloxdag/veloxdag/pkg/types"
)

const (
	InitialDifficulty = 4
	RetargetInterval  = 30
	MaxMempool        = 5000
)

type State struct {
	mu          sync.RWMutex
	Blocks      map[string]*types.Block `json:"blocks"`
	Tips        []string                `json:"tips"`
	Balances    map[string]uint64       `json:"balances"`
	Nonces      map[string]uint64       `json:"nonces"`
	Mempool     []types.Transaction     `json:"-"`
	Difficulty  uint64                  `json:"difficulty"`
	TotalSupply uint64                  `json:"totalSupply"`
	BlockCount  uint64                  `json:"blockCount"`
	dataDir     string
}

func NewState(dataDir string) *State {
	return &State{
		Blocks:     make(map[string]*types.Block),
		Tips:       []string{},
		Balances:   make(map[string]uint64),
		Nonces:     make(map[string]uint64),
		Mempool:    []types.Transaction{},
		Difficulty: InitialDifficulty,
		dataDir:    dataDir,
	}
}

func (s *State) Load() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	dir := s.dataDir
	path := filepath.Join(dir, "chain.json")
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if err := json.Unmarshal(b, s); err != nil {
		return err
	}
	s.dataDir = dir
	if s.Difficulty == 0 {
		s.Difficulty = InitialDifficulty
	}
	if s.Blocks == nil {
		s.Blocks = make(map[string]*types.Block)
	}
	if s.Balances == nil {
		s.Balances = make(map[string]uint64)
	}
	if s.Nonces == nil {
		s.Nonces = make(map[string]uint64)
	}
	if s.Mempool == nil {
		s.Mempool = []types.Transaction{}
	}
	return nil
}

func (s *State) Save() error {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if err := os.MkdirAll(s.dataDir, 0755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(s.dataDir, "chain.json"), b, 0644)
}

func (s *State) InitGenesis() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.Blocks) > 0 {
		return nil
	}
	genesis := &types.Block{
		Header: types.BlockHeader{
			Version:    1,
			Parents:    []string{},
			Timestamp:  1717200000, // fair launch anchor
			Difficulty: InitialDifficulty,
			Nonce:      0,
			MerkleRoot: "0000000000000000000000000000000000000000000000000000000000000000",
			Miner:      "velx1fairlaunch000000000000000000000000",
			Height:     0,
			ExtraData:  "VeloxDAG Fair Launch — No Premine, No ICO, No VC",
		},
		Transactions: []types.Transaction{},
	}
	// Mine genesis nonce
	prefix := pow.HeaderPrefix(
		genesis.Header.Version, genesis.Header.Parents, genesis.Header.Timestamp,
		genesis.Header.Difficulty, genesis.Header.MerkleRoot,
		genesis.Header.Miner, genesis.Header.Height, genesis.Header.ExtraData,
	)
	nonce, hash := pow.Mine(prefix, genesis.Header.Difficulty, 0)
	genesis.Header.Nonce = nonce
	genesis.Hash = hash
	if !pow.Verify(genesis.Hash, genesis.Header.Difficulty) {
		return fmt.Errorf("failed to mine genesis block")
	}
	s.Blocks[genesis.Hash] = genesis
	s.Tips = []string{genesis.Hash}
	s.BlockCount = 1
	return s.saveLocked()
}

func (s *State) GetTips() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]string, len(s.Tips))
	copy(out, s.Tips)
	return out
}

func (s *State) GetChainInfo() (blockCount, difficulty, totalSupply uint64, tipCount int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.BlockCount, s.Difficulty, s.TotalSupply, len(s.Tips)
}

func (s *State) GetBalance(addr string) uint64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Balances[addr]
}

func (s *State) AddTx(tx types.Transaction) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.Mempool) >= MaxMempool {
		return fmt.Errorf("mempool full")
	}
	if tx.Amount == 0 && tx.Fee == 0 {
		return fmt.Errorf("invalid tx")
	}
	bal := s.Balances[tx.From]
	need := tx.Amount + tx.Fee
	if tx.From != "" && bal < need {
		return fmt.Errorf("insufficient balance")
	}
	for _, m := range s.Mempool {
		if m.From == tx.From && m.Nonce == tx.Nonce {
			return fmt.Errorf("duplicate nonce in mempool")
		}
	}
	if tx.From != "" && tx.Nonce != s.Nonces[tx.From] {
		return fmt.Errorf("invalid nonce: expected %d", s.Nonces[tx.From])
	}
	s.Mempool = append(s.Mempool, tx)
	return nil
}

func (s *State) BuildBlockTemplate(miner string) (*types.Block, []byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if len(s.Tips) == 0 {
		return nil, nil, fmt.Errorf("no tips")
	}
	parents := s.Tips
	if len(parents) > types.MaxParents {
		parents = parents[:types.MaxParents]
	}
	maxHeight := uint64(0)
	for _, p := range parents {
		if b, ok := s.Blocks[p]; ok && b.Header.Height > maxHeight {
			maxHeight = b.Header.Height
		}
	}
	txs := make([]types.Transaction, len(s.Mempool))
	copy(txs, s.Mempool)
	if len(txs) > 100 {
		txs = txs[:100]
	}
	merkle := merkleRoot(txs)
	block := &types.Block{
		Header: types.BlockHeader{
			Version:    1,
			Parents:    parents,
			Timestamp:  types.Now(),
			Difficulty: s.Difficulty,
			Nonce:      0,
			MerkleRoot: merkle,
			Miner:      miner,
			Height:     maxHeight + 1,
			ExtraData:  "",
		},
		Transactions: append([]types.Transaction{}, txs...),
	}
	prefix := pow.HeaderPrefix(
		block.Header.Version, block.Header.Parents, block.Header.Timestamp,
		block.Header.Difficulty, block.Header.MerkleRoot,
		block.Header.Miner, block.Header.Height, block.Header.ExtraData,
	)
	return block, prefix, nil
}

func (s *State) SubmitBlock(block *types.Block) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	h := block.Header
	if !pow.VerifyBlock(h.Version, h.Parents, h.Timestamp, h.Difficulty, h.Nonce,
		h.MerkleRoot, h.Miner, h.Height, h.ExtraData, block.Hash) {
		return fmt.Errorf("invalid proof of work")
	}
	for _, p := range block.Header.Parents {
		if _, ok := s.Blocks[p]; !ok {
			return fmt.Errorf("unknown parent %s", p)
		}
	}
	if _, exists := s.Blocks[block.Hash]; exists {
		return fmt.Errorf("block already known")
	}

	// Coinbase (BTC-style halving by height)
	reward := types.BlockReward(block.Header.Height)
	if reward == 0 {
		return fmt.Errorf("block subsidy exhausted at height %d", block.Header.Height)
	}
	if s.TotalSupply+reward > types.MaxSupply {
		reward = types.MaxSupply - s.TotalSupply
		if reward == 0 {
			return fmt.Errorf("max supply %s reached", types.FormatVELX(types.MaxSupply))
		}
	}
	s.Balances[block.Header.Miner] += reward
	s.TotalSupply += reward

	// Apply txs
	applied := make(map[string]bool)
	for _, tx := range block.Transactions {
		if tx.From != "" {
			need := tx.Amount + tx.Fee
			if s.Balances[tx.From] < need {
				continue
			}
			s.Balances[tx.From] -= need
			s.Nonces[tx.From]++
		}
		s.Balances[tx.To] += tx.Amount
		if tx.Fee > 0 && tx.From != "" {
			s.Balances[block.Header.Miner] += tx.Fee
			s.TotalSupply += tx.Fee
		}
		applied[tx.ID()] = true
	}

	// Remove mined txs from mempool
	newPool := []types.Transaction{}
	for _, tx := range s.Mempool {
		if !applied[tx.ID()] {
			newPool = append(newPool, tx)
		}
	}
	s.Mempool = newPool

	s.Blocks[block.Hash] = block
	s.BlockCount++
	s.updateTips(block.Hash, block.Header.Parents)
	s.maybeRetarget()
	return s.saveLocked()
}

func (s *State) updateTips(newHash string, parents []string) {
	parentSet := make(map[string]bool)
	for _, p := range parents {
		parentSet[p] = true
	}
	newTips := []string{newHash}
	for _, tip := range s.Tips {
		if !parentSet[tip] {
			newTips = append(newTips, tip)
		}
	}
	if len(newTips) > 10 {
		newTips = newTips[:10]
	}
	s.Tips = newTips
}

func (s *State) maybeRetarget() {
	if s.BlockCount%RetargetInterval != 0 {
		return
	}
	// Simple retarget: if DAG has many tips, slightly increase difficulty
	if len(s.Tips) > 3 {
		s.Difficulty++
	} else if len(s.Tips) == 1 && s.Difficulty > 1 {
		s.Difficulty--
	}
}

func (s *State) saveLocked() error {
	b, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(s.dataDir, 0755); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(s.dataDir, "chain.json"), b, 0644)
}

func merkleRoot(txs []types.Transaction) string {
	if len(txs) == 0 {
		return "0000000000000000000000000000000000000000000000000000000000000000"
	}
	ids := make([]string, len(txs))
	for i, tx := range txs {
		ids[i] = tx.ID()
	}
	sort.Strings(ids)
	combined := ""
	for _, id := range ids {
		combined += id
	}
	return typesBlockHash(combined)
}

func typesBlockHash(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}
