# Foundation status (v2.0)

**Updated:** 2026-05-26 (mock Codex-output negative tests design packet — docs-only)

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
| **Codex bridge contract v1** | **DESIGN COMPLETE** | §7 invocation profile formalized from V2 — [contract](../contracts/codex-bridge-contract-v1.md) · [profile session](../sessions/2026-05-25-control-plane-bridge-invocation-profile-docs-only.md) |
| **Codex bridge manual smoke V1** | **PARTIAL-BLOCKED** | NON PASS — agentic tool-use vs JSON-only; repo clean; fallback graceful PASS; no `codex resume`; [session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md) |
| **Codex bridge manual smoke V2** | **PASS** | Single-turn JSON-only, inlined files, anti-tool-use prompt, `codex exec --ephemeral -s read-only --output-schema`; repo clean; no `codex resume`; [session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md) |
| **Codex bridge wrapper design** | **DESIGN COMPLETE** | Local JSON-in / pre-gates / §7 invocation / post-gates / JSON-out — [design](../contracts/codex-bridge-wrapper-design-v1.md) · [session](../sessions/2026-05-25-control-plane-bridge-wrapper-design-docs-only.md) |
| **Bridge wrapper runtime dry-run preflight** | **DESIGN PACKET COMPLETE** | PASS/FAIL, fixture policy, forbidden scope — [packet](../decision-packets/bridge-wrapper-runtime-dry-run-preflight.md) · [session](../sessions/2026-05-25-control-plane-bridge-wrapper-runtime-dry-run-preflight-docs-only.md) |
| **Local bridge wrapper dry-run v0** | **PASS** | Fail-closed pre-gates only, no Codex — [wrapper](../../tools/codex-bridge-wrapper/local-bridge-wrapper.mjs) · [fixture](../../tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json) · [session](../sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md) |
| **Local wrapper success-path design packet** | **DESIGN PACKET COMPLETE** | Future Codex-read-only path spec — [packet](../decision-packets/local-wrapper-success-path-design-packet.md) · [session](../sessions/2026-05-26-control-plane-local-wrapper-success-path-design-packet-docs-only.md) |
| **Codex-read-only wrapper dry-run v1** | **PASS** | Regression + §7 Codex read-only via wrapper — [wrapper](../../tools/codex-bridge-wrapper/local-bridge-wrapper.mjs) · [fixture](../../tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json) · [session](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) |
| **Post-dry-run wrapper hardening** | **DOCS COMPLETE** | Proven vs not proven, forbidden escalation — [packet](../decision-packets/post-dry-run-wrapper-hardening.md) · [session](../sessions/2026-05-26-control-plane-post-dry-run-wrapper-hardening-docs-only.md) |
| **Local wrapper negative-test matrix design packet** | **DESIGN PACKET COMPLETE** | Future rejection cases A–H, fixture naming, PASS/FAIL — [packet](../decision-packets/local-wrapper-negative-test-matrix-design-packet.md) · [session](../sessions/2026-05-26-control-plane-local-wrapper-negative-test-matrix-design-packet-docs-only.md) |
| **Local wrapper negative tests static no-Codex** | **PASS** | Six negative fixtures + v0 regression — [fixtures](../../tools/codex-bridge-wrapper/fixtures/negative/) · [session](../sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md) |
| **Local wrapper negative-test hardening** | **DOCS COMPLETE** | Pre-gate proven vs post-Codex gaps — [packet](../decision-packets/local-wrapper-negative-test-hardening.md) · [session](../sessions/2026-05-26-control-plane-local-wrapper-negative-test-hardening-docs-only.md) |
| **Mock Codex-output negative tests design packet** | **DESIGN PACKET COMPLETE** | Post-gate mock categories, fixture policy, PASS/FAIL — [packet](../decision-packets/mock-codex-output-negative-tests-design-packet.md) · [session](../sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-design-packet-docs-only.md) |
| **Provider API key policy** | **NO** | No OpenAI (or other) provider API keys for bridge/agent path |
| **n8n (VPS)** | loopback `127.0.0.1:5678` | unchanged — not touched by bridge contract |
| **Workflow 40 / 41** | untouched | ACTIVE / BACKUP OFF |
| **Public exposure** | none | no Funnel |
| **PM-34 real worker** | gated | unchanged — contract does not unlock |
| **Next tactical step** | pending | **Explicit human gate for mock Codex-output negative fixtures + mock-only negative test run** — no live Codex negative tests without separate gate; no n8n runtime integration; no workflow 40/41 mutation; no PM-34 unlock; no provider API key; no OpenClaw `agent main`; no `codex resume`; no Codex repo mutation; no Cursor worker automation; no deploy/tag/rollback; no unattended automation |

Entry point: [PROJECT_VISION](PROJECT_VISION.md) (read-only; not modified by bridge contract task).
