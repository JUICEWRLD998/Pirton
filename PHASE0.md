# Phase 0 — Ground Truth

Goal (per implementation.md §3): verify the real CROO SDK before writing product code —
exact method signatures, the CAP order flow, how reputation is read, and that a real
USDC escrow settles. This doc records what was **verified from the actual SDK source**
(`@croo-network/sdk` v0.2.0, cloned into `vendor/node-sdk/`) versus what still needs
**live credentials** only the account owner can provide.

Status: **SDK surface fully mapped and building. Live-settlement run is blocked on access
(SDK keys + funded wallet).**

---

## 1. What was verified (no keys needed)

- Cloned `github.com/CROO-Network/node-sdk` (latest, commit `b477e56`). MIT, TypeScript.
- **Builds clean**: `npm install && npm run build` → `tsc` exit 0.
- Package name is **`@croo-network/sdk`** (matches the plan). Version **0.2.0**. Deps: `ethers@^6`, `ws@^8`. Node ≥18.
- Copied into `vendor/node-sdk/` as living reference (its `node_modules`/`dist` are gitignored).

### 1.1 The client
One class, `AgentClient(config, sdkKey)` — `agent-client.ts`.
```ts
new AgentClient({ baseURL, wsURL?, rpcURL?, logger? }, "croo_sk_...")
```
Account setup (agent creation, service registration, SDK-Key issuance) is **NOT in the SDK** —
it's done in the CROO Dashboard (`agent.croo.network`).

### 1.2 Verified method signatures (camelCase — the plan's PascalCase names are informal)
Requester:
- `negotiateOrder({ serviceId, requirements?, metadata? })` → `Negotiation` (`.negotiationId`)
- `payOrder(orderId)` → `{ order, txHash }`  *(pre-checks on-chain USDC balance, then escrows)*
- `getDelivery(orderId)` → `Delivery` (`.deliverableText` / `.deliverableSchema` / `.contentHash`)
- `getDownloadURL(objectKey)` → temp URL (30 min)

Provider:
- `acceptNegotiation(negotiationId)` → `{ negotiation, order }` *(backend auto-submits createOrder on-chain)*
- `deliverOrder(orderId, { deliverableType, deliverableText?, deliverableSchema? })` → `{ order, delivery, txHash }`
- `uploadFile(fileName, body)` → objectKey

Both: `getOrder`, `listOrders(opts)`, `getNegotiation`, `listNegotiations(opts)`, `rejectOrder`, `rejectNegotiation`, `acceptNegotiationWithFundAddress` (fund-transfer services only).

### 1.3 Events (WebSocket) — `ws.ts`, `types.ts`
`const stream = await client.connectWebSocket(); stream.on(EventType.X, cb); stream.onAny(cb); stream.close();`

| `EventType` const | wire value |
|---|---|
| `NegotiationCreated` | `order_negotiation_created` |
| `OrderCreated` | `order_created` |
| `OrderPaid` | `order_paid` |
| `OrderCompleted` | `order_completed` |
| (+ `NegotiationRejected/Expired`, `OrderRejected/Expired`) | … |

Event object fields are **snake_case**: `e.order_id`, `e.negotiation_id`, `e.status`, `e.raw`.
These are the events that drive the UI "hiring board" (§2.7 of the plan).

### 1.4 The order lifecycle (verified end-to-end in source)
```
requester.negotiateOrder()  ─▶  provider.acceptNegotiation()  [backend createOrder on-chain]
        ◀── OrderCreated ────
requester.payOrder()          [USDC escrow locked, returns txHash]
        ── OrderPaid ──▶       provider.deliverOrder()  [returns txHash, server sets contentHash]
        ◀── OrderCompleted ──
requester.getDelivery()
```

---

## 2. Deviations from implementation.md — act on these

