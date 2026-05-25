# OpenClaw / Codex / Ollama / Tailscale — local path read-only preflight

**Date:** 2026-05-25  
**Status:** **PASS / DOCS-ONLY REGISTRATION**  
**Host:** Ryzen (`asusdesktop`) — read-only inspection batch  
**Repo at preflight:** `main` @ `d950540` (classifier wrapper contract)

**No runtime started in this task:** gateway not started, Codex exec not run, n8n not touched, no HTTP calls to Ollama from agent.

---

## Batch rules observed

| Rule | State |
|------|--------|
| OpenClaw `gateway run` / `start` / `install` | **Not** executed |
| Codex exec / interactive login / app-server start | **Not** executed |
| Cursor worker / `agent --print` / `--force` / `--yolo` | **Not** used |
| n8n workflow 40 / 41 | **Not** touched |
| PM-34 real worker | **Still gated** |

---

## Git (preflight start)

| Check | Result |
|-------|--------|
| Repo | `mrhz1973/control-plane` |
| Branch | `main` |
| HEAD | `d950540` |
| Workspace | **Clean** (before and after batch) |

---

## OpenClaw

| Check | Result |
|-------|--------|
| Installed | **Yes** — `OpenClaw 2026.5.20` |
| `openclaw status` | CLI OK; **gateway unreachable** (loopback probe refused) |
| `openclaw gateway status` | Service scheduled task **not installed**; connectivity probe **failed** — port **18789 not listening** |
| Gateway runtime | **Stopped** (expected for safe preflight) |
| Tailscale exposure (OpenClaw) | **off** |

**Conclusion:** Install present; gateway **not active** — manual `gateway run` remains a **separate explicit gate** (not done here).

---

## Codex CLI

| Check | Result |
|-------|--------|
| Installed | **Yes** — `codex-cli 0.133.0` |
| `codex login --help` | Help only — **no login invoked** |
| `codex doctor --json` | Auth **configured** (ChatGPT token mode; no API key stored); config/load OK; provider reachability OK; app-server **not running** (ephemeral mode OK); overall `fail` only on **terminal.env** (`TERM=dumb` in non-interactive shell — environmental, not auth failure) |
| `codex features list` | OK (read-only) |
| Codex exec / app-server start | **Not** run |

**Conclusion:** CLI + auth path **ready for manual gates**; exec and app-server remain **gated**.

---

## Ollama

| Check | Result |
|-------|--------|
| Version | `0.24.0` |
| `ollama list` | `qwen3:14b` present (no download needed) |
| `ollama ps` | **No** model loaded (idle) |
| Port **11434** | **Listening** on loopback only |
| API classifier smoke (prior) | **PASS** via API `think=false` + `format=json` — see [Ollama session](2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
| `ollama run` for production classifier | **Not suitable** (documented) |

**Conclusion:** Local API path **available**; no inference started in this batch.

---

## Tailscale

| Check | Result |
|-------|--------|
| CLI | `tailscale status` OK |
| Mesh nodes visible | `ubuntu` (VPS), `asusdesktop` (Ryzen) — both in tailnet |
| Prior mesh PASS | [Tailscale session](2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |

**Not recorded:** Tailscale IP addresses, auth URLs, keys.

---

## Ports (read-only)

| Port | Role | State |
|------|------|--------|
| **11434** | Ollama local API | **Listening** (loopback) |
| **18789** | OpenClaw gateway | **Not listening** |
| **5678** | n8n (VPS loopback reference) | **Not listening** on Ryzen (expected) |

---

## Cursor Agent CLI (PATH check)

| Check | Result |
|-------|--------|
| `agent` / `cursor-agent` on PATH (this shell) | **Not found** — prior PASS used Ryzen install; see [Cursor CLI session](2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) |

---

## What is PASS vs still gated

| Area | Preflight PASS | Still gated |
|------|----------------|-------------|
| Tooling present (OpenClaw, Codex, Ollama, Tailscale) | **Yes** | — |
| OpenClaw gateway live | — | **Yes** — must be explicit manual gate |
| Codex exec / worker / PM-34 | — | **Yes** |
| n8n / wf 40–41 / auto loop | — | **Yes** |
| Classifier wrapper **runtime** | — | **Yes** — [contract v1](../contracts/classifier-wrapper-v1.md) design only |
| OpenClaw ↔ Codex ↔ Ollama ↔ Cursor **integration** | — | **Yes** — next tactical path (manual first) |

---

## Residual notes

- OpenClaw reports gateway bind loopback `18789` — safe default; still requires deliberate start for liveness probes.
- Codex `doctor` terminal check fails in automation shell only; re-check in real terminal if needed before interactive work.
- No secrets, tokens, login URLs, challenge URLs, or Tailscale IPs committed in this document.

---

## Related

- [Foundation status](../foundation/FOUNDATION_STATUS.md)
- [PROJECT_VISION §12](../foundation/PROJECT_VISION.md)
- [Classifier wrapper contract](../contracts/classifier-wrapper-v1.md)
