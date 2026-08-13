package chain

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"testing"

	"github.com/veloxdag/veloxdag/pkg/crypto"
	"github.com/veloxdag/veloxdag/pkg/pow"
	"github.com/veloxdag/veloxdag/pkg/types"
)

// testDifficulty is a trivially easy difficulty used in unit tests so they
// don't spend 60 seconds mining a block.
const testDifficulty = 1

// hexAddr returns a well-formed velx1 address (5-char prefix + 40 hex chars).
func hexAddr(c byte) string {
	return "velx1" + string(bytes.Repeat([]byte{c}, 40))
}

// mineBlock re-mines the given block with its current header fields.
func mineBlock(t *testing.T, block *types.Block) {
	t.Helper()
	prefix := pow.HeaderPrefix(block.Header.Version, block.Header.Parents, block.Header.Timestamp,
		block.Header.Difficulty, block.Header.MerkleRoot, block.Header.Miner, block.Header.Height, block.Header.ExtraData)
	nonce, hash := pow.Mine(prefix, block.Header.Difficulty, 0)
	if hash == "" {
		t.Fatal("failed to mine block")
	}
	block.Header.Nonce = nonce
	block.Hash = hash
}

// signTx signs a transaction the same way the browser wallet does:
// SHA-256 of the canonical signing message, then Ed25519.
func signTx(t *testing.T, kp *crypto.KeyPair, tx *types.Transaction) {
	t.Helper()
	msgHash := sha256.Sum256(tx.SigningMessage())
	tx.PublicKey = hex.EncodeToString(kp.Public)
	tx.Signature = hex.EncodeToString(crypto.Sign(kp.Private, msgHash[:]))
}

func TestGenesisFairLaunch(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	if err := s.InitGenesis(); err != nil {
		t.Fatal(err)
	}
	if s.TotalSupply != 0 {
		t.Fatalf("genesis premine: supply=%d want 0", s.TotalSupply)
	}
	if len(s.Blocks) != 1 {
		t.Fatalf("blocks=%d want 1", len(s.Blocks))
	}
	for _, b := range s.Blocks {
		if !pow.Verify(b.Hash, b.Header.Difficulty) {
			t.Fatalf("genesis invalid pow hash=%s", b.Hash)
		}
	}
}

func TestMineAndSubmitBlock(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	if err := s.InitGenesis(); err != nil {
		t.Fatal(err)
	}
	s.Difficulty = testDifficulty

	miner := hexAddr('a')
	block, _, err := s.BuildBlockTemplate(miner)
	if err != nil {
		t.Fatal(err)
	}
	mineBlock(t, block)
	if err := s.SubmitBlock(block); err != nil {
		t.Fatal(err)
	}
	bal := s.GetBalance(miner)
	if bal != types.BlockReward(1) {
		t.Fatalf("balance=%d want %d", bal, types.BlockReward(1))
	}
	if s.BlockCount != 2 {
		t.Fatalf("blockCount=%d want 2", s.BlockCount)
	}
}

func TestPersistReload(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	if err := s.InitGenesis(); err != nil {
		t.Fatal(err)
	}
	s.Difficulty = testDifficulty

	miner := hexAddr('b')
	block, _, _ := s.BuildBlockTemplate(miner)
	mineBlock(t, block)
	if err := s.SubmitBlock(block); err != nil {
		t.Fatal(err)
	}

	s2 := NewState(dir)
	if err := s2.Load(); err != nil {
		t.Fatal(err)
	}
	if s2.dataDir != dir {
		t.Fatalf("dataDir lost after load: %q", s2.dataDir)
	}
	if s2.GetBalance(miner) != types.BlockReward(1) {
		t.Fatalf("reload balance mismatch")
	}
	if s2.BlockCount != 2 {
		t.Fatalf("reload blockCount=%d", s2.BlockCount)
	}
}

func TestRejectInvalidPoW(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()
	s.Difficulty = testDifficulty

	block, _, _ := s.BuildBlockTemplate(hexAddr('a'))
	block.Hash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	block.Header.Nonce = 1
	if err := s.SubmitBlock(block); err == nil {
		t.Fatal("expected reject invalid pow")
	}
}

func TestRejectInvalidHeight(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()
	s.Difficulty = testDifficulty

	block, _, _ := s.BuildBlockTemplate(hexAddr('a'))
	block.Header.Height = 999
	mineBlock(t, block)
	if err := s.SubmitBlock(block); err == nil {
		t.Fatal("expected reject invalid height")
	}
}

func TestRejectFutureTimestamp(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()
	s.Difficulty = testDifficulty

	block, _, _ := s.BuildBlockTemplate(hexAddr('a'))
	block.Header.Timestamp = types.Now() + 100000
	mineBlock(t, block)
	if err := s.SubmitBlock(block); err == nil {
		t.Fatal("expected reject future timestamp")
	}
}

func TestRejectEmptySenderMint(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()
	s.Difficulty = testDifficulty

	// An empty-sender transaction is the classic unbounded-mint vector.
	mint := types.Transaction{
		To:        hexAddr('c'),
		Amount:    1 << 62, // enormous
		Fee:       0,
		Nonce:     0,
		Timestamp: types.Now(),
	}
	if err := s.AddTx(mint); err == nil {
		t.Fatal("expected reject empty-sender mint in mempool")
	}

	// Same vector embedded directly in a block must also be rejected.
	block, _, _ := s.BuildBlockTemplate(hexAddr('a'))
	block.Transactions = []types.Transaction{mint}
	block.Header.MerkleRoot = merkleRoot(block.Transactions)
	mineBlock(t, block)
	if err := s.SubmitBlock(block); err == nil {
		t.Fatal("expected reject empty-sender mint in block")
	}
	if s.TotalSupply != 0 {
		t.Fatalf("supply changed to %d, want 0", s.TotalSupply)
	}
}

