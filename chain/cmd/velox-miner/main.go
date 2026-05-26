package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"sync/atomic"
	"time"

	"github.com/veloxdag/veloxdag/pkg/pow"
	"github.com/veloxdag/veloxdag/pkg/types"
)

func main() {
	rpcURL := flag.String("rpc", "http://127.0.0.1:8545", "node RPC URL")
	miner := flag.String("miner", "", "miner address (required)")
	threads := flag.Int("threads", runtime.NumCPU(), "mining threads")
	flag.Parse()

	if *miner == "" {
		fmt.Println("Usage: velox-miner -miner velx1... [-rpc URL] [-threads N]")
		os.Exit(1)
	}

	log.Printf("VeloxDAG CPU Miner — %d threads", *threads)
	log.Printf("Mining to: %s", *miner)

	var blocksFound uint64
	for i := 0; i < *threads; i++ {
		go mineLoop(*rpcURL, *miner, i, &blocksFound)
	}

	ticker := time.NewTicker(30 * time.Second)
	for range ticker.C {
		log.Printf("Status: %d blocks found this session", atomic.LoadUint64(&blocksFound))
	}
}

func mineLoop(rpcURL, miner string, threadID int, blocksFound *uint64) {
	nonceStart := uint64(threadID) * 1_000_000_000
	for {
		block, prefix, difficulty, err := fetchTemplate(rpcURL, miner)
		if err != nil {
			log.Printf("[thread %d] template error: %v", threadID, err)
			time.Sleep(5 * time.Second)
			continue
		}
		nonce, hash := pow.Mine(prefix, difficulty, nonceStart)
		if hash == "" {
			nonceStart += 1_000_000_000
			continue
		}
		block.Header.Nonce = nonce
		block.Hash = hash
		if err := submitBlock(rpcURL, block); err != nil {
			log.Printf("[thread %d] submit error: %v", threadID, err)
			time.Sleep(2 * time.Second)
			continue
		}
		atomic.AddUint64(blocksFound, 1)
		log.Printf("[thread %d] BLOCK FOUND! hash=%s height=%d reward=%s VELX",
			threadID, hash, block.Header.Height, types.FormatVELX(types.BlockReward(block.Header.Height)))
		nonceStart = uint64(threadID) * 1_000_000_000
	}
}

func rpcCall(rpcURL, method string, params any) (json.RawMessage, error) {
	body, _ := json.Marshal(map[string]any{
		"jsonrpc": "2.0",
		"method":  method,
		"params":  params,
		"id":      1,
	})
	resp, err := http.Post(rpcURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.Error != nil {
		return nil, fmt.Errorf(result.Error.Message)
	}
	return result.Result, nil
}

func fetchTemplate(rpcURL, miner string) (*types.Block, []byte, uint64, error) {
	raw, err := rpcCall(rpcURL, "getblocktemplate", map[string]string{"miner": miner})
	if err != nil {
		return nil, nil, 0, err
	}
	var parsed struct {
		Block        types.Block `json:"block"`
		HeaderPrefix []byte      `json:"headerPrefix"`
		Difficulty   uint64      `json:"difficulty"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, nil, 0, err
	}
	return &parsed.Block, parsed.HeaderPrefix, parsed.Difficulty, nil
}

func submitBlock(rpcURL string, block *types.Block) error {
	_, err := rpcCall(rpcURL, "submitblock", map[string]any{"block": block})
	return err
}
