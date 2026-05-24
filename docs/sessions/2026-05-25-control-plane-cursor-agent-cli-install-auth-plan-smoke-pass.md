# Cursor Agent CLI — install, auth, plan smoke — PASS

**Date:** 2026-05-25  
**Status:** **PASS / DOCS-ONLY REGISTRATION**  
**Scope:** Control Plane foundation v2.0 — Cursor Agent CLI on Ryzen (`asusdesktop`)

**No runtime executed in this commit.** Operator completed gates manually on PC Ryzen; this file records sanitized results only.

---

## What was done

Cursor Agent CLI installed and authenticated on **Ryzen**; models discovery verified; first **read-only** smoke test in **plan** mode (`agent --mode plan`, Composer 2.5 Fast) successfully read `PROJECT_VISION.md` with no file changes and a clean workspace.

---

## Gates passed

| Gate | Result |
|------|--------|
| 1 — Install Cursor Agent CLI (Ryzen) | **PASS** |
| 2 — Login / auth | **PASS** |
| 3 — Models discovery | **PASS** |
| 4 — Plan-mode smoke (read-only) | **PASS** |

---

## Sanitized technical facts (allowed)

| Item | Value |
|------|--------|
| Host node | Ryzen (`asusdesktop`) — Tailscale mesh already **PASS** |
| CLI commands available | `agent`, `cursor-agent` |
| CLI version | `2026.05.24-dda726e` |
| Subscription tier (sanitized label) | Pro+ |
| Smoke model | Composer 2.5 Fast |
| Smoke mode | `plan` (`agent --mode plan`) |
| Smoke target | Read `docs/foundation/PROJECT_VISION.md` — **success** |
| File modifications during smoke | **None** |
| Workspace after smoke | **Clean** |

**Not recorded:** tokens, login URLs, challenge URLs, API keys, session cookies, account emails, full model list dumps.

---

## Explicitly not used (constraints)

| Flag / mode | State |
|-------------|--------|
| Worker mode | **Not** used |
| `--print` | **Not** used |
| `--force` | **Not** used |
| `--yolo` | **Not** used |
| Runtime automation | **Not** run (this registration only) |

---

## Constraints respected

| Rule | State |
|------|--------|
| n8n modified | **No** |
| Workflow **40** / **41** | **Not** touched |
| PM-34 real worker | **Still gated** — preflight does not unlock |
| OpenClaw runtime | **No** (this task) |
| Secrets in git | **No** |
| PC lavoro as runtime node | **No** |

---

## Residual risks

- **Agent** mode with write/commit remains a separate explicit gate — plan smoke does not authorize unattended repo mutation.
- Headless / n8n-triggered invocation not proven — local interactive Ryzen only.
- PM-34, OpenClaw worker, and loop automation unchanged.

---

## Related

- [Foundation status](../foundation/FOUNDATION_STATUS.md)
- [PROJECT_VISION §3 / §12](../foundation/PROJECT_VISION.md)
- [Tailscale mesh PASS](2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md)
