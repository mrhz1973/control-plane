# Ollama qwen3:14b classifier — local API smoke — PASS

**Date:** 2026-05-25  
**Status:** **PASS / DOCS-ONLY REGISTRATION**  
**Scope:** Control Plane foundation v2.0 — local risk classifier on Ryzen (`asusdesktop`)

**No runtime executed in this commit.** Operator completed API smokes manually on Ryzen; this file records sanitized results only.

---

## What was done

Validated **qwen3:14b** as a local risk classifier **only** through the **Ollama HTTP API** on Ryzen (`think=false`, `format=json`, `stream=false`). Single-case and multi-case smokes returned parseable JSON with expected `risk` levels. Documented that **`ollama run` is not suitable** for machine-readable classifier output.

---

## Gates passed

| Gate | Result |
|------|--------|
| 1 — Ollama install + model available (`qwen3:14b`) | **PASS** |
| 2 — Single-case API smoke (JSON, `risk=low`) | **PASS** |
| 3 — Multi-case API smoke (low / medium / high) | **PASS** |
| 4 — Workspace clean after tests | **PASS** |

---

## Sanitized technical facts (allowed)

| Item | Value |
|------|--------|
| Host | Ryzen (`asusdesktop`) |
| Ollama version | `0.24.0` |
| Model | `qwen3:14b` (idle before test; no download required) |
| API path | Local Ollama HTTP API on host (localhost only; port not recorded) |
| API options (classifier) | `stream=false`, `think=false`, `format=json` |
| Single smoke outcome | Valid JSON; `risk=low` for docs-only cleanup scenario |
| Multi-case outcomes | See table below |

| Case ID | Expected | Got | Reason (sanitized) |
|---------|----------|-----|-------------------|
| `low_docs` | low | low | docs-only markdown cleanup, no runtime impact |
| `medium_n8n_disabled_import` | medium | medium | manual import, workflow kept disabled |
| `high_auto_worker` | high | high | autonomous worker / workflow mutation / high-risk automation |

JSON parsing after multi-case: **PASS**.

**Not recorded:** IPs (public or Tailscale), ports, tokens, auth URLs, keys, account emails, full raw API payloads.

---

## Known limitations (not PASS)

| Approach / scope | Result |
|------------------|--------|
| `ollama run qwen3:14b` + classifier prompt | **FAIL** — long thinking/text; not machine format |
| `ollama run` + rigid JSON prompt | **FAIL** — unreliable structured output |
| `/no_think` inside prompt text | **FAIL** — misinterpreted |
| **Conclusion** | Do **not** use `ollama run` for automatic classifier; use **API** with `think=false` + `format=json` |

---

## Explicitly NOT PASS (out of scope)

| Item | State |
|------|--------|
| n8n production / workflow 40–41 integration | **Not** done |
| Tailscale call from n8n | **Not** done |
| OpenClaw / Cursor worker / PM-34 real worker | **Not** unlocked |
| Automatic loop | **Not** started |
| Public ports | **Not** opened |

---

## Constraints respected

| Rule | State |
|------|--------|
| n8n modified | **No** |
| Workflow **40** / **41** | **Not** touched |
| PM-34 real worker | **Still gated** |
| Secrets in git | **No** |
| PC lavoro as runtime node | **No** |

---

## Residual risks

- Wrapper **contract** defined — [classifier-wrapper-v1](../contracts/classifier-wrapper-v1.md); runtime implementation not started.
- Model drift / prompt sensitivity may change JSON reliability — re-smoke after prompt or model changes.
- Production path still requires explicit gates before any n8n or unattended automation.

---

## Related

- [Foundation status](../foundation/FOUNDATION_STATUS.md)
- [PROJECT_VISION §3 / §12](../foundation/PROJECT_VISION.md)
- [Cursor Agent CLI PASS](2026-05-25-control-plane-cursor-agent-cli-install-auth-plan-smoke-pass.md)
- [Tailscale mesh PASS](2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md)
