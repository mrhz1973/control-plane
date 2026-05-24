# Foundation status (v2.0)

**Updated:** 2026-05-25 (reconciled with Tailscale PASS)

| Layer | Status | Notes |
|-------|--------|--------|
| **Tailscale VPS ↔ Ryzen** | **PASS** | Private mesh operational — nodes `ubuntu` / `asusdesktop`, bidirectional private ping; [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | unchanged by Tailscale gate |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel in Tailscale gate |
| **PM-34 real worker** | gated | unchanged |
| **Next tactical step** | pending | Cursor CLI preflight — see [PROJECT_VISION §12](PROJECT_VISION.md#12-prossimi-passi-tattici-verso-la-visione) |

Entry point: [PROJECT_VISION](PROJECT_VISION.md).