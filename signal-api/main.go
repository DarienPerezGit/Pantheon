package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
)

// ─── Types ───────────────────────────────────────────────────────────────────

// [MIGRATION] El campo Issuer es nuevo: informa al Consumer el emisor del USDC.
type PaymentRequired struct {
	Error       string `json:"error"`
	Amount      string `json:"amount"`
	Asset       string `json:"asset"`  // [MIGRATION] antes: "XLM", ahora: "USDC"
	Issuer      string `json:"issuer"` // [MIGRATION] nuevo campo: public key del emisor
	Destination string `json:"destination"`
	Network     string `json:"network"`
	Memo        string `json:"memo"`
}

type Signal struct {
	Pair            string  `json:"pair"`
	Signal          string  `json:"signal"`
	Confidence      float64 `json:"confidence"`
	Reasoning       string  `json:"reasoning"`
	Timestamp       string  `json:"timestamp"`
	ValidForSeconds int     `json:"valid_for_seconds"`
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

type TxEntry struct {
	Time   string `json:"time"`
	Cycle  int    `json:"cycle"`
	Amount string `json:"amount"`
	Hash   string `json:"hash"`
	Pair   string `json:"pair"`
	Signal string `json:"signal"`
}

type AgentState struct {
	Cycle        int       `json:"cycle"`
	LastSignal   string    `json:"last_signal"`
	Confidence   float64   `json:"confidence"`
	Reasoning    string    `json:"reasoning"`
	Pair         string    `json:"pair"`
	ServerWallet string    `json:"server_wallet"`
	SignalPrice  string    `json:"signal_price"`
	UpdatedAt    string    `json:"updated_at"`
	TxLog        []TxEntry `json:"tx_log"`
}

// ─── Constants ───────────────────────────────────────────────────────────────
// [MIGRATION] USDC en Stellar Testnet.
// Emisor: Circle / Centre — clave pública oficial para la red de pruebas.
// Fuente: https://developers.stellar.org/docs/tokens/usdc
const usdcIssuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

// ─── State ───────────────────────────────────────────────────────────────────

var (
	serverPublicKey string
	signalPrice     string
	horizonURL      string
	anthropicKey    string

	signals = []string{"BUY", "SELL", "HOLD"}

	reasonings = []string{
		"RSI oversold, momentum positivo en últimas 4h",
		"Breakout confirmado sobre resistencia clave",
		"Volumen bajo, esperar confirmación antes de entrar",
		"MACD cruzando señal alcista, confluencia con EMA 200",
		"Soporte fuerte en nivel actual, risk/reward favorable",
	}

	// dashboard state — protected by stateMu
	stateMu    sync.RWMutex
	agentState = &AgentState{
		LastSignal: "—",
		Pair:       "BTC-USDC",
		TxLog:      []TxEntry{},
	}

	// anti-replay: tracks TX hashes already consumed (in-memory, resets on restart)
	usedTxMu     sync.Mutex
	usedTxHashes = make(map[string]struct{})
)

// ─── Main ────────────────────────────────────────────────────────────────────

func main() {
	// Load .env from one level up: signal-api/ → Pantheon/.env
	for _, p := range []string{".env", "../.env", "../../.env"} {
		if err := godotenv.Load(p); err == nil {
			log.Printf("[CONFIG] Loaded env from: %s", p)
			break
		}
	}

	serverPublicKey = os.Getenv("SERVER_PUBLIC_KEY")
	signalPrice = os.Getenv("SIGNAL_PRICE_USDC")
	horizonURL = os.Getenv("HORIZON_URL")
	anthropicKey = os.Getenv("ANTHROPIC_API_KEY")

	if serverPublicKey == "" {
		log.Fatal("[FATAL] SERVER_PUBLIC_KEY is not set")
	}
	if signalPrice == "" {
		signalPrice = "0.10"
	}
	if horizonURL == "" {
		horizonURL = "https://horizon-testnet.stellar.org"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/signal", signalHandler)
	mux.HandleFunc("/state", stateHandler)
	// Serve the dashboard static files at /ui/
	mux.Handle("/ui/", http.StripPrefix("/ui/", http.FileServer(http.Dir("../dashboard"))))

	addr := ":8080"
	log.Printf("[START] Signal API listening on %s", addr)
	log.Printf("[CONFIG] Server wallet : %s", serverPublicKey)
	log.Printf("[CONFIG] Signal price  : %s USDC", signalPrice)
	log.Printf("[CONFIG] Horizon URL   : %s", horizonURL)
	if anthropicKey != "" {
		log.Printf("[CONFIG] Claude API    : enabled (claude-sonnet-4-20250514)")
	} else {
		log.Printf("[CONFIG] Claude API    : disabled (mock signals)")
	}

	if err := http.ListenAndServe(addr, corsMiddleware(mux)); err != nil {
		log.Fatalf("[FATAL] Server error: %v", err)
	}
}

// ─── CORS Middleware ─────────────────────────────────────────────────────────

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Payment")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":    "ok",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func signalHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pair := strings.ToUpper(r.URL.Query().Get("pair"))
	if pair == "" {
		pair = "BTC-USDC"
	}

	ts := time.Now().UTC().Format(time.RFC3339)
	log.Printf("[%s] [REQUEST] GET /signal?pair=%s from %s", ts, pair, r.RemoteAddr)

	txHash := r.Header.Get("X-Payment")
	if txHash == "" {
		log.Printf("[%s] [402] No X-Payment header — returning payment instructions", ts)
		respondPaymentRequired(w, pair)
		return
	}

	// ── Anti-replay guard ────────────────────────────────────────────────────
	usedTxMu.Lock()
	_, seen := usedTxHashes[txHash]
	usedTxMu.Unlock()
	if seen {
		log.Printf("[%s] [REPLAY] TX already consumed: %s", ts, txHash)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "TX hash already used",
			"details": "This transaction has already been consumed. Submit a new payment.",
			"tx_hash": txHash,
		})
		return
	}
	// ─────────────────────────────────────────────────────────────────────────

	log.Printf("[%s] [VERIFY] Checking tx: %s", ts, txHash)
	valid, err := verifyPayment(txHash, pair)
	if err != nil {
		log.Printf("[%s] [ERROR] Verification error: %v", ts, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Payment verification failed",
			"details": err.Error(),
		})
		return
	}
	if !valid {
		log.Printf("[%s] [REJECT] Invalid payment — wrong destination, amount, or memo", ts)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusPaymentRequired)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid payment: destination, amount, or memo does not match",
		})
		return
	}

	// Mark TX as consumed before signal delivery (prevents TOCTOU race)
	usedTxMu.Lock()
	usedTxHashes[txHash] = struct{}{}
	usedTxMu.Unlock()

	signal := generateSignalClaude(pair)
	log.Printf("[%s] [SIGNAL] %s | confidence: %.2f | pair: %s", ts, signal.Signal, signal.Confidence, signal.Pair)

	// Update live dashboard state
	recordSignal(signal, txHash)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(signal)
}

