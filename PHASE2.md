# Phase 2 — Widen the swarm

Goal (implementation.md §3): add the remaining three specialist providers on the
shared `agent-core`, wire input-classification routing to all four, and land
reputation-weighted risk fusion.

Status: **Code complete and verified offline.** All four specialists build,
typecheck, and run; the orchestrator routes to each of them. Full output for the
Auditor and Reputation agents needs two data-source keys (explorer + web search)
— an account/env step, not a code gap. Both degrade honestly without them.

---

## 1. What was built

Two of the three Phase-2 shared items were already in place from Phase 1's
scaffolding and are confirmed working:

- **Input classification / routing** (`packages/shared/src/classify.ts`) — already
  routes cost-aware to all four specialists (deterministic for addresses/urls,
  LLM-refined for fuzzy text, with an on-chain-address guard).
- **Reputation-weighted risk fusion** (`packages/shared/src/fusion.ts`) — already
  implements per-specialist risk × confidence × reputation weight combined with
  noisy-OR, plus the verdict thresholds.

New in Phase 2 — the three specialist providers, each built on `startProvider`
from `agent-core`, mirroring the Forensics template (`handler.ts` + `index.ts` +
offline `selftest.ts`):

- **Contract Auditor** (`agents/auditor/`):
  - `explorer.ts` — fetches **verified Solidity source** (Etherscan v2, chainid
    8453); returns null when unkeyed/unverified.
  - `handler.ts` — two auditable layers: a **deterministic source-pattern scan**
    (selfdestruct, delegatecall, mint/blacklist/pausable, owner-adjustable fees,
    upgradeable proxy) citing the matched source line, plus **LLM reasoning**
    (strong tier, §2.5) constrained to constructs actually present. Honest
    "source unavailable / unverified" findings when it can't audit.
  - `npm run auditor:serve` · `npm run auditor:selftest -- 0x<addr>`
- **Reputation / Web-signal** (`agents/reputation/`):
  - `search.ts` — Tavily web-search client (`WEB_SEARCH_API_KEY`), degrades to
    null when unkeyed.
  - `handler.ts` — searches for scam reports about the subject (domain/address/
    text); **negativity is decided deterministically** from real results and the
    citations are always real result URLs; the LLM only synthesizes the phrasing.
  - `npm run reputation:serve` · `npm run reputation:selftest -- "<subject>"`
- **Claims / Misinformation** (`agents/claims/`):
  - `heuristics.ts` — deterministic red-flag detectors over offer **text**
    (guaranteed returns, urgency, seed-phrase/private-key requests, wallet-drainer
    language, advance fees, impersonation, off-platform push, too-good jobs); the
    **matched phrase is the citation**.
  - `handler.ts` — heuristics + LLM-phrased summary. Fully offline-capable.
  - `npm run claims:serve` · `npm run claims:selftest -- "<text>"`

Root `package.json` gained `serve` + `selftest` scripts for all three.

## 2. Verified

- `npm run typecheck` — clean across all packages + agents (incl. the 3 new ones).
- `npm run claims:selftest` — offline scam sample → **4 cited red-flags**
  (guaranteed returns, urgency, wallet-drainer, off-platform) + LLM summary.
- `npm run auditor:selftest` — with no explorer key, correctly returns a single
  honest `audit_unavailable` finding (confidence 0.3) instead of failing.
- `npm run reputation:selftest` — with no search key, correctly returns
  `web_check_skipped` (confidence 0.3).
- Classifier routing (runtime): bare address → `forensics, auditor`; offer text →
  `reputation, claims`; job/rental → `claims`. All four specialists reachable.
- Selftests also confirm the new workspace packages resolve `@pirton/agent-core`
  and `@pirton/shared` at runtime.

## 3. Remaining to light up full output (account / env)

Same shape as Phase 1's live-settlement boundary — code is done, keys/services
are the gate:

1. `EXPLORER_API_KEY` — enables the Auditor to fetch verified source and run the
   real audit (both deterministic scan + LLM reasoning).
2. `WEB_SEARCH_API_KEY` (Tavily) — enables the Reputation agent's live web search.
3. Register the `auditor` / `reputation` / `claims` provider services on
   `agent.croo.network` and paste their real ids into `CROO_SERVICE_ID_*` — the
   same placeholder-id blocker noted in Phase 1 applies to all four now.

With those, a text/URL scam input will hire ≥3 agents in one run and settle real
USDC — the full swarm the demo needs.

## 4. Next (Phase 3)

Next.js UI: live hiring board driven by WS/SSE events (agent cards light up per
CAP event, USDC counters tick, tx links appear) → the signed Trust Receipt card.
Re-check the `OrderCreated` event-ordering note from `PHASE1.md §4` once a real
multi-agent order flows.
