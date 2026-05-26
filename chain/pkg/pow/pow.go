package pow

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"math/big"
)

// Verify checks that hash meets difficulty target (leading zero bits).
func Verify(blockHash string, difficulty uint64) bool {
	if difficulty == 0 {
		return true
	}
	h, err := hex.DecodeString(blockHash)
	if err != nil || len(h) != 32 {
		return false
	}
	target := Target(difficulty)
	hashInt := new(big.Int).SetBytes(h)
	return hashInt.Cmp(target) <= 0
}

func Target(difficulty uint64) *big.Int {
	if difficulty == 0 {
		difficulty = 1
	}
	max := new(big.Int).Lsh(big.NewInt(1), 256)
	d := big.NewInt(int64(difficulty))
	if d.Sign() <= 0 {
		d = big.NewInt(1)
	}
	return new(big.Int).Div(max, d)
}

func Mine(headerPrefix []byte, difficulty uint64, startNonce uint64) (uint64, string) {
	target := Target(difficulty)
	for nonce := startNonce; nonce < startNonce+1_000_000_000; nonce++ {
		h := hashHeader(headerPrefix, nonce)
		hashInt := new(big.Int).SetBytes(h)
		if hashInt.Cmp(target) <= 0 {
			return nonce, hex.EncodeToString(h)
		}
	}
	return 0, ""
}

func hashHeader(prefix []byte, nonce uint64) []byte {
	buf := make([]byte, len(prefix)+8)
	copy(buf, prefix)
	binary.BigEndian.PutUint64(buf[len(prefix):], nonce)
	sum := sha256.Sum256(buf)
	sum2 := sha256.Sum256(sum[:])
	return sum2[:]
}

// HashBlock recomputes the PoW hash for a block header.
func HashBlock(version uint32, parents []string, timestamp int64, difficulty uint64, nonce uint64, merkleRoot, miner string, height uint64, extra string) string {
	prefix := HeaderPrefix(version, parents, timestamp, difficulty, merkleRoot, miner, height, extra)
	return hex.EncodeToString(hashHeader(prefix, nonce))
}

// VerifyBlock checks hash matches header fields and meets difficulty.
func VerifyBlock(version uint32, parents []string, timestamp int64, difficulty, nonce uint64, merkleRoot, miner string, height uint64, extra, claimedHash string) bool {
	expected := HashBlock(version, parents, timestamp, difficulty, nonce, merkleRoot, miner, height, extra)
	if expected != claimedHash {
		return false
	}
	return Verify(claimedHash, difficulty)
}

func HeaderPrefix(version uint32, parents []string, timestamp int64, difficulty uint64, merkleRoot, miner string, height uint64, extra string) []byte {
	h := sha256.New()
	_ = binary.Write(h, binary.BigEndian, version)
	for _, p := range parents {
		h.Write([]byte(p))
	}
	_ = binary.Write(h, binary.BigEndian, timestamp)
	_ = binary.Write(h, binary.BigEndian, difficulty)
	h.Write([]byte(merkleRoot))
	h.Write([]byte(miner))
	_ = binary.Write(h, binary.BigEndian, height)
	h.Write([]byte(extra))
	return h.Sum(nil)
}
