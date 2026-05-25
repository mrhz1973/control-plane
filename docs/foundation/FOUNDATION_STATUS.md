# Foundation status (v2.0)

**Updated:** 2026-05-25 (Codex bridge contract v1 complete)

| Layer | Status | Notes |
|-------|--------|--------|
| **Tailscale VPS ↔ Ryzen** | **PASS** | Private mesh operational — nodes `ubuntu` / `asusdesktop`; [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |
| **Cursor Agent CLI (Ryzen)** | **PASS** | Install + auth + models + plan smoke read-only; [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) |
| **Ollama classifier (Ryzen)** | **PASS** (API only) | `qwen3:14b` via local API; [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
| **Classifier wrapper contract** | **DESIGN** | [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md) — no runtime yet |
| **Local path preflight (Ryzen)** | **PASS** (read-only) | [session](../sessions/2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md) |
| **OpenClaw gateway (Ryzen)** | **PASS** (loopback manual) | Unchanged — [session](../sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md) |
| **OpenClaw agent Step A (main)** | **BLOCKED** | Do not retry; [session](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md) |
| **OpenClaw/Codex bridge** | **DISCOVERY** | Codex-first — [discovery v1](../contracts/openclaw-codex-bridge-discovery-v1.md) |
| **Codex bridge contract** | **DESIGN** | [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) · [session](../sessions/2026-05-25-control-plane-codex-bridge-contract-v1.md) — no runtime |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | unchanged |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel |
| **PM-34 real worker** | gated | unchanged — contract does not unlock |
| **Next tactical step** | pending | **Manual Codex CLI read-only smoke** on Ryzen per [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) §8 — no OpenClaw agent, no provider API key, no n8n |

Entry point: [PROJECT_VISION](PROJECT_VISION.md).