package crypto

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

const AddressPrefix = "velx1"

type KeyPair struct {
	Private ed25519.PrivateKey
	Public  ed25519.PublicKey
}

func GenerateKeyPair() (*KeyPair, error) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	return &KeyPair{Private: priv, Public: pub}, nil
}

func KeyPairFromHex(privHex string) (*KeyPair, error) {
	b, err := hex.DecodeString(privHex)
	if err != nil {
		return nil, err
	}
	if len(b) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("invalid private key length")
	}
	priv := ed25519.PrivateKey(b)
	pub := priv.Public().(ed25519.PublicKey)
	return &KeyPair{Private: priv, Public: pub}, nil
}

func (kp *KeyPair) Address() string {
	h := sha256.Sum256(kp.Public)
	return AddressPrefix + hex.EncodeToString(h[:20])
}

func PubKeyToAddress(pub ed25519.PublicKey) string {
	h := sha256.Sum256(pub)
	return AddressPrefix + hex.EncodeToString(h[:20])
}

func Sign(priv ed25519.PrivateKey, msg []byte) []byte {
	return ed25519.Sign(priv, msg)
}

func Verify(pub ed25519.PublicKey, msg, sig []byte) bool {
	return ed25519.Verify(pub, msg, sig)
}

func Hash(data []byte) [32]byte {
	return sha256.Sum256(data)
}

func HashHex(data []byte) string {
	h := Hash(data)
	return hex.EncodeToString(h[:])
}

func ValidateAddress(addr string) bool {
	if !strings.HasPrefix(addr, AddressPrefix) {
		return false
	}
	_, err := hex.DecodeString(addr[len(AddressPrefix):])
	return err == nil && len(addr) == len(AddressPrefix)+40
}
