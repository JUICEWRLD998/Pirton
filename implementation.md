# Pirton — The Immune System for the Agent Economy

> CROO Agent Hackathon (DoraHacks) · Deadline **2026-07-12 09:00** · Stack: **Next.js + React + TypeScript** (frontend) · Node + TypeScript (agents) · Real Base testnet CAP settlement.

---

## 1. Context & Why This Wins

**The hackathon's real test:** CROO is building CAP ("TCP/IP for agents") on **Base** — every agent gets a wallet + DID (ERC-8004) and can **discover, hire, and pay other agents on-chain** (USDC escrow in a CAPVault, gas platform-sponsored). Pillars: Identity, Coordination, Settlement, Reputation.

**The trap most teams fall into:** building ONE agent that does ONE thing behind a paywall (research bot, meme maker, trading signal). The judges are literally building the agent economy — a paywalled wrapper bores them. **The winning "we've never seen this" moment is watching money + work flow autonomously between multiple independent agents on-chain, with reputation at stake — emergent economic behavior.**

**Pirton:** a consumer **scam/fraud shield**. Paste a suspicious thing — a crypto token, an "investment" offer, a job post, a rental listing, a contract address. A **Pirton orchestrator agent decomposes it and hires + pays a swarm of specialist CAP agents on Base testnet** (on-chain forensics, contract auditor, reputation/web-signal, claims/misinformation). They return cited findings; Pirton fuses them into a **reputation-weighted risk verdict** and emits an on-chain **Trust Receipt** — a signed artifact showing every agent hired, what it found, the USDC it earned, its DID, and its reputation.

**Why it wins:**
- **Emotional + universal** — protects ordinary people from real scams.
- **Deep A2A composability** — a real multi-agent economy, not a wrapper.
- **Real on-chain USDC settlement** — maximum credibility with these judges.
- **Grows the ecosystem** — Pirton *consumes* many store agents, so it makes the CROO Agent Store more valuable (the commercial narrative VCs reward).

**Pitch line:** *"We didn't build one agent — we built the immune system for the agent economy, and pointed it at protecting your grandmother from a crypto scam."*

**Tracks to submit (max 2):** primary **Data & Verification** (the Trust Receipt = provenance + output checks) · secondary **DeFi / On-chain Ops** (the on-chain forensics agent). Open is a fallback secondary.

---

## 2. Architecture

Five independent processes, all speaking CAP. Four are **providers** (registered as services on `agent.croo.network`); one is the **requester/orchestrator**. Real USDC settlement on Base testnet via `@croo-network/sdk`.

```
                         ┌─────────────────────────────────────┐
   User pastes           │   Pirton Orchestrator (REQUESTER)    │
   suspicious item  ──▶  │   - classifies input                 │
   (Next.js UI)          │   - hires only relevant specialists  │
                         │   - pays each (USDC escrow on Base)  │
                         │   - reputation-weighted risk fusion  │
                         │   - emits signed Trust Receipt       │
                         └───────┬───────────┬───────────┬──────┘
             NegotiateOrder →    │           │           │   (parallel hires)
             PayOrder →          ▼           ▼           ▼
                    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                    │ Forensics    │ │ Contract     │ │ Reputation / │ │ Claims /     │
                    │ Agent        │ │ Auditor      │ │ Web-signal   │ │ Misinfo      │
                    │ (PROVIDER)   │ │ (PROVIDER)   │ │ (PROVIDER)   │ │ (PROVIDER)   │
                    │ RPC/explorer │ │ LLM on src   │ │ web search   │ │ LLM heurist. │
                    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                         each: DeliverOrder(result + proof hash) → order_completed
```

### 2.1 Specialist agents (each a CAP provider)
1. **On-chain Forensics Agent** — given a token/contract address: honeypot signals, liquidity lock, holder concentration, mint/blacklist authority, ownership renounce. Data via a Base/EVM RPC + block-explorer API. *(DeFi/On-chain Ops track anchor.)*
2. **Contract Auditor Agent** — pulls verified Solidity source from explorer; LLM reasons over rug patterns (hidden fees, owner-only transfer pauses, upgradeable proxy risk). Returns cited code lines.
3. **Reputation / Web-signal Agent** — web search for scam reports, domain age/WHOIS, social footprint, known-scam lists. Returns cited links.
4. **Claims / Misinformation Agent** — evaluates the offer *text* (guaranteed returns, urgency, impersonation, wallet-drainer language) against red-flag heuristics; cites which claim triggered which flag.

