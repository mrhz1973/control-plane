# Foundation status (v2.0)

**Updated:** 2026-05-25 (local path read-only preflight PASS)

| Layer | Status | Notes |
|-------|--------|--------|
| **Tailscale VPS ↔ Ryzen** | **PASS** | Private mesh operational — nodes `ubuntu` / `asusdesktop`; [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |
| **Cursor Agent CLI (Ryzen)** | **PASS** | Install + auth + models + plan smoke read-only; [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) |
| **Ollama classifier (Ryzen)** | **PASS** (API only) | `qwen3:14b` via local API; [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
| **Classifier wrapper contract** | **DESIGN** | [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md) — no runtime yet |
| **Local path preflight (Ryzen)** | **PASS** (read-only) | OpenClaw/Codex/Ollama/Tailscale inspected; gateway **off**; no Codex exec; [session](../sessions/2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md) |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | unchanged |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel |
| **PM-34 real worker** | gated | unchanged — contract does not unlock |
| **Next tactical step** | pending | OpenClaw ↔ Codex ↔ Ollama ↔ Cursor — **manual runtime gate** (gateway liveness / controlled prompt pass); preflight read-only done — [PROJECT_VISION §12](PROJECT_VISION.md#12-prossimi-passi-tattici-verso-la-visione) |

Entry point: [PROJECT_VISION](PROJECT_VISION.md).