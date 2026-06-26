# Helixra

**Confidential token distribution workspace — Zama Developer Program Season 3**

Helixra is a three-panel workspace for confidential token distribution built on the [TokenOps SDK](https://tokenops.xyz) and [Zama Protocol](https://zama.org). Senders upload a CSV of recipients, amounts are FHE-encrypted and pushed via confidential disperse, and recipients connect to decrypt only their own allocation.

---

## What TokenOps provides
- Wallet-mode confidential disperse (`ConfidentialDisperseClient`)
- Per-user subwallet registration and operator approval
- EIP-712 user decryption flow
- Preflight readiness checks (`preflightDisperse`)

## What Helixra adds
- **Three-panel workspace UX** — recipient list / preflight panel / analytics
- **HelixraAnalytics contract** — FHE-native onchain analytics (encrypted running total + average allocation) computed via `FHE.add` and `FHE.div` on encrypted handles
- **Distribution health panel** — claimed / remaining / completion % 
- **Allocation lifecycle timeline** — Assigned → Encrypted → Available → Decrypted → Claimed
- **Allocation receipt** — post-decrypt summary for recipients
- **CSV with labels** — stored client-side only, never written onchain

---

## Stack

| Layer | Tech |
|---|---|
| Smart contracts | Solidity 0.8.24, FHEVM, ZamaEthereumConfig |
| Contract tooling | Hardhat, @fhevm/hardhat-plugin |
| SDK | @tokenops/sdk, @zama-fhe/relayer-sdk |
| Frontend | React, Vite, wagmi, viem |
| Deploy | Vercel (frontend), Sepolia (contracts) |

---

## Project structure

```
helixra/
  contracts/
    HelixraAnalytics.sol    ← FHE analytics contract
  scripts/
    deploy.ts               ← deployment script
  test/
    HelixraAnalytics.ts     ← contract tests
  frontend/
    src/
      pages/
        Sender.tsx          ← three-panel workspace
        Recipient.tsx       ← recipient portal
      components/
        PanelRecipients.tsx
        PanelPreflight.tsx
        PanelAnalytics.tsx
        AllocationTimeline.tsx
        AllocationReceipt.tsx
  hardhat.config.ts
  .env.example
```

---

## Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy env and fill in values
cp .env.example .env

# Compile contracts
npm run compile

# Run tests (local mock — no Sepolia needed)
npm run test

# Deploy to Sepolia
npm run deploy:sepolia
```

---

## Analytics contract integration

After calling `disperse()`, the sender receives encrypted handles in `DisperseResult.distributions[n].transferred`. Before calling `HelixraAnalytics.recordBatch()`, the sender must grant transient ACL on each handle:

```typescript
// After disperse tx confirms:
const handles = result.distributions[0].transferred;

// Grant analytics contract transient ACL on each handle
// (done via SDK's batchDiscloseHandlesToParty or manual allowTransient)
await analyticsContract.recordBatch(handles, recipients.length, distributionId);
```

The analytics contract then accumulates an encrypted running total and average. Only the sender can decrypt these via Zama's `userDecrypt`.

---

## Privacy guarantees

- Individual allocation amounts: **encrypted onchain** (ERC-7984 / FHEVM)
- Recipient addresses: **visible** (by design — wallet-mode disperse emits events)
- Distribution totals/averages: **encrypted onchain**, sender-only decrypt
- CSV labels: **client-side only**, never written onchain
- Distribution health (claimed/unclaimed count): **public plaintext**