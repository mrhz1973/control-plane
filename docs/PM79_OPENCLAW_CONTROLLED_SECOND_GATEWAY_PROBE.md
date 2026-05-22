# PM-79 — OpenClaw controlled second gateway probe

**Status:** **PASS / CONTROLLED RUNTIME PROBE** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-79-openclaw-controlled-second-gateway-probe-gate.md) · [session](sessions/2026-05-22-control-plane-pm79-openclaw-controlled-second-gateway-probe-pass.md) · [PM-51 first probe](PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md) · [PM-78](PM78_OPENCLAW_LIFECYCLE_HARDENING_CHECKPOINT.md) · [pm-34](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## Scopo

Secondo **probe runtime controllato** OpenClaw gateway dopo **PM-51** (primo no-op) e dopo governance lifecycle **PM-52→PM-78**.

| Item | PM-79 |
|------|--------|
| **Esecuzione** | Manuale utente (casa) — **già completata** |
| **Questo task** | **Solo registrazione docs** — **non** rieseguire OpenClaw |
| **n8n** | **Not** used |
| **Workflow 40 / 41** | **Not** touched |
| **Worker** | **Not** enabled |
| **PM-34** | **Not** unblocked |

---

## Ambiente

| Item | Value |
|------|--------|
| **OS** | Windows 10.0.26200 x64 |
| **Node** | 24.15.0 |
| **OpenClaw** | 2026.5.20 (e510042) |
| **Profile** | `control-plane` |
| **Network** | Local loopback only |

---

## PowerShell A — gateway start

Evidence (operator session):

- OpenClaw 2026.5.20 (e510042)
- Gateway loading configuration · resolving authentication
- HTTP server starting
- Agent model: `openai/gpt-5.5` (thinking=medium, fast=off)
- HTTP server listening
- Browser/server listening on `http://127.0.0.1:18791/` (auth=token — **no** token committed)
- **Gateway ready**
- Heartbeat started

---

## PowerShell B — probe

Pre-probe repo state:

| Check | Result |
|-------|--------|
| `git status` | Clean |
| **HEAD** | `e44076d` — PM-74…78 lifecycle hardening |
| **ahead/behind** | **0 / 0** |

Probe results:

| Check | Result |
|-------|--------|
| OpenClaw version | 2026.5.20 (e510042) |
| **netstat** | `127.0.0.1:18789` **LISTENING** (PID **43144**) |
| **HTTP /health** | **200** |
| **Body** | `{"ok":true,"status":"live"}` |
| **openclaw status** | Gateway local reachable **170ms** · `ws://127.0.0.1:18789` · auth token (not logged) |
| Tailscale exposure | **Off** |
| Gateway service | **Not** installed |
| Node service | **Not** installed |
| Sessions | **0** active |
| Channels | **None** configured |

---

## Gateway close (operator)

| Step | Result |
|------|--------|
| Process on `127.0.0.1:18789` | Found PID **43144** (node) |
| Stop | `Stop-Process -Force` |
| Port after stop | **No** listener on 18789 |
| Repo after stop | **Clean** |

---

## Decisione

**PM-79 PASS** — second controlled gateway probe confirms loopback liveness consistent with PM-51; does **not** change integration posture.

---

## Invarianti (unchanged)

| Rule | State |
|------|--------|
| **PM-34** | **Blocked** |
| **n8n_ready** | **false** |
| **Workflow 40 / 41** | **Untouched** |
| **Worker** | **Not** enabled |
| **n8n** | **Not** used |
| **Raw OpenClaw → n8n** | **Never** direct |

---

## Next

| PM | Scope |
|----|--------|
| **PM-80** (candidate) | OpenClaw runtime evidence capture **design** — **or** PM-80 value checkpoint |
| **Not next** | PM-34 runtime · n8n consumption · `n8n_ready: true` |
