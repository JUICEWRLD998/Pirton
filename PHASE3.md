# Phase 3 — Next.js UI + Trust Receipt

> **UI revamp (latest):** the presentation layer was elevated to a premium,
> "alive" **Living Security Console**. Type moved to **Space Grotesk** display +
> Inter body + JetBrains Mono data. The flat single-indigo accent became a
> living **indigo → violet → cyan brand spectrum**: gradient headline text,
> aurora glows, gradient-hairline glass cards (`.card-grad`), a spectrum CTA,
> and a cyan "signal" accent for live state. The hero now carries a signature
> **canvas swarm constellation** (`components/SwarmCanvas.tsx`) — an
> orchestrator hub with four orbiting specialists and pulses traveling the
> connection beams (reduced-motion → static). Landing sections gained
> scroll-reveal motion, per-agent iconography/hue, and connected step rails; the
> live scan became a console panel; the verdict now reads on a **semicircular
> arc gauge** (`components/RiskMeter.tsx`). Ambient **galaxy** starfield
> (`components/Galaxy.tsx`) is retained behind everything. Semantic
> green/amber/red still appear only on the verdict. The data layer (SSE
> contract, `useScan`, `demo`, `route`) is unchanged — this was a presentation
> revamp. Design tokens live in `tailwind.config.ts` + `app/globals.css`.
> Verified: `next build` ✓, `tsc --noEmit` ✓ (161 kB first-load JS for `/`).



Goal (implementation.md §3 / §2.7): the live **hiring board** driven by WS/SSE
events and the signed **Trust Receipt** card with tx links — the "Living
Security Console." This is the surface that carries the 5-minute video.

Status: **Code complete and verified.** `apps/web` builds clean
(`next build` ✓, type-check ✓) and streams the full three-screen flow
end-to-end. The console is **demo-first + live-optional**: it ships a scripted,
realistically-timed run so the demo is always presentable, and transparently
proxies a real on-chain orchestrator stream once CAP service ids + a funded
wallet are provisioned (the same blocker tracked in PHASE1/PHASE2 §3).

---

## 1. What was built

New workspace: **`apps/web`** — Next.js 15 (App Router) + React 19 + TypeScript +
Tailwind v3 + Framer Motion. Added `"apps/*"` to the root workspaces.

**Design system — "Living Security Console"** (`tailwind.config.ts`,
`app/globals.css`): deep near-black layered base, soft glassmorphism, one accent
that **shifts with verdict state** (emerald safe → amber caution → red scam) via
a `data-verdict` attribute remapping a CSS custom property. Inter for UI,
JetBrains Mono for addresses/hashes/tx. Animated aurora/gradient-mesh hero that
**dims once a scan starts**. `prefers-reduced-motion` fully honored; 60fps
transform/opacity-only animation; keyboard focus rings.

**The SSE contract** (`lib/types.ts`) mirrors `@pirton/shared` exactly but is
kept local so the web app builds and demos standalone. Event flow:
`classified → progress* → delivered* → receipt`.

**Screen 1 — The Ask** (`components/Hero.tsx`): inviting paste field over the
aurora with an animated conic border, ⌘+↵ submit, and three example chips (scam
airdrop+token, fake remote job, blue-chip token) for instant demoability.

**Screen 2 — The Hiring Board** (`components/HiringBoard.tsx`,
`OrchestratorNode`, `AgentCard`, `AnimatedBeam`): the orchestrator sits center;
specialist cards animate in with a staggered spring as they're hired. Each card
runs a **CAP-stage state machine** (`negotiating → order_created → paying →
paid → delivering → done`) with a live status pill, progress rail, **USDC
count-up ticker**, inline Base **pay-tx link**, DID, and a delivered summary with
worst-severity chip. **Animated SVG connection beams** flow orchestrator→agent,
updated imperatively via `rAF` so they track cards during entrance without
re-rendering React each frame. A live tally shows agents hired / delivered /
USDC escrowed.

**Screen 3 — Verdict + Trust Receipt** (`components/VerdictPanel.tsx`,
`RiskGauge`, `FindingRow`, `TrustReceiptCard`): an **animated semicircular risk
gauge** counts up to the fused score with the verdict color-state and a
shield/alert crest flourish; the plain-language explanation lands; each agent's
findings **expand to cited evidence** (BaseScan / tx / matched-phrase links);
then the **Trust Receipt** — a signed, hash-anchored "bill of materials":
per-agent DID, reputation weight + completed-order count, USDC earned, pay-tx,
plus `receiptHash` and signature.

**Backend paths:**
- `apps/web/app/api/scan/route.ts` — SSE endpoint. Demo mode (default) runs the
  scripted scenario from `lib/demo.ts`; live mode proxies `ORCH_URL`'s stream,
  falling back to demo (with a soft notice) if the orchestrator is unreachable
  so the UI never dead-ends in front of judges.
- `agents/orchestrator/src/server.ts` — live-mode SSE bridge that reuses the
  existing `Orchestrator` + `buildTrustReceipt` and emits the **same event
  contract**. `npm run orchestrate:serve` (defaults to `:8787`).

Root scripts added: `web:dev`, `web:build`, `web:start`, `orchestrate:serve`.

## 2. Skills used (per implementation.md §2.7 mapping)

- **`modern-web-design`** — tokens (fluid type, OKLCH-ish accents, elevation),
  glassmorphism, micro-interactions, a11y (reduced-motion, focus, contrast),
  performance-first (transform/opacity only).
- **`motion-framer`** — `AnimatePresence` screen transitions, `staggerChildren`
  for the swarm assembling with rhythm, `layout` reflow, state-driven variants
  per CAP stage, spring physics on cards / gauge / receipt.
- **`animated-component-libraries`** (Magic UI patterns) — hand-built animated
  beam, number ticker, and conic border-beam (no fragile heavy deps).

## 3. Verified

- `npm run typecheck` (root) — clean across packages + agents incl. the new
  `orchestrator/server.ts`.
- `apps/web` → `next build` — compiles, type-checks, and prerenders (✓, 156 kB
  first-load JS for `/`).
- SSE smoke (production `next start`): bare address →
  `classified(forensics,auditor)`; flagship scam paste → `1 classified,
  24 progress, 4 delivered, 1 receipt` with `riskScore 91 / likely_scam`.
  Blue-chip token → `safe`.

## 4. Running it

```
npm run web:dev            # http://localhost:3000  (demo mode, no keys needed)

# Live on-chain mode (once CAP service ids are set + wallet funded):
npm run forensics:serve    # + auditor/reputation/claims:serve in more terminals
npm run orchestrate:serve  # SSE bridge on :8787
# set ORCH_URL=http://localhost:8787 for the web app, then hit "Investigate"
```

## 5. Remaining (same account/env gate as Phase 1–2)

The live path is wired but dark until the account-owner steps from PHASE1 §3 /
PHASE2 §3 are done: register the 4 provider services on `agent.croo.network`,
paste real `CROO_SERVICE_ID_*`, fund the orchestrator AA wallet, add
`EXPLORER_API_KEY` + `WEB_SEARCH_API_KEY`. Until then the console runs the
scripted scenarios — deterministic and demo-safe, per the implementation.md
fallback ladder. Re-check the `OrderCreated` event-ordering note (PHASE1 §4)
when the first real multi-agent order flows, so the USDC-tick moment fires.
