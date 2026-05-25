# Classifier wrapper contract — design complete (docs-only)

**Date:** 2026-05-25  
**Status:** **DESIGN COMPLETE / DOCS-ONLY**  
**Scope:** Foundation v2 — classifier wrapper JSON contract

**No runtime, HTTP, or Ollama calls in this commit.**

---

## What was done

Authored [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md): input/output JSON, pre-model deterministic guards, post-model validation, Ollama API config alignment, acceptance examples (low/medium/high + invalid fallback).

---

## Preconditions (already PASS)

| Layer | Status |
|-------|--------|
| Tailscale VPS ↔ Ryzen | PASS |
| Cursor Agent CLI (plan smoke) | PASS |
| Ollama `qwen3:14b` API classifier smoke | PASS |

---

## Contract highlights

- **Input:** `event_id`, `event_type`, `summary`, `touched_paths`, `runtime_flags`, `secrets_flags`, `deploy_flags`, `n8n_flags`, `automation_flags`
- **Output:** `risk`, `route`, `reason`, `confidence`, `requires_human`
- **Guards before model:** secrets/deploy/n8n 40–41/autonomous worker → high + human_gate
- **After model:** invalid JSON / low confidence / guard mismatch → human_gate (never silent auto)
- **Config:** local Ollama API, `qwen3:14b`, `stream=false`, `think=false`, `format=json`; no `ollama run`

---

## Not done (by design)

| Item | State |
|------|--------|
| Wrapper executable / script | **No** |
| n8n workflow 40 / 41 | **Untouched** |
| PM-34 real worker | **Still gated** |
| HTTP/Ollama calls in CI/agent | **No** |

---

## Related

- [Contract v1](../contracts/classifier-wrapper-v1.md)
- [Foundation status](../foundation/FOUNDATION_STATUS.md)
- [Ollama API smoke PASS](2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md)
