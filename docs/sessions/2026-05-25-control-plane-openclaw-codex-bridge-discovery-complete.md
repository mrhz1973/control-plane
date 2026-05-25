# OpenClaw/Codex no-provider-API bridge — discovery complete

**Date:** 2026-05-25  
**Status:** **DISCOVERY COMPLETE / DOCS-ONLY**  
**Artifact:** [openclaw-codex-bridge-discovery-v1](../contracts/openclaw-codex-bridge-discovery-v1.md)

**No runtime.** PROJECT_VISION.md **not** modified.

---

## Recommendation (single direction)

**Codex-first local bridge:** Codex CLI + ChatGPT Plus OAuth on Ryzen as orchestration path; OpenClaw gateway remains optional loopback transport (PASS); **do not** use OpenClaw `agent main` or OpenAI provider API keys.

**Rejected primary path:** OpenClaw profile without API key (Option B) — blocked by Step A evidence.

---

## Options summary

| Option | Verdict |
|--------|---------|
| A — Codex CLI/OAuth direct | **Execution lane** (next manual gates) |
| B — OpenClaw config sans API key | **Deferred / research only** |
| C — Local JSON bridge + Codex subprocess | **Architecture** (recommended wrapper) |

---

## Next gate

1. Docs: **Codex bridge contract v1** (read-only JSON)  
2. Manual: Codex CLI read-only smoke on Ryzen (no exec, no agent retry)  
3. n8n / PM-34: still **gated**

---

## Related

- [Step A blocked](2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md)
- [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)
