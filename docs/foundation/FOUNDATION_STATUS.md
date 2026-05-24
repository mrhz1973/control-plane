# Foundation status (v2.0)

**Updated:** 2026-05-23

| Layer | Status | Notes |
|-------|--------|--------|
| **Tailscale VPS - Ryzen** | **PASS** | [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) — nodes `ubuntu` / `asusdesktop`, private ping OK |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | not mutated by Tailscale gate |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel in Tailscale gate |
| **PM-34 real worker** | gated | unchanged |

See [PROJECT_VISION](PROJECT_VISION.md).
