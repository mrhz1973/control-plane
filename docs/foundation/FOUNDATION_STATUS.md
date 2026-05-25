# Foundation status (v2.0)

**Updated:** 2026-05-25 (OpenClaw agent Step A blocked — no provider API key)

| Layer | Status | Notes |
|-------|--------|--------|
| **Tailscale VPS ↔ Ryzen** | **PASS** | Private mesh operational — nodes `ubuntu` / `asusdesktop`; [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |
| **Cursor Agent CLI (Ryzen)** | **PASS** | Install + auth + models + plan smoke read-only; [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) |
| **Ollama classifier (Ryzen)** | **PASS** (API only) | `qwen3:14b` via local API; [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
| **Classifier wrapper contract** | **DESIGN** | [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md) — no runtime yet |
| **Local path preflight (Ryzen)** | **PASS** (read-only) | [session](../sessions/2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md) |
| **OpenClaw gateway (Ryzen)** | **PASS** (loopback manual) | Unchanged — [session](../sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md) |
| **OpenClaw agent Step A (main)** | **BLOCKED** | Liveness via gateway failed — pending scope + embedded fallback + **no OpenAI provider API key**; policy: no API key; [session](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md) |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | unchanged |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel |
| **PM-34 real worker** | gated | unchanged — contract does not unlock |
| **Next tactical step** | pending | **No-provider-API bridge** design/discovery (Codex OAuth/CLI or OpenClaw profile without OpenAI API key) — docs-only; no agent retry — [PROJECT_VISION §12](PROJECT_VISION.md#12-prossimi-passi-tattici-verso-la-visione) |

Entry point: [PROJECT_VISION](PROJECT_VISION.md).