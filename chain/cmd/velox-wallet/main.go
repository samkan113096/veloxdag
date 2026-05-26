package main

import (
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/veloxdag/veloxdag/pkg/crypto"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}
	switch os.Args[1] {
	case "new":
		newWallet()
	case "address":
		showAddress()
	case "export":
		exportKey()
	default:
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`VeloxDAG Wallet CLI

  velox-wallet new              Create new wallet (prints address + saves key)
  velox-wallet address -key HEX Show address from private key
  velox-wallet export -file F   Export wallet from file`)
}

func newWallet() {
	kp, err := crypto.GenerateKeyPair()
	if err != nil {
		fmt.Println("error:", err)
		os.Exit(1)
	}
	addr := kp.Address()
	privHex := hex.EncodeToString(kp.Private)
	wallet := map[string]string{"address": addr, "privateKey": privHex}
	b, _ := json.MarshalIndent(wallet, "", "  ")
	filename := fmt.Sprintf("wallet_%s.json", addr[5:13])
	if err := os.WriteFile(filename, b, 0600); err != nil {
		fmt.Println("error saving:", err)
		os.Exit(1)
	}
	fmt.Println("New VeloxDAG wallet created!")
	fmt.Println("Address:", addr)
	fmt.Println("Saved to:", filename)
	fmt.Println("\n⚠️  Keep your private key safe. Never share it.")
}

func showAddress() {
	fs := flag.NewFlagSet("address", flag.ExitOnError)
	key := fs.String("key", "", "private key hex")
	fs.Parse(os.Args[2:])
	if *key == "" {
		fmt.Println("-key required")
		os.Exit(1)
	}
	kp, err := crypto.KeyPairFromHex(*key)
	if err != nil {
		fmt.Println("error:", err)
		os.Exit(1)
	}
	fmt.Println(kp.Address())
}

func exportKey() {
	fs := flag.NewFlagSet("export", flag.ExitOnError)
	file := fs.String("file", "", "wallet json file")
	fs.Parse(os.Args[2:])
	if *file == "" {
		fmt.Println("-file required")
		os.Exit(1)
	}
	b, err := os.ReadFile(*file)
	if err != nil {
		fmt.Println("error:", err)
		os.Exit(1)
	}
	var w map[string]string
	json.Unmarshal(b, &w)
	fmt.Println("Address:", w["address"])
	fmt.Println("Private Key:", w["privateKey"])
}
