# OpenClaw gateway — loopback manual runtime PASS (with caveats)

**Date:** 2026-05-25  
**Status:** **PASS / DOCS-ONLY REGISTRATION**  
**Host:** Ryzen (`asusdesktop`) — manual foreground gateway on operator machine  
**Prior:** [read-only preflight](2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md) (gateway was off)

**No changes in this commit.** Operator ran gateway manually; this file records sanitized results only.

---

## What was done

OpenClaw Gateway started **manually** in foreground on Ryzen with loopback bind, Tailscale exposure off, no Funnel. Health and reachability verified; device paired with operator scopes; post-approval PASS. Git workspace remained clean.

**Start command (sanitized flags only — no tokens):**

```text
openclaw.cmd gateway run --bind loopback --tailscale off --port 18789 --auth none --compact
```

---

## Gates passed

| Gate | Result |
|------|--------|
| Gateway health | **OK** |
| Gateway status — reachable | **PASS** |
| Bind | loopback `127.0.0.1` |
| Capability | read-only |
| Device paired | **PASS** — scopes `operator.read` + `operator.pairing` |
| Post-approval device/scope | **PASS** |
| Port listening | `127.0.0.1:18789` |
| Git workspace | **Clean** |

---

## Configuration (allowed facts)

| Item | Value |
|------|--------|
| Bind | loopback only |
| Port | 18789 (local) |
| Tailscale exposure | **off** |
| Funnel | **not** used |
| Auth mode | `none` (see security caveat) |
| n8n | **not** touched |
| Workflow 40 / 41 | **untouched** |
| Codex exec | **not** used |
| Cursor worker | **not** used |

**Not recorded:** tokens, login URLs, challenge URLs, API keys, Tailscale IPs, full probe payloads.

---

## Caveats (mandatory)

| Caveat | Detail |
|--------|--------|
| **Read probe timeout** | Gateway probe: Connect **OK**, capability **read-only**, **read probe failed — timeout** |
| **`auth none` security** | Acceptable **only** while gateway stays strictly loopback/local-only. **Must NOT** be exposed via Tailscale serve, reverse proxy, LAN bind, Funnel, or any public port without token/password auth design |
| **Foreground manual** | Not installed as Windows scheduled task; stopping the terminal stops the gateway |
| **Scope** | Liveness + pairing only — not agent execution, not Codex bridge production |

---

## Does NOT unlock

| Gate | State |
|------|--------|
| PM-34 real worker | **Still gated** |
| n8n runtime integration | **No** |
| Workflow 40 / 41 mutation | **No** |
| Codex exec | **No** |
| OpenClaw agent execution | **No** |
| Cursor worker / auto commit-push loop | **No** |
| End-to-end auto loop | **No** |

---

## Next gate (tactical)

**Update (2026-05-25):** Step A agent liveness **BLOCKED** by provider API-key policy — see [Step A blocked session](2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md). Next: **no-provider-API bridge** design/discovery (docs-only).

---

## Related

- [Foundation status](../foundation/FOUNDATION_STATUS.md)
- [PROJECT_VISION §12](../foundation/PROJECT_VISION.md)
- [Local path preflight](2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md)
