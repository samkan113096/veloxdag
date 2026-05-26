package rpc

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/veloxdag/veloxdag/pkg/chain"
	"github.com/veloxdag/veloxdag/pkg/pow"
	"github.com/veloxdag/veloxdag/pkg/types"
)

type Server struct {
	State *chain.State
}

type jsonRPCReq struct {
	JSONRPC string          `json:"jsonrpc"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
	ID      any             `json:"id"`
}

type jsonRPCResp struct {
	JSONRPC string `json:"jsonrpc"`
	Result  any    `json:"result,omitempty"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
	ID any `json:"id"`
}

func NewServer(state *chain.State) *Server {
	return &Server{State: state}
}

func (s *Server) Routes() http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/", s.handleRPC).Methods("POST", "OPTIONS")
	r.HandleFunc("/health", s.handleHealth).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/stats", s.handleStats).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/info", s.handleStats).Methods("GET", "OPTIONS")
	return withCORS(r)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok","chain":"VeloxDAG"}`))
}

func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	blocks, diff, supply, tips := s.State.GetChainInfo()
	currentReward := types.BlockReward(blocks) // next block approx
	if blocks > 0 {
		currentReward = types.BlockReward(blocks)
	}
	remaining := uint64(0)
	if supply < types.MaxSupply {
		remaining = types.MaxSupply - supply
	}
	minedPct := float64(supply) / float64(types.MaxSupply) * 100
	info := map[string]any{
		"name":            types.ChainName,
		"ticker":          types.Ticker,
		"algorithm":       "SHA256-BlockDAG",
		"fairLaunch":      true,
		"premine":         "0%",
		"blockReward":     types.FormatVELX(currentReward),
		"initialReward":   types.FormatVELX(types.InitialReward),
		"maxSupply":       types.FormatVELX(types.MaxSupply),
		"remainingSupply": types.FormatVELX(remaining),
		"minedPercent":    fmt.Sprintf("%.4f", minedPct),
		"halvingInterval": types.HalvingInterval,
		"blocks":          blocks,
		"tips":            s.State.GetTips(),
		"difficulty":      diff,
		"totalSupply":     types.FormatVELX(supply),
		"totalMined":      types.FormatVELX(supply),
		"tipCount":        tips,
		"status":          "live",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

func (s *Server) handleRPC(w http.ResponseWriter, r *http.Request) {
	var req jsonRPCReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, req.ID, -32700, "parse error")
		return
	}
	switch req.Method {
	case "getblocktemplate":
		s.getBlockTemplate(w, req)
	case "submitblock":
		s.submitBlock(w, req)
	case "getbalance":
		s.getBalance(w, req)
	case "sendrawtransaction":
		s.sendTx(w, req)
	case "getchaininfo":
		s.getChainInfo(w, req)
	case "gettips":
		s.getTips(w, req)
	default:
		writeErr(w, req.ID, -32601, "method not found")
	}
}

type templateParams struct {
	Miner string `json:"miner"`
}

func (s *Server) getBlockTemplate(w http.ResponseWriter, req jsonRPCReq) {
	var p templateParams
	_ = json.Unmarshal(req.Params, &p)
	if p.Miner == "" {
		writeErr(w, req.ID, -32602, "miner address required")
		return
	}
	block, prefix, err := s.State.BuildBlockTemplate(p.Miner)
	if err != nil {
		writeErr(w, req.ID, -32000, err.Error())
		return
	}
	writeOK(w, req.ID, map[string]any{
		"block":        block,
		"headerPrefix": prefix,
		"difficulty":   block.Header.Difficulty,
		"target":       "mine by finding nonce where double-SHA256(prefix||nonce) <= target",
	})
}

type submitParams struct {
	Block types.Block `json:"block"`
}

func (s *Server) submitBlock(w http.ResponseWriter, req jsonRPCReq) {
	var p submitParams
	if err := json.Unmarshal(req.Params, &p); err != nil {
		writeErr(w, req.ID, -32602, "invalid params")
		return
	}
	if !pow.VerifyBlock(p.Block.Header.Version, p.Block.Header.Parents, p.Block.Header.Timestamp,
		p.Block.Header.Difficulty, p.Block.Header.Nonce, p.Block.Header.MerkleRoot,
		p.Block.Header.Miner, p.Block.Header.Height, p.Block.Header.ExtraData, p.Block.Hash) {
		writeErr(w, req.ID, -32000, "invalid pow")
		return
	}
	if err := s.State.SubmitBlock(&p.Block); err != nil {
		writeErr(w, req.ID, -32000, err.Error())
		return
	}
	writeOK(w, req.ID, map[string]string{"hash": p.Block.Hash, "status": "accepted"})
}

type balanceParams struct {
	Address string `json:"address"`
}

func (s *Server) getBalance(w http.ResponseWriter, req jsonRPCReq) {
	var p balanceParams
	_ = json.Unmarshal(req.Params, &p)
	bal := s.State.GetBalance(p.Address)
	writeOK(w, req.ID, map[string]any{"address": p.Address, "balance": bal, "formatted": types.FormatVELX(bal)})
}

func (s *Server) sendTx(w http.ResponseWriter, req jsonRPCReq) {
	var tx types.Transaction
	if err := json.Unmarshal(req.Params, &tx); err != nil {
		writeErr(w, req.ID, -32602, "invalid tx")
		return
	}
	if err := s.State.AddTx(tx); err != nil {
		writeErr(w, req.ID, -32000, err.Error())
		return
	}
	_ = s.State.Save()
	writeOK(w, req.ID, map[string]string{"txid": tx.ID(), "status": "mempool"})
}

func (s *Server) getChainInfo(w http.ResponseWriter, req jsonRPCReq) {
	blocks, diff, supply, tips := s.State.GetChainInfo()
	remaining := types.MaxSupply - supply
	if supply >= types.MaxSupply {
		remaining = 0
	}
	writeOK(w, req.ID, map[string]any{
		"chain":           types.ChainName,
		"blocks":          blocks,
		"difficulty":      diff,
		"totalSupply":     types.FormatVELX(supply),
		"totalMined":      types.FormatVELX(supply),
		"maxSupply":       types.FormatVELX(types.MaxSupply),
		"remainingSupply": types.FormatVELX(remaining),
		"blockReward":     types.FormatVELX(types.BlockReward(blocks)),
		"halvingInterval": types.HalvingInterval,
		"tips":            tips,
		"fairLaunch":      true,
	})
}

func (s *Server) getTips(w http.ResponseWriter, req jsonRPCReq) {
	writeOK(w, req.ID, s.State.GetTips())
}

func writeOK(w http.ResponseWriter, id any, result any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jsonRPCResp{JSONRPC: "2.0", Result: result, ID: id})
}

func writeErr(w http.ResponseWriter, id any, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jsonRPCResp{
		JSONRPC: "2.0",
		Error:   &struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		}{Code: code, Message: msg},
		ID: id,
	})
}