1. **Chain is Base MAINNET, not "testnet."** `rpcURL` and the pre-pay balance check both default
   to `https://mainnet.base.org` (`agent-client.ts:51`, `balance.ts:4`). CAP launched on Base
   (mainnet). Implication: escrow uses **real USDC** (small amounts), there is **no faucet**.
   Gas is still sponsored (AA wallet), only USDC is needed. → **Update all "testnet" wording**
   in the plan/README/demo, and budget a few real USDC. *(Confirm in dashboard: a testnet mode is
   on CROO's roadmap but not wired into SDK v0.2.0.)*

2. **No reputation field exists in the SDK.** `Order`/`Negotiation`/`Delivery` carry no score.
   Reputation must be **derived from job history** via `listOrders({ agentId, status: 'completed' })`
   (count/volume of completed orders), or read from a dashboard/API endpoint outside the SDK.
   → Phase 2 risk-fusion uses a **transparent derived trust weight**, labeled honestly on the
   Trust Receipt (this is exactly the §6 fallback — now confirmed as the primary path).

3. **Proof anchor = `Delivery.contentHash` + in-payload proof.** Deliverables are only
   `Text | Schema` — there's no dedicated "proof hash" arg. Put the result hash / execution log
   **inside** the deliverable JSON, and use the server-set `contentHash` as the Trust Receipt anchor.

4. **One SDK key = one live WS connection.** A duplicate-key WS connection is dropped as a policy
   violation with no reconnect (`ws.ts:96`). → Each of the **5 agents needs its own agent + SDK key**
   (4 providers + orchestrator). This matches the plan; now it's a hard requirement, not a nicety.

5. **Access is gated by the Pioneers Program**, not self-serve. SDK keys are issued after applying
   at `pioneer.croo.network` and approval via CROO Discord. The published program window was
   Apr 15–May 12 2026 — **confirm current access / key issuance** before Phase 1.

6. **Flat-priced services use `acceptNegotiation`.** `acceptNegotiationWithFundAddress` +
   `require_fund_transfer` is a separate "fund transfer" mode we do **not** use for our 4 services.

7. Deposit USDC to each agent's **AA wallet address** (from the dashboard), *not* the controller
   address — the SDK checks the AA wallet balance before `payOrder`.

---

## 3. Blocked on the account owner (cannot be done from code)

These are the remaining Phase 0 line-items; they require your CROO account and a funded wallet:

- [ ] **Confirm Pioneers/SDK access** is active and you can mint keys (see deviation #5).
- [ ] On `agent.croo.network`, **create 5 agents** and register **4 provider services**
      (forensics, auditor, reputation, claims) + the orchestrator (requester).
- [ ] **Generate 5 SDK keys**; drop them into `.env` (template in `.env.example`).
- [ ] Note each service's **service ID** (orchestrator's `CROO_TARGET_SERVICE_ID` per hire).
- [ ] **Fund the orchestrator's AA wallet** with a few USDC on Base (real; small).
- [ ] **Confirm chain** (mainnet vs any testnet toggle) shown in the dashboard.

Once keys + a funded wallet exist, the final Phase 0 check is a real
`negotiateOrder → payOrder → deliverOrder → getDelivery` round-trip with a USDC escrow that
settles (verify the `payOrder` txHash on the Base explorer). The `vendor/node-sdk/examples/`
`provider.ts` + `requester.ts` run this directly:
```
cd vendor/node-sdk && npm install
# provider terminal:  (env: CROO_SDK_KEY = a provider key)
npx ts-node examples/provider.ts
# requester terminal: (env: CROO_SDK_KEY = orchestrator key, CROO_TARGET_SERVICE_ID = provider's service)
npx ts-node examples/requester.ts
```

---

## 4. Green light for Phase 1

The SDK is real, builds, and its surface is fully mapped — enough to build `agent-core`
(the shared provider wrapper) and the orchestrator against **verified signatures** now, wiring
in live keys the moment the account items in §3 are done. Nothing in the SDK contradicts the
core architecture; the only material change is **mainnet/real-USDC + derived-reputation**, both
already in the plan's fallback ladder.

Sources: [CAP on Base](https://croo.network/) · [Agent Store / Dashboard](https://agent.croo.network/) ·
[Pioneers Program](https://pioneer.croo.network/) · [Docs roadmap](https://docs.croo.network/roadmap/timeline-and-roadmap)
