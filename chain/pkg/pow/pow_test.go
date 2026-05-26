package pow

import "testing"

func TestVerifyAndMine(t *testing.T) {
	prefix := HeaderPrefix(1, []string{"abc"}, 1717200000, 4,
		"0000000000000000000000000000000000000000000000000000000000000000",
		"velx1test", 1, "")
	nonce, hash := Mine(prefix, 4, 0)
	if hash == "" {
		t.Fatal("mine returned empty")
	}
	if !Verify(hash, 4) {
		t.Fatalf("mined hash failed verify: %s", hash)
	}
	_ = nonce
}

func TestTargetMonotonic(t *testing.T) {
	t4 := Target(4)
	t8 := Target(8)
	if t8.Cmp(t4) >= 0 {
		t.Fatal("higher difficulty should have lower target")
	}
}