// ─── Payment Required Response ────────────────────────────────────────────────

func respondPaymentRequired(w http.ResponseWriter, pair string) {
	memo := "signal-" + strings.ToLower(pair)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusPaymentRequired)
	_ = json.NewEncoder(w).Encode(PaymentRequired{
		Error:  "Payment required",
		Amount: signalPrice,
		// [MIGRATION] Campo 'asset' cambia de "XLM" → "USDC"
		Asset: "USDC",
		// [MIGRATION] Campo nuevo: informa al Consumer cuál emisor debe usar
		Issuer:      usdcIssuer,
		Destination: serverPublicKey,
		Network:     "stellar-testnet",
		Memo:        memo,
	})
}

// ─── Dashboard State Handler ──────────────────────────────────────────────────

func stateHandler(w http.ResponseWriter, r *http.Request) {
	stateMu.RLock()
	snapshot := *agentState
	snapshot.TxLog = make([]TxEntry, len(agentState.TxLog))
	copy(snapshot.TxLog, agentState.TxLog)
	stateMu.RUnlock()

	snapshot.ServerWallet = serverPublicKey
	snapshot.SignalPrice = signalPrice

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(snapshot)
}

// recordSignal updates the in-memory dashboard state after a successful delivery.
func recordSignal(sig Signal, txHash string) {
	stateMu.Lock()
	defer stateMu.Unlock()

	agentState.Cycle++
	agentState.LastSignal = sig.Signal
	agentState.Confidence = sig.Confidence
	agentState.Reasoning = sig.Reasoning
	agentState.Pair = sig.Pair
	agentState.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	entry := TxEntry{
		Time:   time.Now().UTC().Format("15:04:05Z"),
		Cycle:  agentState.Cycle,
		Amount: signalPrice,
		Hash:   txHash,
		Pair:   sig.Pair,
		Signal: sig.Signal,
	}
	// Keep last 10 entries; newest first
	agentState.TxLog = append([]TxEntry{entry}, agentState.TxLog...)
	if len(agentState.TxLog) > 10 {
		agentState.TxLog = agentState.TxLog[:10]
	}
}

// ─── Horizon Verification ─────────────────────────────────────────────────────

