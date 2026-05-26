package types

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

const (
	InitialReward    = 50_00000000 // 50 VELX per block at launch (8 decimals)
	CoinbaseReward   = InitialReward
	Decimals         = 8
	Ticker           = "VELX"
	ChainName        = "VeloxDAG"
	TargetBlockSec   = 10
	MaxParents       = 2
	HalvingInterval  = 210_000 // same cadence concept as Bitcoin
	MaxSupply        = 21_000_000_00000000 // 21 million VELX cap
)

// BlockReward returns the coinbase for a block at the given height (Bitcoin-style halving).
func BlockReward(height uint64) uint64 {
	halvings := height / HalvingInterval
	if halvings >= 64 {
		return 0
	}
	return InitialReward >> halvings
}

type Transaction struct {
	From      string `json:"from"`
	To        string `json:"to"`
	Amount    uint64 `json:"amount"`
	Fee       uint64 `json:"fee"`
	Nonce     uint64 `json:"nonce"`
	Timestamp int64  `json:"timestamp"`
	Signature string `json:"signature"`
}

func (tx *Transaction) ID() string {
	b, _ := json.Marshal(struct {
		From   string
		To     string
		Amount uint64
		Fee    uint64
		Nonce  uint64
	}{tx.From, tx.To, tx.Amount, tx.Fee, tx.Nonce})
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

type BlockHeader struct {
	Version    uint32   `json:"version"`
	Parents    []string `json:"parents"`
	Timestamp  int64    `json:"timestamp"`
	Difficulty uint64   `json:"difficulty"`
	Nonce      uint64   `json:"nonce"`
	MerkleRoot string   `json:"merkleRoot"`
	Miner      string   `json:"miner"`
	Height     uint64   `json:"height"`
	ExtraData  string   `json:"extraData"`
}

type Block struct {
	Header       BlockHeader   `json:"header"`
	Transactions []Transaction `json:"transactions"`
	Hash         string        `json:"hash"`
}

func (b *Block) ComputeHash() string {
	payload, _ := json.Marshal(struct {
		Version    uint32
		Parents    []string
		Timestamp  int64
		Difficulty uint64
		Nonce      uint64
		MerkleRoot string
		Miner      string
		Height     uint64
		ExtraData  string
	}{
		b.Header.Version, b.Header.Parents, b.Header.Timestamp,
		b.Header.Difficulty, b.Header.Nonce, b.Header.MerkleRoot,
		b.Header.Miner, b.Header.Height, b.Header.ExtraData,
	})
	sum := sha256.Sum256(payload)
	return hex.EncodeToString(sum[:])
}

func FormatVELX(satoshi uint64) string {
	whole := satoshi / 1_00000000
	frac := satoshi % 1_00000000
	return fmt.Sprintf("%d.%08d", whole, frac)
}

func Now() int64 {
	return time.Now().Unix()
}
