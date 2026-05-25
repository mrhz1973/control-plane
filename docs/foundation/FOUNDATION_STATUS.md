# Foundation status (v2.0)

**Updated:** 2026-05-25 (Codex bridge manual smoke V1 partial-blocked)

| Layer | Status | Notes |
|-------|--------|--------|
| **Tailscale VPS ↔ Ryzen** | **PASS** | Private mesh operational — nodes `ubuntu` / `asusdesktop`; [session](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) |
| **Cursor Agent CLI (Ryzen)** | **PASS** | Install + auth + models + plan smoke read-only; [session](../sessions/2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md) |
| **Ollama classifier (Ryzen)** | **PASS** (API only) | `qwen3:14b` via local API; [session](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) |
| **Classifier wrapper contract** | **DESIGN** | [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md) — no runtime yet |
| **Local path preflight (Ryzen)** | **PASS** (read-only) | [session](../sessions/2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md) |
| **OpenClaw gateway (Ryzen)** | **PASS** (loopback manual) | [session](../sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md) |
| **OpenClaw agent Step A (main)** | **BLOCKED** | No provider API key path; do not retry; [session](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md) |
| **OpenClaw/Codex bridge discovery** | **COMPLETE** | Codex-first — [discovery v1](../contracts/openclaw-codex-bridge-discovery-v1.md) |
| **Codex bridge contract v1** | **DESIGN COMPLETE** | [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) |
| **Codex bridge manual smoke V1** | **PARTIAL-BLOCKED** | NON PASS — agentic tool-use vs JSON-only; repo clean; fallback graceful PASS; no `codex resume`; [session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md) |
| **Provider API key policy** | **NO** | No OpenAI (or other) provider API keys for bridge/agent path |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | unchanged — not touched by bridge contract |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel |
| **PM-34 real worker** | gated | unchanged — contract does not unlock |
| **Next tactical step** | pending | **Codex bridge manual smoke V2** — design/execution: inlined files, anti-tool-use prompt, single-turn JSON in fenced block; read-only sandbox, no runtime escalation, no n8n, no PM-34 (V1 lessons in [smoke V1 session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md)) |

Entry point: [PROJECT_VISION](PROJECT_VISION.md) (read-only; not modified by bridge contract task).
