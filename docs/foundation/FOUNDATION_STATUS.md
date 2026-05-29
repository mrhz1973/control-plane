# Foundation status

**Updated:** 2026-05-28  
**Aligned to:** [PROJECT_VISION](PROJECT_VISION.md) v2.2 — workflow 42 + Codex CLI direct path  
**HEAD before this reconcile:** `f482360` (`docs: record codex prompt artifact cursor consumption pass`)

---

## Document hierarchy

| Document | Role |
|----------|------|
| **[PROJECT_VISION.md](PROJECT_VISION.md)** | Entry point canonico / livello superiore — source of truth per destinazione e invarianti |
| **FOUNDATION_STATUS.md** (this file) | Stato sintetico operativo — non alternativa alla vision |

Leggere sempre **PROJECT_VISION** prima di interpretare questo file.

---

## Operational snapshot (v2.2)

| Area | Status | Notes |
|------|--------|--------|
| **GitHub** | Source of truth | Codice, docs, session log verificabili |
| **Workflow 40** | **ATTIVO** (produzione) | Polling multirepo; **non modificato** in silenzio |
| **Workflow 41** | Backup off | **Conservare** — non cancellare senza decisione esplicita |
| **Workflow 42** (diff-summary Telegram) | **ATTIVO** / PASS | Diff summary su commit osservati |
| **Telegram base** | **ATTIVO** | Notifiche commit / gate umano |
| **Codex CLI direct path** | Target model path | OAuth ChatGPT Plus, ephemeral — **non** worker automatico |
| **Cursor CLI** | **NON** worker automatico | Implementazione sotto supervisione umana |
| **Ollama classifier** | **NON** nel loop operativo automatico | API smoke / contract design only |
| **OpenClaw** | Backlog / transport opzionale confinato | **Non** model path target (superseded come default) |
| **PM-34 real worker** | **BLOCCATO** | Nessun unlock senza prova reale + gate esplicito |
| **Safe defaults** | Unchanged | `pm34_unblocked=false`, `n8n_ready=false` |
| **Provider API key path** | **NO** | Nessuna chiave provider in Git o loop default |
| **n8n runtime / VPS** | Out of scope for ad-hoc tasks | Nessun deploy/tag/rollback da task docs |

---

## Manual supervision evidence (not worker activation)

Questi commit dimostrano pattern **manual-supervised** (wf42 → Codex → Cursor / GitHub bus). **Non** attivano Codex CLI o Cursor CLI in §1.1 PROJECT_VISION.

| Commit | Session / meaning |
|--------|-------------------|
| `f17ad1e` | [First wf42 → Codex CLI manual PASS](../sessions/2026-05-27-control-plane-first-wf42-to-codex-cli-manual-pass.md) |
| `6b5e100` | [First wf42 → Codex → Cursor manual e2e PASS](../sessions/2026-05-27-control-plane-first-wf42-codex-cursor-manual-e2e-pass.md) |
| `4a539fc` | Codex prompt artifact bus test (`docs/runtime/codex-prompts/…`) |
| `f482360` | [Codex prompt artifact consumed by Cursor PASS](../sessions/2026-05-27-control-plane-codex-prompt-artifact-consumed-by-cursor-pass.md) |
| `becab46` / `c27aadb` | Repeatability run: Codex artifact bus -> Cursor -> real commits (role triangle, verification guard) |

**Codex artifact helper v1 (manual-supervised):** script locale [`scripts/codex-artifact.ps1`](../../scripts/codex-artifact.ps1) — percorso test reale: file prompt input -> `codex.cmd exec --ephemeral --sandbox read-only` -> artifact in `docs/runtime/codex-prompts/` (es. `2026-05-28-helper-v1-status-note.md`). **Valore:** riduce la micro-interazione di ricostruire manualmente il comando Codex artifact. **Stato:** helper manual-supervised only; **non** attiva Codex CLI worker; **non** sblocca PM-34; **non** cambia `pm34_unblocked` / `n8n_ready`; **non** tocca workflow 40/41; no n8n runtime; no provider API key; no deploy/tag/rollback.

---

## External benchmark — GIS Tool

**Verification (read-only):** commit `4a98a33` present on `origin/main` of `mrhz1973/cursor-coordinate-converter` after `git fetch origin main` (local clone was behind; not present until fetch).

| Field | Value |
|-------|--------|
| Repo | `mrhz1973/cursor-coordinate-converter` |
| Commit verified | `4a98a33` — `feat: improve offline map download and JPG export` |
| Cycle observed | ChatGPT prompt → Cursor implementa → commit/push → deploy Firebase quando autorizzato → test browser utente PASS |
| Firebase PASS (user) | https://gistoolmarty-33cf8.web.app |
| VPS | Non aggiornato |
| Value for control-plane | Riduce micro-interazione “utente deve ricordare/eseguire deploy manuale” nel flusso GIS |
| Does **not** prove | Codex CLI attivo, Cursor CLI headless, n8n worker automatico, PM-34 unlock |

---

## Next tactical step

**Artifact bus helper v1 repeat-use:** usare [`scripts/codex-artifact.ps1`](../../scripts/codex-artifact.ps1) su un **secondo task reale** (input prompt -> artifact -> Cursor) prima di qualunque integrazione n8n/runtime.

Vincoli invariati:

- n8n runtime
- workflow 40/41 mutation
- PM-34 unlock
- provider API key
- deploy / tag / rollback

Artifact policy: ASCII-safe, newline at EOF, no JSON wrapper obbligatorio (vedi `f482360`, helper v1 enforce EOF).

---

## Superseded as active next step (historical only)

| Former next step | Status |
|------------------|--------|
| n8n payload synthetic validation / preflight dry-run **examples** as primary forward work | **Superseded** — design phase closed on paper (2026-05-26 batch); non è il passo tattico corrente |
| OpenClaw/Codex bridge as **default** model path | **Superseded** by PROJECT_VISION v2.2 — Codex CLI direct; OpenClaw = optional transport/backlog |

---

## Design-phase evidence (local bridge + n8n payload — closed on paper)

Compact index; detail in linked sessions. **Does not authorize** n8n runtime, PM-34 unlock, or unattended automation.

| Layer | Status | Pointer |
|-------|--------|---------|
| Tailscale VPS ↔ Ryzen | PASS | [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |
| Cursor Agent CLI install/auth smoke | PASS | [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) |
| Ollama classifier API | PASS (API only) | [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
| OpenClaw gateway loopback | PASS (manual) | [session](../sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md) |
| OpenClaw agent Step A | BLOCKED (no provider API key) | [session](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md) |
| Codex bridge V2 + local wrapper integration | PASS (local, n8n-free) | [closeout](../decision-packets/n8n-free-local-integration-readiness-closeout.md) |
| n8n payload contract + synthetic examples | DOCS COMPLETE | [closeout](../decision-packets/n8n-payload-contract-closeout.md) |
| n8n read-only runtime inspection Tier A | PASS (list-only) | [pass](../sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a-pass.md) |
| n8n payload preflight dry-run design | DOCS COMPLETE (superseded as next step) | [packet](../decision-packets/n8n-payload-preflight-dry-run-design-packet.md) |

**Invarianti invariati:** Workflow 40/41 untouched by design tasks; `pm34_unblocked=false`; `n8n_ready=false`; no provider API keys; no public Funnel.

Entry point: [PROJECT_VISION](PROJECT_VISION.md).
