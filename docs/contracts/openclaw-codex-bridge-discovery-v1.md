# OpenClaw / Codex bridge — no-provider-API discovery v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/openclaw-codex-bridge-discovery-v1.md`  
**Version:** `openclaw-codex-bridge-discovery-v1`  
**Date:** 2026-05-25  
**Status:** **DESIGN / DISCOVERY ONLY** — no runtime in this document

**Related:** [Step A blocked](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md) · [Gateway PASS](../sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md) · [Classifier wrapper](classifier-wrapper-v1.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

**PROJECT_VISION.md:** read for alignment (§4.2, §7.5, §7.6, §10). **Not modified** by this task. Any vision-level change would be a **future recommendation**, not applied here.

---

## 0. Scope statements

| Statement | Value |
|-----------|--------|
| Runtime / agent retry | **No** |
| OpenAI provider API key | **No** |
| OpenClaw `agent main` retry | **No** |
| n8n / workflow 40–41 | **Untouched** |
| PM-34 real worker | **Not** unlocked |
| Secrets in Git | **No** |

---

## 1. Context — Step A block (summary)

| Fact | State |
|------|--------|
| OpenClaw gateway loopback | **PASS** — health/reachable, device paired, port 18789 loopback, Tailscale off |
| OpenClaw `agent main` Step A | **BLOCKED** — pending scope, embedded fallback, **No API key for provider "openai"**, model path `openai/gpt-5.5` |
| Policy | **No** provider API keys; **no** auto scope approve; **no** embedded fallback bypass |
| Implication | Gateway transport ≠ orchestration brain; **agent main is not the next step** |

---

## 2. Design questions — decision criteria

| # | Question | Weight |
|---|----------|--------|
| Q1 | Coherence with foundation vision and observed runtime? | High |
| Q2 | Fewest micro-interactions for lowest risk? | High |
| Q3 | Manual testable before any n8n wire-up? | High |
| Q4 | Avoids secrets / paid provider API keys in Git and default runtime? | Mandatory |
| Q5 | Graceful fallback to human/manual (GitHub SoT)? | Mandatory |
| Q6 | Aligns with PROJECT_VISION §4.2, §7.5, §7.6, §10? | Mandatory |

---

## 3. Options compared (A / B / C)

### Option A — Codex CLI / OAuth direct (no OpenClaw agent)

| Aspect | Assessment |
|--------|------------|
| Description | Orchestration via **Codex CLI** on Ryzen using **ChatGPT Plus OAuth** (already verified in preflight/doctor); OpenClaw **not** used as model path |
| Q1 Coherence | **Strong** — matches PROJECT_VISION §4.2 “Codex via OAuth ChatGPT Plus, senza provider API key a consumo” |
| Q2 Micro-interactions | **Strong** — CLI already installed/auth’d; no copy/paste via blocked agent |
| Q3 Manual test | **Strong** — plan-mode smoke PASS; next: read-only prompt with JSON contract |
| Q4 Secrets | **Strong** — OAuth local only; nothing committed to Git |
| Q5 Fallback | **Strong** — §7.6: manual ChatGPT if Codex/OAuth fails |
| Step A | **Avoids** blocked path entirely |
| Weakness | Does not use OpenClaw gateway investment unless paired later as optional UI |

### Option B — OpenClaw profile without OpenAI API provider

| Aspect | Assessment |
|--------|------------|
| Description | Reconfigure OpenClaw so `main` agent does **not** require `openai/*` + API key |
| Q1 Coherence | **Uncertain** — Step A shows current profile **requires** provider API key path |
| Q2 Micro-interactions | **Weak until proven** — scope pending, embedded fallback, config research loop |
| Q3 Manual test | **Blocked today** — cannot validate without unknown config + possible scope approvals |
| Q4 Secrets | **Risk** — pressure to add API key or opaque provider config in git |
| Q5 Fallback | **Mixed** — failure modes entangled with OpenClaw agent + embedded fallback |
| Verdict | **Defer** — research backlog only; **not** primary path while Step A BLOCKED |

### Option C — Local bridge: OpenClaw transport optional, Codex CLI controlled

| Aspect | Assessment |
|--------|------------|
| Description | Thin **local bridge contract** (JSON in/out, like [classifier-wrapper-v1](classifier-wrapper-v1.md)): events → **Codex CLI** subprocess; OpenClaw gateway **optional** for device/UI only, **never** `agent main` as provider |
| Q1 Coherence | **Strong** — separates transport (OpenClaw gateway PASS) from intelligence (Codex OAuth) |
| Q2 Micro-interactions | **Strong** — fixed contract reduces ambiguity; n8n only after manual proof |
| Q3 Manual test | **Strong** — bridge = docs contract first, then one manual Codex read-only invocation |
| Q4 Secrets | **Strong** — contract forbids logging tokens; subprocess inherits local OAuth only |
| Q5 Fallback | **Strong** — invalid JSON / Codex error → human_gate (same pattern as classifier) |
| Weakness | Requires explicit bridge spec (next artifact); not a single vendor feature |

---

## 4. Scoring matrix (qualitative)

| Criterion | A | B | C |
|-----------|---|---|---|
| Q1 Vision fit | ★★★ | ★ | ★★★ |
| Q2 Low friction / risk | ★★★ | ★ | ★★★ |
| Q3 Manual-first | ★★★ | ★ | ★★★ |
| Q4 No provider API key | ★★★ | ★★ (if ever works) | ★★★ |
| Q5 Graceful fallback | ★★★ | ★★ | ★★★ |
| Step A avoidance | ★★★ | ★ | ★★★ |
| **Total** | **Lead** | **Reject primary** | **Lead (architecture)** |

**Note:** A and C are not competing products — **C is the architecture**, **A is the immediate executable lane** inside C.

---

## 5. Mapping to PROJECT_VISION.md (read-only citations)

### §4.2 PC Ryzen — nodo AI primario fase 1

| Vision requirement | A | B | C |
|--------------------|---|---|---|
| Ollama classifier locale | N/A (parallel) | N/A | N/A (parallel) |
| OpenClaw confinato loopback | Partial (skip agent) | Requires agent config fix | Gateway optional; **no agent main** |
| Codex OAuth ChatGPT Plus, no consumo API key | **Yes** | Unclear | **Yes** via CLI |
| Cursor CLI implementer | Unchanged | Unchanged | Unchanged |
| Tailscale da n8n | Later gate | Later gate | Later gate |

**Best fit:** **C + A** — Ryzen runs Codex OAuth CLI + Ollama classifier; OpenClaw stays loopback transport only.

### §7.5 n8n no provider APIs by default

| Rule | A | B | C |
|------|---|---|---|
| n8n must not call paid OpenAI API | **Yes** — intelligence on Ryzen | Risk if n8n wires OpenClaw agent | **Yes** — n8n future call = local bridge only |
| Intelligence path: n8n → Tailscale → local | Future | Future | Future, after manual proof |
| OAuth ChatGPT Plus for Codex | **Yes** | Unknown via OpenClaw | **Yes** |

**Best fit:** **C** — explicit local bridge prevents n8n → paid API shortcut.

### §7.6 Fallback graceful

| Failure | A / C behavior |
|---------|----------------|
| Codex OAuth / CLI error | Manual ChatGPT + GitHub SoT (vision example) |
| OpenClaw gateway down | Codex path still works; gateway non-blocking for orchestration |
| Ollama classifier down | human_gate (classifier contract) |
| Invalid bridge JSON | human_gate |

**Best fit:** **C** — bridge contract encodes fallback; **B** adds embedded-fallback ambiguity.

### §10 Invarianti permanenti

| Invariant | A | B | C |
|-----------|---|---|---|
| No secrets in Git | **Yes** | Risk | **Yes** |
| PM-34 / n8n_ready gated | **Yes** | **Yes** | **Yes** |
| wf 40/41 untouched | **Yes** | **Yes** | **Yes** |
| n8n no paid provider default | **Yes** | Weak | **Yes** |
| Fallback graceful | **Yes** | Mixed | **Yes** |
| Runtime = real gates | **Yes** | **Yes** | **Yes** |

**Best fit:** **C + A**.

---

## 6. Recommendation (single direction)

### **Adopt: Codex-first local bridge (architecture C, execution lane A)**

One sentence: **Use Codex CLI with existing ChatGPT Plus OAuth on Ryzen as the only orchestration intelligence path; treat OpenClaw gateway as optional loopback transport already PASS; do not use OpenClaw `agent main` or any OpenAI provider API key; define a minimal JSON bridge contract before any n8n or PM-34 integration.**

| Decision | Detail |
|----------|--------|
| **Primary** | **Codex CLI / OAuth** (Path A) for next manual gates |
| **OpenClaw gateway** | Keep **PASS** status; use only for pairing/health if needed — **not** for `agent main` turns |
| **OpenClaw agent main** | **Permanently out of scope** until vendor supports ChatGPT-OAuth-only agent without `openai` API key (Path B = backlog research only) |
| **Bridge artifact** | Next: `codex-bridge-contract-v1` (docs) — input event + classifier output → Codex read-only prompt → structured response; mirrors classifier-wrapper pattern |
| **n8n** | Only after manual Codex read-only bridge smoke on Ryzen |
| **PM-34** | Unchanged gated |

**Rejected as primary:** **Option B** — high uncertainty, reproduces Step A failure mode, conflicts with no–API-key policy pressure.

---

## 7. Residual risks

| Risk | Mitigation |
|------|------------|
| Codex OAuth session expiry | Manual re-auth gate; fallback to manual ChatGPT (§7.6) |
| Codex CLI breaking change | Pin version in session docs; doctor before each gate |
| Temptation to add OpenAI API key “just for OpenClaw” | Policy block documented; revisit only via explicit cost gate + Decision Packet |
| Scope-upgrade prompts on OpenClaw | Do not auto-approve; ignore for orchestration path |
| n8n premature integration | Manual bridge smoke required first |

---

## 8. Next manual gate (after this discovery)

| Step | Gate |
|------|------|
| 1 | Publish **Codex bridge contract v1** (docs-only JSON in/out, read-only, no exec) |
| 2 | **Manual smoke:** Codex CLI read-only prompt on Ryzen — loopback repo context, no commit/push, no `codex exec` |
| 3 | Optional: gateway health check in parallel (already PASS) — no `agent` call |
| 4 | Only then: design n8n → Tailscale → local bridge (separate PM/runtime packet) |

**Not authorized in gate 2:** OpenClaw agent retry, provider API key, worker, PM-34, wf 40/41 mutation, auto loop.

---

## 9. What is NOT authorized

- OpenAI (or other) **provider API key** configuration  
- OpenClaw **`agent main`** retry or scope auto-approval  
- Embedded fallback as production path  
- Codex **exec**, app-server, remote-control  
- Cursor **worker** / `--force` / `--yolo`  
- n8n runtime / workflow **40/41** changes  
- PM-34 unlock  
- Tailscale/Funnel/LAN exposure of OpenClaw gateway without auth redesign  
- Secrets, tokens, auth URLs in Git  

---

## 10. Acceptance (discovery closure)

- [x] Step A block summarized  
- [x] Criteria and A/B/C comparison documented  
- [x] Mapping to PROJECT_VISION §4.2, §7.5, §7.6, §10  
- [x] **Single** recommendation: Codex-first local bridge  
- [x] Residual risks and next manual gate defined  
- [x] Explicit: design only; no runtime; no PROJECT_VISION edit  

---

## 11. Future PROJECT_VISION note (recommendation only — not applied)

If OpenClaw later supports ChatGPT-OAuth-only agents without provider API keys, §4.2 could mention “OpenClaw agent optional” — **only after vendor proof**, not before. No edit in this commit.
