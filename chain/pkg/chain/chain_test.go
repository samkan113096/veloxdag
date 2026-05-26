package chain

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/veloxdag/veloxdag/pkg/pow"
	"github.com/veloxdag/veloxdag/pkg/types"
)

// testDifficulty is a trivially easy difficulty used in unit tests so they
// don't spend 60 seconds mining a block.
const testDifficulty = 1

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
	// Lower difficulty so tests run in < 1 ms
	s.Difficulty = testDifficulty

	miner := "velx1testminer000000000000000000000000"
	block, prefix, err := s.BuildBlockTemplate(miner)
	if err != nil {
		t.Fatal(err)
	}
	nonce, hash := pow.Mine(prefix, block.Header.Difficulty, 0)
	if hash == "" {
		t.Fatal("failed to mine block in test")
	}
	block.Header.Nonce = nonce
	block.Hash = hash
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

	miner := "velx1persist0000000000000000000000000"
	block, prefix, _ := s.BuildBlockTemplate(miner)
	nonce, hash := pow.Mine(prefix, block.Header.Difficulty, 0)
	block.Header.Nonce = nonce
	block.Hash = hash
	_ = s.SubmitBlock(block)

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

	block, _, _ := s.BuildBlockTemplate("velx1bad000000000000000000000000000")
	block.Hash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	block.Header.Nonce = 1
	if err := s.SubmitBlock(block); err == nil {
		t.Fatal("expected reject invalid pow")
	}
}

func TestMain(m *testing.M) {
	os.Exit(m.Run())
}

func init() {
	_ = filepath.Join
}
