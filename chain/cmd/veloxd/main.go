package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"

	"github.com/veloxdag/veloxdag/pkg/chain"
	"github.com/veloxdag/veloxdag/pkg/rpc"
)

func main() {
	dataDir := flag.String("datadir", defaultDataDir(), "blockchain data directory")
	port := flag.Int("port", 8545, "RPC port")
	lan := flag.Bool("lan", false, "listen on all interfaces (0.0.0.0) for local network mining")
	flag.Parse()

	if err := os.MkdirAll(*dataDir, 0755); err != nil {
		log.Fatal(err)
	}

	state := chain.NewState(*dataDir)
	if err := state.Load(); err != nil {
		log.Fatal(err)
	}
	if err := state.InitGenesis(); err != nil {
		log.Fatal(err)
	}

	blocks, diff, supply, tips := state.GetChainInfo()
	log.Printf("Chain loaded: %d blocks, difficulty %d, supply %s VELX, %d tips",
		blocks, diff, formatSupply(supply), tips)

	srv := rpc.NewServer(state)
	host := "127.0.0.1"
	if *lan {
		host = "0.0.0.0"
	}
	addr := fmt.Sprintf("%s:%d", host, *port)
	log.Printf("VeloxDAG node listening on http://%s", addr)
	if *lan {
		printLANURLs(*port)
	}
	log.Printf("Fair launch PoW BlockDAG — no premine, no ICO")
	log.Fatal(http.ListenAndServe(addr, srv.Routes()))
}

func formatSupply(satoshi uint64) string {
	return fmt.Sprintf("%d.%08d", satoshi/1_00000000, satoshi%1_00000000)
}

func printLANURLs(port int) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return
	}
	log.Printf("LAN miners can use:")
	for _, iface := range ifaces {
		addrs, _ := iface.Addrs()
		for _, a := range addrs {
			if ipnet, ok := a.(*net.IPNet); ok && ipnet.IP.To4() != nil && !ipnet.IP.IsLoopback() {
				log.Printf("  http://%s:%d", ipnet.IP.String(), port)
			}
		}
	}
}

func defaultDataDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".veloxdag")
}