Only agents relevant to the input type are hired (a job post won't hire Forensics) — this shows **intelligent, cost-aware orchestration**, not brute fan-out.

### 2.2 Trust Receipt (the wow artifact)
Signed JSON + rendered card. Per hired agent: DID, service-id, finding summary, evidence citations, **USDC paid + Base tx link**, reputation score used in weighting. Plus the fused **risk score (0–100)** and verdict (Safe / Caution / Likely Scam). The "bill of materials" of a trust judgment — nobody else will show this.

### 2.3 CAP integration specifics (verify against `node-sdk` README on install)
- Install `npm install @croo-network/sdk` (repo: `github.com/CROO-Network/node-sdk`, TypeScript/MIT).
- Env: `CROO_API_URL=https://api.croo.network`, `CROO_WS_URL=wss://api.croo.network/ws`, `CROO_SDK_KEY=croo_sk_...`; orchestrator also sets `CROO_TARGET_SERVICE_ID` per hire.
- **Provider flow** (mirror `examples/provider.ts`): listen on WS, auto-negotiate, receive payment, `DeliverOrder(result + proof: result hash / execution log / attestation)`.
- **Requester flow** (mirror `examples/requester.ts`): `NegotiateOrder` → wait `AcceptNegotiation` → `PayOrder` (USDC escrow locked in CAPVault) → provider delivers → `GetDelivery`; drive UI off WS events `order_created` / `order_paid` / `order_completed`.
- Register the 4 services + generate 4 SDK-Keys on `agent.croo.network`; the orchestrator gets its own key/wallet. **All 5 must be listed on the CROO Agent Store (submission requirement).**

### 2.4 Tech stack
- **Frontend:** **Next.js (App Router) + React + TypeScript + Tailwind CSS**, animated with **Framer Motion** (`motion-framer` skill) and Magic UI components (`animated-component-libraries` skill), with an animated **hero background**. Route handlers proxy to the orchestrator; a WebSocket/SSE stream drives the live "hiring board" (agents light up as `order_created`/`paid`/`completed` fire, USDC counters tick, tx links appear), ending in the Trust Receipt card. **This UI is the 5-min video — full design language in §2.7.**
- **Agents:** Node + TypeScript. One shared `agent-core` package (CAP wiring + provider boilerplate) reused across all 4 providers — build once, parameterize by a `handler(input) → {findings, citations}`.
- **Orchestrator:** Node + TypeScript requester service exposing an API the Next.js app calls; streams progress events to the UI.
- **LLM:** **Gemini via OpenRouter** (one `OPENROUTER_API_KEY`, OpenAI-compatible endpoint). A strong Gemini model (e.g. `google/gemini-2.5-pro`) for auditor/claims reasoning; a cheaper/faster Gemini tier (e.g. `google/gemini-2.5-flash`) for input classification. See §2.5 for exactly where the LLM is used.
- **Data:** a Base RPC endpoint + one block-explorer API key; web search for the reputation agent.

### 2.5 Where the LLM (OpenRouter → Gemini) is used
The LLM is the **reasoning brain inside the agents**; the on-chain payments and data-fetching around it are deterministic. Specifically:
- **Orchestrator — input classification/routing:** Gemini reads the pasted item and decides its type (token address, offer text, job/rental, contract) and which specialists to hire. *(cheap/fast Gemini tier)*
- **Contract Auditor Agent:** Gemini reasons over the verified Solidity source to flag rug patterns and cite specific lines. *(strong Gemini tier)*
- **Claims / Misinformation Agent:** Gemini analyzes the offer's text against scam red-flags (guaranteed returns, urgency, impersonation) and explains which claim triggered which flag.
- **Reputation / Web-signal Agent:** Gemini synthesizes raw web-search results into a concise, **cited** finding (it does not invent facts — only summarizes retrieved sources).
- **Verdict synthesis:** after the reputation-weighted numeric score is computed in code, Gemini writes the short plain-language explanation on the Trust Receipt.

Not LLM-driven (kept deterministic for trust): the **Forensics Agent's** on-chain checks come from RPC/explorer data (Gemini only phrases the summary), the **risk-fusion math**, and all **CAP payment/escrow** logic. This keeps verifiable facts out of the model's hands and makes the Trust Receipt auditable.

### 2.6 Suggested repo layout (monorepo)
```
pirton/
├─ apps/
│  └─ web/                 # Next.js + React + TS frontend (hiring board + Trust Receipt)
├─ packages/
│  ├─ agent-core/          # shared CAP provider wrapper + types
│  └─ shared/              # Trust Receipt schema, risk-fusion, input classifier
├─ agents/
│  ├─ orchestrator/        # CAP requester (Pirton brain) + API/stream for the web app
│  ├─ forensics/           # CAP provider
│  ├─ auditor/             # CAP provider
│  ├─ reputation/          # CAP provider
│  └─ claims/              # CAP provider
├─ implementation.md
└─ README.md               # MIT, architecture diagram, setup
```

### 2.7 Frontend UI & Design System — the Pirton look & feel

**Design intent:** *creative, clean, and alive.* Not a copy of any scanner — Pirton should feel like a calm, premium security console that quietly comes to life the moment you hand it something suspicious. Inspirations (Token Sniffer's speed, Blowfish's explainability, AgentsRoom's live agent cards) are **guides, not templates** — we design our own signature look that appeals to the user, everyday people, and the judges.

**Aesthetic direction — "Living Security Console":**
- **Dark, high-contrast, strict grid.** Deep near-black base (not pure black) with layered elevation via subtle translucency (soft glassmorphism), generous whitespace, and one confident accent that shifts with verdict state (calm cyan/emerald = safe → amber = caution → red = danger). Grid discipline for perceived credibility.
- **Animated hero background.** A slow, alive ambient layer behind the fold — an aurora/gradient-mesh or subtle particle field (via the `lightweight-3d-effects` / Vanta skill, or a pure-CSS/canvas gradient for performance). Must stay tasteful and never fight the content; pauses/dims once a scan starts so focus moves to the agents.
- **Typography:** a clean geometric sans for UI (e.g. Inter/Geist) + a monospace accent for addresses, hashes, and tx links (reinforces the "on-chain, verifiable" feel).
- **Micro-copy tone:** plain-language, explainable ("We flagged this because…"), never jargon-dumping — Blowfish-style clarity.

**The three signature screens:**
1. **The Ask (hero):** big, inviting paste field over the animated background — "Paste a token, offer, link, or contract. Pirton's agents will investigate." Example chips (a scam token, a fake job) for instant demoability.
2. **The Hiring Board (the differentiator):** the orchestrator sits center; specialist **agent cards** animate in as they're hired, each showing name, role icon, live status (negotiating → paid → delivering → done), and its DID/reputation. **Animated connection beams** flow from orchestrator to each agent; **USDC counters tick up** as `order_paid` fires; real Base **tx links** appear inline. This screen *is* the wow — driven entirely by live CAP WebSocket events.
3. **The Verdict + Trust Receipt:** an animated **risk gauge** counts up to the fused score (0–100) with color-state; each agent's finding expands with cited evidence; then the **Trust Receipt** — a signed, hash-anchored "bill of materials" card (who was hired, findings, USDC each earned, DID, reputation, tx links) with a satisfying reveal.

**Motion language (Framer Motion — `motion-framer` skill):**
- **Orchestration primitives:** `AnimatePresence` for agent cards entering/leaving; `staggerChildren` so the swarm assembles with rhythm; `layout` animations so the board reflows smoothly as cards appear.
- **State-driven variants** per agent card mapped to CAP events (`idle → hired → paid → delivering → done/flagged`), each with its own color + spring transition.
- **Spring physics** (not linear easing) for anything that "pops" — cards, gauge needle, receipt reveal — for an organic, alive feel.
- **Signature moments:** animated count-up on the risk gauge and USDC totals; connection beams drawn with animated SVG paths / Magic UI beams; shimmer/animated borders on active cards; a Lottie (`lottie-animations` skill) check/shield flourish on the final verdict.
- **Restraint + a11y:** honor `prefers-reduced-motion` (swap motion for fades), keep 60fps (transform/opacity only), and never let motion delay the actual result.

**Skill → screen mapping:** `modern-web-design` (tokens, layout, type, a11y) · `motion-framer` (all interaction/choreography) · `animated-component-libraries`/Magic UI (USDC tickers, beams, animated borders) · `lottie-animations` (verdict flourish) · `lightweight-3d-effects`/Vanta or R3F (optional hero background).

**Build note:** design tokens (color/space/type/motion) live in `apps/web` as Tailwind theme + a small `motion/variants.ts`; agent-card and receipt components are reused across the board and the shareable receipt view.

---

## 3. Build Phases (solo, part-time, ~11 days → deadline 07-12)

**Scope rule:** one flawless flow beats four half-flows. Ship the vertical slice first, then widen.

### Phase 0 — Ground truth (Day 1)
- Clone `CROO-Network/node-sdk`; run `examples/provider.ts` + `examples/requester.ts` end-to-end on Base testnet.
- Confirm: service registration + SDK-Key flow on `agent.croo.network`, exact method signatures, how reputation is read (API field vs. derive from job history), and that a **real USDC escrow settles**.
- Sort test wallets + testnet USDC (gas is platform-sponsored, so only USDC needed).
- **De-risks everything — do this before writing product code.**

### Phase 1 — `agent-core` + first vertical slice (Days 2–4)
- Build the shared provider wrapper (`agent-core`).
- Stand up **Forensics Agent** (real on-chain checks) + **Orchestrator** that hires and pays it for real.
- One agent, real USDC, one real Trust Receipt entry. Working thin end-to-end.

### Phase 2 — Widen the swarm (Days 5–7)
- Add Contract Auditor + Reputation + Claims agents on the same core.
- Add input classification so only relevant agents are hired.
- Implement reputation-weighted risk fusion (in `packages/shared`).

### Phase 3 — Next.js UI + Trust Receipt (Days 8–9)
- Live hiring board driven by WS/SSE events; signed Trust Receipt card with tx links.
- Make it beautiful — this carries the video.

### Phase 4 — Store listing, polish, demo (Days 10–11)
- List all 5 agents on CROO Agent Store.
- Open-source repo (MIT) with README + architecture diagram.
- Record ≤5-min demo (real scam token → swarm hires → USDC flows → verdict + receipt).
- Submit BUIDL on DoraHacks to both tracks.

**Fallback ladder (never sacrifices the win):** 4 agents → 3 (Forensics + Auditor + Claims) is still a full swarm · real reputation weighting → transparent heuristic weighting (still shown on receipt) · **never cut:** real on-chain USDC settlement between ≥3 agents, and the Trust Receipt. If a live tx is flaky in the video, show real receipts from prior runs.

---

## 4. Demo Script (the 5-min video that wins)
1. **Hook (30s):** "100M+ agents are coming. You can already hire one. But which are honest? Here's a real crypto offer sent to my family." Paste it.
2. **Swarm activates (90s):** hiring board lights up — Pirton classifies input, hires the specialists, **real USDC escrows lock on Base** (tx links live), agents deliver findings over WebSocket.
3. **Verdict (60s):** reputation-weighted risk score snaps to "Likely Scam — 87/100," each agent's cited evidence expands.
4. **Trust Receipt (60s):** the money shot — signed on-chain "bill of materials": who was hired, findings, USDC each earned, DID + reputation. "Every judgment is auditable; every honest agent got paid."
5. **Vision (30s):** "The immune system for CROO's agent economy — every agent it hires makes your store more valuable."

---

## 5. Submission Checklist (hard requirements)
- [ ] All 5 agents listed on **CROO Agent Store** (`agent.croo.network`).
- [ ] Public repo, **MIT/Apache-2.0**, README + architecture diagram + setup.
- [ ] **≤5-min demo video.**
- [ ] BUIDL submitted on DoraHacks before **2026-07-12 09:00**; tracks = **Data & Verification** + **DeFi/On-chain Ops**.
- [ ] Real on-chain settlement demonstrated (tx links in receipt).

## 6. Risks & Mitigations
- **SDK reality differs from docs** → Phase 0 runs real examples before product code; adapt `agent-core` to actual signatures.
- **Reputation not exposed via API** → derive a transparent trust weight from job history / stake; label honestly on the receipt.
- **Testnet USDC / faucet friction** → sort wallets + test USDC on Day 1.
- **Live demo flakiness** → keep real receipts from prior successful runs as backup footage.
- **Solo/time** → strict vertical-slice-first; fallback ladder above; UI polish is last so a cut there doesn't break the story.

## 7. Verification (how we know it works)
- Run `agent-core` provider against Base testnet: requester can `NegotiateOrder`→`PayOrder`→`GetDelivery` and a **real USDC escrow settles** (verify tx on Base explorer).
- End-to-end: paste a known-scam token address → ≥3 agents hired + paid in one run → Trust Receipt renders with correct tx links and a coherent weighted verdict.
- Cross-check Forensics findings against the token's actual explorer data (no hallucinated on-chain facts).
- Confirm all 5 agents appear on the CROO Agent Store and the repo builds from a clean clone per README.