func verifyPayment(txHash, pair string) (bool, error) {
	// 1. Fetch the transaction to check it's successful and has the correct memo
	txURL := fmt.Sprintf("%s/transactions/%s", horizonURL, txHash)
	txBody, status, err := get(txURL)
	if err != nil {
		return false, fmt.Errorf("horizon request failed: %w", err)
	}
	if status == 404 {
		return false, fmt.Errorf("transaction not found on Horizon (may not be confirmed yet)")
	}
	if status != 200 {
		return false, fmt.Errorf("horizon returned HTTP %d", status)
	}

	var tx map[string]interface{}
	if err := json.Unmarshal(txBody, &tx); err != nil {
		return false, fmt.Errorf("parsing transaction JSON: %w", err)
	}

	// Successful flag
	if successful, ok := tx["successful"].(bool); !ok || !successful {
		return false, nil
	}

	// Memo check: must be "signal-<pair>" e.g. "signal-btc-usdc"
	expectedMemo := "signal-" + strings.ToLower(pair)
	memo, _ := tx["memo"].(string)
	if memo != expectedMemo {
		log.Printf("[VERIFY] Memo mismatch: got %q, want %q", memo, expectedMemo)
		return false, nil
	}

	// 2. Fetch payments for this transaction to check destination + amount
	paymentsURL := fmt.Sprintf("%s/transactions/%s/payments", horizonURL, txHash)
	pBody, pStatus, err := get(paymentsURL)
	if err != nil {
		return false, fmt.Errorf("fetching payments: %w", err)
	}
	if pStatus != 200 {
		return false, fmt.Errorf("payments endpoint returned HTTP %d", pStatus)
	}

	var paymentsResp map[string]interface{}
	if err := json.Unmarshal(pBody, &paymentsResp); err != nil {
		return false, fmt.Errorf("parsing payments JSON: %w", err)
	}

	embedded, ok := paymentsResp["_embedded"].(map[string]interface{})
	if !ok {
		return false, fmt.Errorf("no _embedded in payments response")
	}
	records, ok := embedded["records"].([]interface{})
	if !ok || len(records) == 0 {
		return false, fmt.Errorf("no payment records found in transaction")
	}

	for _, rec := range records {
		record, ok := rec.(map[string]interface{})
		if !ok {
			continue
		}

		opType, _ := record["type"].(string)
		if opType != "payment" {
			continue
		}

		to, _ := record["to"].(string)
		if strings.TrimSpace(to) != strings.TrimSpace(serverPublicKey) {
			log.Printf("[VERIFY] Destination mismatch: got %q, want %q (tx: %s)", to, serverPublicKey, txHash)
			continue
		}

		// [MIGRATION] Ya no validamos asset_type == "native" (XLM).
		// Ahora verificamos que el activo sea exactamente USDC del emisor correcto.
		// Horizon expone los activos no-nativos con los campos 'asset_code' y 'asset_issuer'.
		assetCode, _ := record["asset_code"].(string)
		assetIssuer, _ := record["asset_issuer"].(string)
		if assetCode != "USDC" || assetIssuer != usdcIssuer {
			log.Printf("[VERIFY] Asset mismatch: code=%q issuer=%q — expected USDC / %s",
				assetCode, assetIssuer, usdcIssuer)
			continue
		}

		amount, _ := record["amount"].(string)
		paid, err1 := strconv.ParseFloat(amount, 64)
		expected, err2 := strconv.ParseFloat(signalPrice, 64)
		if err1 != nil || err2 != nil {
			log.Printf("[ERROR] Invalid amount format: paid=%q err1=%v expected=%q err2=%v (tx: %s)", amount, err1, signalPrice, err2, txHash)
			continue
		}
		if paid < expected {
			log.Printf("[VERIFY] Amount too low: got %s USDC, need %s (tx: %s)", amount, signalPrice, txHash)
			continue
		}
		log.Printf("[VERIFY] ✓ Valid payment: %s USDC to %s (memo: %s, tx: %s)", amount, to, memo, txHash)
		return true, nil
	}

	return false, nil
}

// amountSufficient returns true if got >= required (both as decimal strings)
func amountSufficient(got, required string) bool {
	var g, r float64
	_, _ = fmt.Sscanf(got, "%f", &g)
	_, _ = fmt.Sscanf(required, "%f", &r)
	return g >= r
}

// get performs an HTTP GET and returns body bytes + status code
func get(url string) ([]byte, int, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(url) // #nosec G107 — URL constructed from trusted env vars
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}

// ─── Mock Signal Generator (fallback) ────────────────────────────────────────

