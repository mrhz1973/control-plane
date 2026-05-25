# Codex bridge contract v1 — design complete

**Date:** 2026-05-25  
**Status:** **DESIGN COMPLETE / DOCS-ONLY**  
**Artifact:** [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md)

**No runtime.** PROJECT_VISION.md **not** modified.

---

## What was done

Published **codex-bridge-v1**: input/output JSON, component roles, deterministic guards, security rules, acceptance examples (low/medium/high/blocked), and definition of next **manual Codex CLI read-only smoke** (not executed in this commit).

---

## Preconditions

| Prerequisite | State |
|--------------|--------|
| Bridge discovery | [openclaw-codex-bridge-discovery-v1](../contracts/openclaw-codex-bridge-discovery-v1.md) — Codex-first |
| Classifier contract | [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md) |
| OpenClaw gateway | PASS (transport only) |
| OpenClaw agent Step A | BLOCKED — do not retry |
| Policy | No provider API key |

---

## Next gate

**Manual Codex CLI read-only smoke** on Ryzen per contract §8 — see [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md).

---

## Still gated

PM-34 · n8n · workflow 40/41 · Codex exec · OpenClaw agent · Cursor worker · auto loop

---

## Related

- [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)
