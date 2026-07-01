# Phase 1 — `agent-core` + first vertical slice

Goal (implementation.md §3): the shared provider wrapper plus a working thin
end-to-end slice — **Forensics Agent** (real on-chain checks) + **Orchestrator**
that hires and pays it, producing one real Trust Receipt entry.

Status: **Code complete and verified up to the live-settlement boundary.** The
only thing left for a real USDC round-trip is registering the provider services
on the dashboard and pasting their real service IDs into `.env` (account-owner
step — the SDK has no programmatic service registration).

---

## 1. What was built

- `packages/agent-core/src/index.ts` — barrel so `@pirton/agent-core` resolves.
- **Forensics provider** (`agents/forensics/`):
  - `checks.ts` — deterministic on-chain sweep (no LLM for facts, per §2.5):
    contract-vs-EOA, **EIP-7702 delegated-EOA detection**, ERC-20 identity,
    ownership-renounce, dangerous-capability detection via **bytecode 4-byte
    selector scan** (mint / pause / blacklist / mutable-fee setters), and
    source-verification status (explorer, optional).
  - `explorer.ts` — Etherscan v2 unified client (chainid 8453), degrades to
    null when `EXPLORER_API_KEY` is unset.
  - `handler.ts` — wraps the sweep into a `SpecialistHandler`; LLM only phrases
    a one-line summary over the computed findings.
  - `index.ts` — CAP provider entrypoint (`npm run forensics:serve`).
  - `selftest.ts` — offline handler run against a real address via public RPC
    (`npm run forensics:selftest -- 0x<addr>`).
- **Orchestrator** (`agents/orchestrator/`):
  - `index.ts` — classify → route (cost-aware, only specialists with a
    configured service id) → hire (parallel) → pay → collect → fuse → print the
    signed Trust Receipt (`npm run orchestrate -- "<addr or text>"`).
  - `smoke.ts` — connect/close every configured SDK key (`npm run smoke:keys`).

## 2. Verified

- `npm run typecheck` — clean across all packages + agents.
- `npm run build:sdk` — vendored SDK builds (`tsc` exit 0).
- `npm run smoke:keys` → **5 ok, 0 failed** — all five agent SDK keys connect to
  the live CAP WebSocket gateway (`wss://api.croo.network/ws`). The Phase 0
  "blocked on access" item is resolved: keys are provisioned and valid.
- `npm run forensics:selftest` against live Base RPC:
  - USDC (`0x8335…2913`) → correctly reads owner (ownership not renounced).
  - vitalik.eth (`0xd8dA…6045`) → correctly flags an **EIP-7702 delegation** to
    `0x5A7F…f6d6` (a wallet-drainer-relevant signal), not a false "contract".
  - WETH predeploy → no red flags.
- `npm run orchestrate -- 0x8335…2913` runs end-to-end through classification and
  reaches the live `negotiateOrder` call.

## 3. The one remaining blocker (account owner)

`negotiateOrder` returns `SERVICE_NOT_FOUND (404)` because the `.env`
`CROO_SERVICE_ID_*` values (`svc-new-<timestamp>`) are placeholders — the CAP
backend has no services under those ids.

To close the live USDC slice:
1. On `agent.croo.network`, register the **forensics** provider service under the
   forensics agent (flat-priced, small USDC).
2. Copy its real service id into `CROO_SERVICE_ID_FORENSICS` in `.env`.
3. Fund the **orchestrator agent's AA wallet** with a few USDC on Base.
4. Terminal A: `npm run forensics:serve`  ·  Terminal B:
   `npm run orchestrate -- 0x<token>` → real `payOrder` escrow settles and a
   Trust Receipt prints with the pay-tx link.

## 4. Known item to verify during live settlement

In `agent-core/orchestrator.ts` the class-level `OrderCreated` handler runs
before the per-hire binder, so `paying`/`paid` progress events and the in-memory
`payTxHash` can be missed (the receipt still recovers the pay tx via
`getOrder`). Harmless for the receipt, but the live "USDC counter ticks" UI
moment (Phase 3) depends on those progress emits — re-check event ordering once a
real order flows, and if needed key the waiter by `negotiationId` up front.