func generateSignal(pair string) Signal {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	sig := signals[rng.Intn(len(signals))]
	// confidence between 0.50 and 0.95, rounded to 2 decimals
	raw := 0.50 + rng.Float64()*0.45
	confidence := float64(int(raw*100)) / 100

	return Signal{
		Pair:            pair,
		Signal:          sig,
		Confidence:      confidence,
		Reasoning:       reasonings[rng.Intn(len(reasonings))],
		Timestamp:       time.Now().UTC().Format(time.RFC3339),
		ValidForSeconds: 300,
	}
}

// ─── Claude Signal Generator ─────────────────────────────────────────────────

// generateSignalClaude calls Claude API to produce a signal; falls back to mock.
func generateSignalClaude(pair string) Signal {
	if anthropicKey == "" {
		log.Printf("[CLAUDE] No API key — using mock signal")
		return generateSignal(pair)
	}
	sig, err := callClaudeSignal(pair)
	if err != nil {
		log.Printf("[CLAUDE] Error: %v — falling back to mock", err)
		return generateSignal(pair)
	}
	switch sig.Signal {
	case "BUY", "SELL", "HOLD":
		// valid
	default:
		log.Printf("[CLAUDE] Invalid signal value %q — falling back to mock", sig.Signal)
		return generateSignal(pair)
	}
	log.Printf("[CLAUDE] Signal generated: %s | confidence: %.2f", sig.Signal, sig.Confidence)
	return sig
}

// mockMarketData returns plausible but simulated market data for a pair.
func mockMarketData(pair string) (price, volume, rsi float64) {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	basePrices := map[string]float64{
		"BTC-USDC": 82000,
		"ETH-USDC": 1600,
		"XLM-USDC": 0.22,
	}
	base, ok := basePrices[pair]
	if !ok {
		base = 100
	}
	price = base * (1 + (rng.Float64()-0.5)*0.04) // ±2% random spread
	volume = 500000 + rng.Float64()*4500000
	rsi = 25 + rng.Float64()*50 // 25–75
	return
}

// callClaudeSignal POSTs to the Anthropic API and parses the signal JSON.
func callClaudeSignal(pair string) (Signal, error) {
	price, volume, rsi := mockMarketData(pair)

	prompt := fmt.Sprintf(
		`You are a trading signal generator. Analyze this market data and respond with a JSON object only — no markdown, no explanation outside the JSON.

Pair: %s
Price: %.4f USDC
Volume 24h: %.0f
RSI (14): %.1f
Timestamp: %s

Respond with exactly this JSON structure:
{"signal": "BUY"|"SELL"|"HOLD", "confidence": <float 0.50–0.95>, "reasoning": "<one sentence in Spanish>"}`,
		pair, price, volume, rsi, time.Now().UTC().Format(time.RFC3339),
	)

	reqBody := map[string]interface{}{
		"model":      "claude-sonnet-4-20250514",
		"max_tokens": 128,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return Signal{}, fmt.Errorf("marshalling Claude request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return Signal{}, fmt.Errorf("building Claude request: %w", err)
	}
	req.Header.Set("x-api-key", anthropicKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return Signal{}, fmt.Errorf("calling Anthropic API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return Signal{}, fmt.Errorf("reading Claude response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return Signal{}, fmt.Errorf("Anthropic API returned HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var claudeResp struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(respBody, &claudeResp); err != nil {
		return Signal{}, fmt.Errorf("parsing Anthropic response envelope: %w", err)
	}
	if len(claudeResp.Content) == 0 {
		return Signal{}, fmt.Errorf("empty content in Anthropic response")
	}

	text := strings.TrimSpace(claudeResp.Content[0].Text)
	// Strip markdown code fences if model adds them
	if strings.HasPrefix(text, "```") {
		parts := strings.SplitN(text, "\n", 2)
		if len(parts) == 2 {
			text = strings.TrimSuffix(strings.TrimSpace(parts[1]), "```")
		}
	}

	var signalData struct {
		Signal     string  `json:"signal"`
		Confidence float64 `json:"confidence"`
		Reasoning  string  `json:"reasoning"`
	}
	if err := json.Unmarshal([]byte(text), &signalData); err != nil {
		return Signal{}, fmt.Errorf("parsing signal JSON from Claude (%q): %w", text, err)
	}

	return Signal{
		Pair:            pair,
		Signal:          strings.ToUpper(signalData.Signal),
		Confidence:      signalData.Confidence,
		Reasoning:       signalData.Reasoning,
		Timestamp:       time.Now().UTC().Format(time.RFC3339),
		ValidForSeconds: 300,
	}, nil
}
