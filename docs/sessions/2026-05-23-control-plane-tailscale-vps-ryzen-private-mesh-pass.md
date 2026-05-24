# Tailscale VPS - Ryzen private mesh — PASS

**Date:** 2026-05-23  
**Status:** **PASS / DOCS-ONLY REGISTRATION**  
**Scope:** Control Plane foundation v2.0 — private connectivity layer

**No runtime executed in this commit.** Operator completed gates manually; this file records sanitized results only.

---

## What was done

Tailscale private mesh between **VPS** (`ubuntu`) and **Ryzen** (`asusdesktop`) — install, auth, bidirectional ping. No public ports, no Funnel, no n8n mutation.

---

## Gates passed

| Gate | Result |
|------|--------|
| 1 — VPS preflight | **PASS** |
| 2 — Ryzen preflight | **PASS** |
| 3 — Tailscale install VPS | **PASS** |
| 4 — Tailscale install Windows/Ryzen | **PASS** |
| 5 — Login/auth VPS + Ryzen | **PASS** |
| 6 — Private ping bidirectional VPS - Ryzen | **PASS** |

---

## Sanitized technical facts (allowed)

| Item | Value |
|------|--------|
| VPS node name | `ubuntu` |
| Ryzen node name | `asusdesktop` |
| Private ping | **Bidirectional success** |
| n8n bind | **127.0.0.1:5678** (unchanged) |
| Tailscale mesh | **Operational** (private only) |

**Not recorded:** public IPs, Tailscale IPs, auth URLs, tokens, keys, full DERP details, browser/session data.

---

## Constraints respected

| Rule | State |
|------|--------|
| n8n modified | **No** |
| Workflow **40** / **41** | **Not** touched |
| Public port opened | **No** |
| Funnel | **Not** used |
| Auth keys/tokens in git | **No** |
| PC lavoro as runtime node | **No** |
| OpenClaw / Codex / Cursor worker runtime | **No** (this task) |

---

## Residual risks

- Tailscale ACL/policy changes could affect reachability — document before changing mesh config.
- n8n remains loopback-only; remote access to n8n still requires explicit future gate (not implied by mesh PASS).
- PM-34 / OpenClaw / worker gates unchanged — connectivity only.

---

## Related

- [Foundation status](../foundation/FOUNDATION_STATUS.md)