func TestSignatureVerification(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()

	kp, err := crypto.GenerateKeyPair()
	if err != nil {
		t.Fatal(err)
	}
	s.mu.Lock()
	s.Balances[kp.Address()] = 100_00000000
	s.mu.Unlock()

	tx := types.Transaction{
		From:      kp.Address(),
		To:        hexAddr('d'),
		Amount:    10_00000000,
		Fee:       1000,
		Nonce:     0,
		Timestamp: types.Now(),
	}
	signTx(t, kp, &tx)

	// Valid signed tx should be accepted.
	if err := s.AddTx(tx); err != nil {
		t.Fatalf("valid tx rejected: %v", err)
	}

	// Tampered amount invalidates the signature.
	bad := tx
	bad.Amount = 99_00000000
	if err := s.AddTx(bad); err == nil {
		t.Fatal("expected reject tampered amount")
	}

	// Wrong public key must not map to the sender address.
	kp2, _ := crypto.GenerateKeyPair()
	forged := tx
	forged.PublicKey = hex.EncodeToString(kp2.Public)
	if err := s.AddTx(forged); err == nil {
		t.Fatal("expected reject mismatched public key")
	}

	// Garbage signature encoding must be rejected.
	garbage := tx
	garbage.Signature = "deadbeef"
	if err := s.AddTx(garbage); err == nil {
		t.Fatal("expected reject malformed signature")
	}
}

func TestMempoolRejectsAggregateOverdraw(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()

	kp, _ := crypto.GenerateKeyPair()
	s.mu.Lock()
	s.Balances[kp.Address()] = 100_00000000
	s.mu.Unlock()

	// First tx spends most of the balance.
	tx1 := types.Transaction{From: kp.Address(), To: hexAddr('a'), Amount: 80_00000000, Fee: 0, Nonce: 0, Timestamp: types.Now()}
	signTx(t, kp, &tx1)
	if err := s.AddTx(tx1); err != nil {
		t.Fatalf("tx1 rejected: %v", err)
	}

	// Second tx has the next nonce but would overdraw when combined with tx1.
	tx2 := types.Transaction{From: kp.Address(), To: hexAddr('b'), Amount: 80_00000000, Fee: 0, Nonce: 1, Timestamp: types.Now()}
	signTx(t, kp, &tx2)
	if err := s.AddTx(tx2); err == nil {
		t.Fatal("expected reject aggregate overdraw in mempool")
	}
}

func TestRejectTooManyTxsInBlock(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()
	s.Difficulty = testDifficulty

	miner := hexAddr('a')
	block, _, err := s.BuildBlockTemplate(miner)
	if err != nil {
		t.Fatal(err)
	}
	// Craft more txs than MaxTxsPerBlock using an empty transaction list is not
	// possible directly; we build a synthetic over-limit list of no-op txs.
	txs := make([]types.Transaction, MaxTxsPerBlock+1)
	block.Transactions = txs
	block.Header.MerkleRoot = merkleRoot(txs)
	mineBlock(t, block)
	if err := s.SubmitBlock(block); err == nil {
		t.Fatal("expected reject block with too many transactions")
	}
}

func TestSignedTxTransfersInBlock(t *testing.T) {
	dir := t.TempDir()
	s := NewState(dir)
	_ = s.InitGenesis()
	s.Difficulty = testDifficulty

	kp, _ := crypto.GenerateKeyPair()
	recipient := hexAddr('e')
	s.mu.Lock()
	s.Balances[kp.Address()] = 100_00000000
	s.mu.Unlock()

	tx := types.Transaction{
		From:      kp.Address(),
		To:        recipient,
		Amount:    40_00000000,
		Fee:       1_00000000,
		Nonce:     0,
		Timestamp: types.Now(),
	}
	signTx(t, kp, &tx)
	if err := s.AddTx(tx); err != nil {
		t.Fatalf("AddTx: %v", err)
	}

	miner := hexAddr('f')
	block, _, err := s.BuildBlockTemplate(miner)
	if err != nil {
		t.Fatal(err)
	}
	if len(block.Transactions) != 1 {
		t.Fatalf("expected 1 tx in template, got %d", len(block.Transactions))
	}
	mineBlock(t, block)
	if err := s.SubmitBlock(block); err != nil {
		t.Fatalf("SubmitBlock: %v", err)
	}

	if got := s.GetBalance(recipient); got != 40_00000000 {
		t.Fatalf("recipient balance=%d want 4000000000", got)
	}
	if got := s.GetBalance(kp.Address()); got != 59_00000000 {
		t.Fatalf("sender balance=%d want 5900000000", got)
	}
	if got := s.GetNonce(kp.Address()); got != 1 {
		t.Fatalf("sender nonce=%d want 1", got)
	}
	// Miner gets coinbase (50) + fee (1).
	if got := s.GetBalance(miner); got != 51_00000000 {
		t.Fatalf("miner balance=%d want 5100000000", got)
	}
}

func TestMain(m *testing.M) {
	os.Exit(m.Run())
}
