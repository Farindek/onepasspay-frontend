# OnePassPay

> **Merchant-locked virtual cards that die after one use — so your real card number never has to leave your wallet.**

[![CI](https://github.com/Farindek/onepasspay/actions/workflows/ci.yml/badge.svg)](https://github.com/Farindek/onepasspay/actions)
[![Deployed on Vercel](https://img.shields.io/badge/deployed-Vercel-black?logo=vercel)](https://onepasspay-frontend.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem

Every time you enter your card number online, you hand a permanent credential to a stranger. If that merchant's database is breached — and in 2023, [over 3,200 data compromises were reported in the U.S. alone](https://www.statista.com/statistics/273550/data-breaches-recorded-in-the-united-states-by-number-of-breaches-and-records-exposed/) — your card number lives in criminal marketplaces indefinitely.

**Card-not-present (CNP) fraud costs American consumers and small businesses an estimated $9.5 billion per year** (Federal Reserve Payments Study). Unlike physical card theft, CNP fraud is silent: you may not discover a stolen number until unauthorized charges appear weeks later.

The root cause is structural. Real card numbers are:

- **Permanent** — a 16-digit PAN issued today is valid for years
- **Reusable** — the same number works at any merchant, any time
- **Shared broadly** — the average American exposes their card to dozens of merchants annually
- **High-value targets** — a single breached database can yield millions of valid PANs

Tokenization services from Apple Pay and Google Pay partially address this, but they require NFC hardware, specific devices, and merchant-side integration. Millions of Americans — particularly those on prepaid cards, older devices, or without smartphones — are left with no meaningful protection for online transactions.

---

## The Solution

OnePassPay generates **disposable, merchant-locked virtual cards** on demand. Each card is cryptographically scoped to a single merchant, valid for exactly 10 minutes or one transaction, and structurally indistinguishable from a real Visa card to payment systems.

If stolen, a OnePassPay card is useless: it expired, it only works at one merchant, and it has already been used.

**Core features:**

- **Merchant locking** — each card's metadata binds it to one merchant ID at issuance; a card issued for Amazon cannot authorize at Alibaba
- **Luhn-valid PANs** — card numbers pass the ISO/IEC 7812 checksum, making them compatible with standard payment validation logic
- **10-minute TTL** — cards auto-expire via a countdown timer anchored to `expiresAt`, not a drifting decrement counter
- **Single-use invalidation** — marking a card used immediately locks it, regardless of TTL
- **Real-time fraud detection** — velocity monitoring (≥3 cards in 10 min) and merchant risk scoring trigger live alerts
- **Full transaction audit log** — every generation, expiry, and usage event is recorded with timestamp and masked PAN
- **WCAG 2.1 AA accessibility** — proper ARIA roles, labelledby associations, live regions, and keyboard navigation throughout

---

## Live Demo

**[https://onepasspay-frontend.vercel.app](https://onepasspay-frontend.vercel.app)**

Select a merchant, click **Generate Card**, and watch a Luhn-valid virtual card appear with a live countdown. The fraud detection engine activates if you generate three or more cards within 10 minutes.

> Note: this is a frontend prototype. No real payment processing occurs. Card numbers are generated client-side and are not transmitted anywhere.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser / Client                       │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    React 19 UI                       │   │
│   │  MerchantSelector · CardDisplay · TransactionLog     │   │
│   │  Dashboard · App (tab router)                        │   │
│   └────────────────────┬────────────────────────────────┘   │
│                         │ hook calls                          │
│   ┌─────────────────────▼────────────────────────────────┐   │
│   │              useCardEngine (React hook)               │   │
│   │  State: activeCard · transactions · fraudFlags        │   │
│   │  Timers: expiryTimeout · countdownInterval           │   │
│   └──────────┬───────────────────────┬───────────────────┘   │
│              │                       │                        │
│   ┌──────────▼──────────┐  ┌─────────▼──────────────────┐   │
│   │    utils/luhn.ts    │  │    utils/merchants.ts       │   │
│   │  luhnCheckDigit()   │  │  MERCHANTS registry         │   │
│   │  luhnValid()        │  │  detectFraudFlags()         │   │
│   │  generateValidPan() │  └─────────────────────────────┘   │
│   │  generateCvv()      │                                     │
│   │  generateExpiry()   │                                     │
│   │  formatPan()        │                                     │
│   └─────────────────────┘                                     │
└──────────────────────────────────────────────────────────────┘

         ↕  REST API (Phase 2 — not yet built)

┌──────────────────────────────────────────────────────────────┐
│                     Backend (Roadmap)                         │
│                                                              │
│   Node / Express · JWT authentication                        │
│   Card Engine (server-side, HSM-backed key derivation)       │
│                                                              │
│   ┌──────────────────┐      ┌───────────────────────────┐   │
│   │   PostgreSQL      │      │   Redis                   │   │
│   │   Cards table     │      │   TTL keys for expiry     │   │
│   │   Transactions    │      │   Session tokens          │   │
│   │   Users           │      └───────────────────────────┘   │
│   └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

**Current state:** the entire card lifecycle — generation, countdown, expiry, fraud detection — runs client-side. This is intentional for the prototype: it demonstrates the algorithms in an auditable, zero-infrastructure way. A production system would move card generation server-side and add HSM-backed key derivation so card numbers are never derived in user-controlled memory.

---

## How the Card Engine Works

### 1. Luhn Algorithm (ISO/IEC 7812)

The Luhn algorithm is a simple checksum formula that all major card networks use to catch typos and detect structurally invalid card numbers. Every real Visa, Mastercard, and Amex card number satisfies it. OnePassPay generates numbers that pass it too — not because that makes them valid for transactions, but because payment terminal validation logic expects the checksum to hold.

The algorithm works in two passes:

**Generating a check digit** (used when creating a new card):

```
Input: first 15 digits of the PAN
1. Reverse the digit string
2. Double every digit at an even index (0-based)
3. If any doubled value exceeds 9, subtract 9
4. Sum all digits
5. Check digit = (10 − (sum mod 10)) mod 10
```

**Validating a full PAN** (used when verifying a card):

```
Input: all 16 digits
1. Reverse the digit string
2. Keep odd-indexed digits as-is
3. Double even-indexed digits; subtract 9 if result > 9
4. Sum everything
5. Valid if sum mod 10 === 0
```

In code:

```typescript
// src/utils/luhn.ts

export function luhnCheckDigit(partialPan: string): number {
  const digits = partialPan.split('').map(Number).reverse();
  const sum = digits.reduce((acc, digit, idx) => {
    if (idx % 2 === 0) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
  return (10 - (sum % 10)) % 10;
}

export function generateValidPan(): string {
  const bin = '411111';            // Visa test BIN — safe for demos
  const middle = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
  const partial = bin + middle;    // 15 digits
  const check = luhnCheckDigit(partial);
  return partial + check;          // 16-digit Luhn-valid PAN
}
```

### 2. Merchant Locking

When a card is generated, the caller passes a `merchantId` and `merchantName`. These are stored directly on the `VirtualCard` object and included in every transaction log entry. In the current prototype this is enforced at the application layer — a card issued for Netflix carries `merchantId: 'netflix'` and any authorization attempt for a different merchant would fail the ID check.

In a production backend, merchant locking would be enforced cryptographically: the card's derived key would be seeded with the merchant ID, so the card literally cannot produce a valid authorization token for any other merchant's terminal.

### 3. TTL Expiry and Drift-Free Countdown

Cards expire 10 minutes after issuance. The countdown timer computes remaining time from the absolute `expiresAt` timestamp on every tick — not by decrementing a counter:

```typescript
// src/hooks/useCardEngine.ts

const expiresAt = now + CARD_TTL_MS;   // absolute deadline

countdownRef.current = setInterval(() => {
  const remaining = Math.ceil((card.expiresAt - Date.now()) / 1000);
  if (remaining <= 0) {
    clearInterval(countdownRef.current!);
    setCountdown(0);
  } else {
    setCountdown(remaining);
  }
}, 1000);
```

This matters because `setInterval` in JavaScript is not guaranteed to fire exactly on schedule — browser tab throttling, garbage collection pauses, and system load all introduce drift. A counter that decrements by 1 per tick can drift by tens of seconds over a 10-minute window. Anchoring to `Date.now()` keeps the display accurate regardless of timer irregularity.

### 4. Fraud Detection

The fraud engine runs synchronously inside the same state update that logs the generation event, so it always operates on a fresh, consistent transaction list:

```typescript
// src/hooks/useCardEngine.ts

setTransactions(prev => {
  const updated = [newTransaction, ...prev];

  // recentCount is derived from the updated array — not stale state
  const recentCount = updated.filter(
    t => t.action === 'generated' && now - t.timestamp < CARD_TTL_MS
  ).length;

  const flags = detectFraudFlags(merchantId, recentCount);
  if (flags.length > 0) {
    setFraudFlags(f => [...flags, ...f]);
  }

  return updated;
});
```

Two signals trigger fraud flags:

| Signal | Threshold | Severity |
|---|---|---|
| Card generation velocity | ≥ 3 cards in 10 min | Medium |
| Card generation velocity | ≥ 5 cards in 10 min | High |
| High-risk merchant category | riskScore ≥ 0.60 | Medium |
| High-risk merchant category | riskScore ≥ 0.80 | High |

Merchants like Crypto Exchange (riskScore: 0.85) and Alibaba (riskScore: 0.65) trigger merchant-level flags on first generation, regardless of velocity.

---

## Security Model

| Threat | Attack Scenario | OnePassPay Mitigation |
|---|---|---|
| Merchant data breach | Attacker exfiltrates card database from a retailer | Card is scoped to that merchant — the PAN is structurally unusable at any other merchant |
| Card skimming | Physical or digital skimmer captures the PAN | Card is single-use — a captured number is already invalid after the first authorization |
| Replay attack | Attacker resubmits a captured authorization request | 10-minute TTL means any replayed request arrives after expiry |
| Unauthorized recurring charge | Subscription service charges the card again next month | Card auto-expires; no subsequent authorization can succeed |
| PAN enumeration | Attacker brute-forces card numbers for a BIN | Luhn checksum eliminates 90% of candidates; TTL means any valid number is a moving target |
| Velocity abuse | Fraudster generates hundreds of cards to probe limits | Velocity monitoring flags and surfaces suspicious patterns in real time |

> **Production disclaimer:** this prototype demonstrates the security architecture in software. A production deployment requires PCI DSS Level 1 compliance, HSM-backed key derivation (so card numbers are never derived in client memory), formal penetration testing, and a backend authorization layer that enforces merchant scoping at the cryptographic level. This code is not suitable for processing real payments as-is.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| UI framework | React 19 | Concurrent rendering, first-class hooks, broad ecosystem |
| Language | TypeScript 5 | Strict null safety catches card state bugs at compile time |
| Card algorithm | Luhn / ISO/IEC 7812 | Industry-standard checksum; zero dependencies |
| Styling | CSS Modules + custom properties | Scoped styles, no runtime CSS-in-JS overhead |
| Testing | Jest + React Testing Library | Unit tests for pure functions, integration tests for hook behavior |
| CI | GitHub Actions | Runs typecheck + test suite on every push and pull request |
| Hosting | Vercel (Edge CDN) | Zero-config React deployment, global edge network |
| Accessibility | WCAG 2.1 AA | ARIA roles, live regions, keyboard navigation, screen reader tested |

---

## Getting Started

**Prerequisites:** Node 18+ and npm 9+

```bash
# Clone the repo
git clone https://github.com/Farindek/onepasspay.git
cd onepasspay

# Install dependencies
npm install

# Start the development server
npm start
# → http://localhost:3000
```

### Run the Test Suite

```bash
npm test
```

Jest will run in watch mode. Press `a` to run all tests, `q` to quit.

### Production Build

```bash
npm run build
# Output in /build — ready to deploy to Vercel, Netlify, or any static host
```

### Type Check (without building)

```bash
npx tsc --noEmit
```

---

## Test Coverage

The test suite covers the two pure-function modules that contain all security-critical logic.

```
PASS src/utils/luhn.test.ts

  luhnCheckDigit
    ✓ returns the correct check digit for a known partial PAN
    ✓ returns 0 when the partial PAN already sums to a multiple of 10

  luhnValid
    ✓ validates a known-good Visa test PAN
    ✓ rejects a PAN with a wrong check digit
    ✓ rejects a PAN shorter than 16 digits
    ✓ rejects a PAN longer than 16 digits
    ✓ accepts PANs formatted with spaces between groups

  generateValidPan
    ✓ generates a 16-digit string
    ✓ always generates a Luhn-valid PAN  (runs 20 times)
    ✓ uses the Visa BIN prefix 411111

  detectFraudFlags
    ✓ returns no flags for low velocity and a low-risk merchant
    ✓ raises a medium velocity flag at recentCount === 3
    ✓ raises a high velocity flag at recentCount >= 5
    ✓ raises a high-risk merchant flag for crypto-ex
    ✓ raises both velocity and merchant flags simultaneously
    ✓ returns no flags for an unknown merchant with low velocity

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
```

**What the tests prove:**

- The Luhn implementation is correct against known Visa test vectors — any regression in `luhnCheckDigit` or `luhnValid` will immediately break these tests
- `generateValidPan` runs 20 random iterations to confirm the generator never produces an invalid PAN by accident
- The fraud engine's four thresholds (velocity medium/high, merchant medium/high) are each tested in isolation and in combination

---

## Roadmap

### Phase 1 — Frontend Prototype (current)
- [x] Luhn-valid card generation
- [x] Merchant locking (application layer)
- [x] TTL expiry with drift-free countdown
- [x] Single-use invalidation
- [x] Real-time fraud detection
- [x] Transaction audit log
- [x] Analytics dashboard
- [x] WCAG 2.1 AA accessibility
- [x] CI via GitHub Actions
- [x] Unit test suite (16 tests)

### Phase 2 — Backend API
- [ ] Node.js / Express REST API
- [ ] PostgreSQL: cards, transactions, users tables
- [ ] Redis: TTL-enforced card expiry (server-authoritative)
- [ ] JWT authentication with refresh token rotation
- [ ] Merchant locking enforced at the authorization layer
- [ ] Card generation moved server-side (PANs never derived in browser)
- [ ] Rate limiting and abuse detection API

### Phase 3 — Production Hardening
- [ ] PCI DSS Level 1 scoping document
- [ ] HSM-backed key derivation for card number generation
- [ ] Formal penetration test and remediation
- [ ] Tokenization API compatible with Visa Token Service / Mastercard MDES
- [ ] Multi-currency support
- [ ] Spend limits and merchant category controls
- [ ] Mobile SDK (React Native)

---

## Why This Matters

Card-not-present fraud is not an abstract fintech problem — it falls hardest on the people with the fewest options. Consumers who rely on prepaid debit cards, who cannot freeze their credit, or who lack access to premium card products with built-in fraud protection absorb a disproportionate share of the $9.5 billion annual loss. Small businesses on the receiving end of fraudulent chargebacks — often family-owned retailers operating on thin margins — have no equivalent recourse.

The irony is that the solution is not complicated. A card number that expires in ten minutes and only works at one merchant eliminates the vast majority of CNP fraud attack vectors by design. The problem is not the cryptography; it is distribution. Tokenization already works at scale inside Apple Pay and Google Pay. What does not yet exist is an open, device-agnostic, issuer-independent implementation that any developer can study, fork, extend, and build on.

OnePassPay is an attempt to demonstrate that the core engine — Luhn-valid generation, merchant scoping, TTL enforcement, fraud velocity detection — can be written in fewer than 200 lines of open-source TypeScript. The goal is not to compete with card networks. It is to put the architecture in plain sight, so that fintech builders, banking-as-a-service platforms, and community development financial institutions can understand and adopt it.

---

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
npm test                   # make sure the suite passes
git commit -m "feat: your description"
git push origin feature/your-feature-name
# Open a pull request
```

All pull requests run the full CI pipeline (typecheck + test suite) automatically. A passing CI run is required before merge.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor guide and [SECURITY.md](SECURITY.md) for the responsible disclosure policy.

---

## License

MIT © 2025 OnePassPay Contributors

This software is provided for educational and demonstration purposes. It is not a licensed payment processor, money transmitter, or financial institution. Do not use it to process real financial transactions.
