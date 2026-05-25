# Foundation status (v2.0)

**Updated:** 2026-05-25 (Ollama classifier API smoke PASS)

| Layer | Status | Notes |
|-------|--------|--------|
| **Tailscale VPS ↔ Ryzen** | **PASS** | Private mesh operational — nodes `ubuntu` / `asusdesktop`; [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |
| **Cursor Agent CLI (Ryzen)** | **PASS** | Install + auth + models + plan smoke read-only; [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) |
| **Ollama classifier (Ryzen)** | **PASS** (API only) | `qwen3:14b` via local API (`think=false`, `format=json`); `ollama run` **not** suitable; not n8n/Tailscale loop; [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | unchanged |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel |
| **PM-34 real worker** | gated | unchanged |
| **Next tactical step** | pending | Classifier wrapper design/contract (JSON in/out, validation, safe-to-human fallback) — docs-only; no n8n runtime — [PROJECT_VISION §12](PROJECT_VISION.md#12-prossimi-passi-tattici-verso-la-visione) |

Entry point: [PROJECT_VISION](PROJECT_VISION.md).