# PM-50 — OpenClaw local install/onboard PASS

**Status:** **PASS / RUNTIME MANUAL CONTROLLED** (2026-05-22)

**Related:** [gate doc](PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_GATE.md) · [runtime packet](runtime-packets/pm-50-openclaw-local-install-onboard-gate.md) · [session](sessions/2026-05-22-control-plane-pm50-openclaw-local-onboard-pass.md) · [PM-49 feasibility](PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md) · [PM-51 next](PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md)

---

## Purpose

Record successful **confined** OpenClaw install/onboard with **OpenAI Codex OAuth** — manual runtime only; no secrets in git.

---

## Install / version

| Field | Value |
|-------|--------|
| **Install** | npm global — **succeeded** |
| **Version** | OpenClaw **2026.5.20** (e510042) |
| **Windows command** | **`openclaw.cmd`** — do **not** use bare `openclaw` (PowerShell may hit `openclaw.ps1` and block on ExecutionPolicy) |
| **Profile** | **control-plane** |

---

## OAuth / model

| Field | Value |
|-------|--------|
| **Provider** | OpenAI Codex OAuth — **completed** |
| **Default model** | **openai/gpt-5.5** |
| **Token value** | **Not recorded** in repo |

---

## Gateway (loopback confined)

| Field | Value |
|-------|--------|
| **Bind** | **127.0.0.1** |
| **Port** | **18789** |
| **Browser sidecar** | **18791** |
| **gateway.mode** | **local** |
| **gateway.auth** | **token** mode — persistent token configured; **value not recorded** |
| **Tailscale** | **OFF** |
| **Daemon / service** | **None** |
| **LAN / Funnel exposure** | **None** |

**Workspace/config paths:** operator-reported local paths under user profile — **verify on filesystem** before any future automation; do not assume paths in git.

---

## Commands validated

| Command | Role |
|---------|------|
| `openclaw.cmd --profile control-plane gateway` | Run gateway (foreground; window must stay open) |
| `openclaw.cmd --profile control-plane status` | Status |
| `openclaw.cmd --profile control-plane doctor` | Health |
| `openclaw.cmd --profile control-plane gateway probe` | Probe (Windows-native can be inconsistent) |

---

## Issues resolved

| Issue | Resolution |
|-------|------------|
| **gateway.mode unset** | `config set gateway.mode local` |
| **Auth token runtime** | `config set gateway.auth.mode token` + persistent token (value not in git) |
| **ExecutionPolicy** | Use **`openclaw.cmd`** not `openclaw.ps1` |
| **gateway probe flaky on Windows** | Do **not** chase probe if listen/status/netstat show operational gateway |

---

## Validation

| Check | Result |
|-------|--------|
| **netstat** | `TCP 127.0.0.1:18789 LISTENING` |
| **PID** | **51256** (gateway process at validation time) |
| **WebSocket** | Operational (per operator) |
| **Browser control** | Operational (per operator) |
| **OAuth** | Operational (per operator) |

---

## Explicit negatives

| Item | State |
|------|--------|
| **n8n** | **Not touched** |
| **Workflow 40 / 41** | **Not touched** |
| **Worker** | **Not enabled** |
| **Telegram** | **Not used** |
| **OpenRouter / Gemini** | **Not configured** |
| **PM-34** | **Blocked** |

---

## Security notes

- Gateway **PowerShell window** running `openclaw.cmd --profile control-plane gateway` must **remain open**.
- Do **not** expose LAN, Tailscale, or Funnel.
- Do **not** paste gateway token, OAuth URL, or session identifiers into git or chat.

---

## Next

**PM-51** confined gateway no-op probe **or** **PM-52** bridge design. **PM-48** Codex CLI runner v3 remains **prepared** fallback.
