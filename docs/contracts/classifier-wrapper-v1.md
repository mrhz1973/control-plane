# Classifier wrapper — design & contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/classifier-wrapper-v1.md`  
**Version:** `classifier-wrapper-v1`  
**Date:** 2026-05-25  
**Status:** **DESIGN ONLY** — no runtime implementation in this document

**Related:** [Ollama API smoke PASS](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) · [PROJECT_VISION](../foundation/PROJECT_VISION.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md) · [PM-17 dry-run (historical)](../PM17_OLLAMA_CLASSIFIER_DRY_RUN.md)

---

## 0. Scope statements (mandatory)

| Statement | Value |
|-----------|--------|
| This document | **Design / contract only** — no executable wrapper shipped here |
| Runtime calls | **None** required to adopt this contract |
| n8n workflow 40 / 41 | **Not** modified by this design |
| Tailscale-from-n8n | **Not** in scope |
| PM-34 real worker | **Not** unlocked |
| `ollama run` | **Not** used for machine output — [API smoke](../sessions/2026-05-25-control-plane-ollama-qwen3-classifier-api-smoke-pass.md) proved API-only path |

---

## 1. Purpose of the wrapper

The classifier wrapper is the **controlled boundary** between control-plane events and the local Ollama model (`qwen3:14b`). It must:

1. Call the **Ollama local HTTP API** only (never `ollama run` for production classification).
2. Classify control-plane events into **`low` | `medium` | `high`** risk.
3. Emit **`route`** and **`requires_human`** suitable for automation policy (default safe = human).
4. Produce **JSON that validates** against the output contract below.
5. On any invalid, uncertain, or guarded input → **fallback to human gate** (`route: human_gate`, `requires_human: true`).

The wrapper is **not** an implementer: it does not edit repos, push code, or mutate n8n workflows.

---

## 2. Input JSON (minimum contract)

All fields are required unless marked optional. Values must be JSON-serializable; no secrets in `summary` or paths.

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | string | Stable id for dedup/logging (opaque, no PII) |
| `event_type` | string | e.g. `docs_commit`, `plan_import`, `workflow_change`, `deploy_request` |
| `summary` | string | Short human-readable description (sanitized, no tokens/URLs with credentials) |
| `touched_paths` | string[] | Repo-relative paths affected (may be empty) |
| `runtime_flags` | object | Booleans/labels for runtime touch (see keys below) |
| `secrets_flags` | object | Signals touching credentials, auth, billing |
| `deploy_flags` | object | Deploy, rollback, production runtime |
| `n8n_flags` | object | n8n / workflow 40 / 41 involvement |
| `automation_flags` | object | Unattended worker, auto commit-push, loops |

### 2.1 Flag objects (minimum keys)

Each `*_flags` object SHOULD include at least:

```json
{
  "touched": false,
  "detail": ""
}
```

Recommended optional keys (non-breaking): `workflow_40`, `workflow_41`, `import_disabled`, `docs_only`, `autonomous_worker`, `commit_push_loop`.

### 2.2 Example input — docs-only (low candidate)

```json
{
  "event_id": "evt-20260525-docs-001",
  "event_type": "docs_commit",
  "summary": "Markdown cleanup under docs/foundation only",
  "touched_paths": ["docs/foundation/FOUNDATION_STATUS.md"],
  "runtime_flags": { "touched": false, "detail": "" },
  "secrets_flags": { "touched": false, "detail": "" },
  "deploy_flags": { "touched": false, "detail": "" },
  "n8n_flags": { "touched": false, "workflow_40": false, "workflow_41": false },
  "automation_flags": { "touched": false, "autonomous_worker": false, "commit_push_loop": false }
}
```

---

## 3. Output JSON (minimum contract)

| Field | Type | Allowed values |
|-------|------|----------------|
| `risk` | string | `low` \| `medium` \| `high` |
| `route` | string | `auto_allowed` \| `human_gate` \| `blocked` |
| `reason` | string | Brief justification (no secrets) |
| `confidence` | string | `low` \| `medium` \| `high` |
| `requires_human` | boolean | `true` if human decision required before proceed |

### 3.1 Route semantics

| `route` | Meaning |
|---------|---------|
| `auto_allowed` | May proceed without human gate **only** if policy + guards agree and `requires_human` is `false` |
| `human_gate` | Stop for human via Telegram / Decision Packet |
| `blocked` | Do not proceed automatically; human must explicitly override |

**Default safe:** if ambiguous → `human_gate` + `requires_human: true`.

---

## 4. Deterministic guards (BEFORE model)

Evaluate in order. If any rule matches, **skip the model** and return the guard result (still valid output JSON).

| Condition (any true) | Forced `risk` | Forced `route` | `requires_human` |
|----------------------|---------------|----------------|------------------|
| `secrets_flags.touched` OR summary/paths imply credentials, auth, billing | `high` | `human_gate` | `true` |
| `deploy_flags.touched` OR deploy / rollback / production runtime | `high` | `human_gate` | `true` |
| `n8n_flags` indicates workflow **40** or **41** mutation | `high` | `human_gate` | `true` |
| `automation_flags.autonomous_worker` OR unattended commit-push loop without gate | `high` | `human_gate` | `true` |
| Docs-only: all paths under allowed docs prefixes, no runtime/deploy/secrets/n8n/automation flags | `low` (candidate) | — | — (model may refine) |
| Manual/disabled runtime-adjacent import (e.g. n8n import kept disabled) | `medium` (candidate) | — | — |

**Allowed docs prefixes (low candidate):** `docs/`, `docs/foundation/`, `docs/sessions/`, `docs/contracts/`, `docs/plans/`, `docs/handoffs/` — must not include `workflow`, `.env`, `secrets`, or `src/` runtime trees unless explicitly gated elsewhere.

Guard output MUST set `confidence: high` and `reason` citing the matched rule id (e.g. `guard:secrets_touched`).

---

## 5. Model invocation (when guards do not force exit)

Only after guards pass to “call model”:

| Parameter | Value |
|-----------|--------|
| Transport | Ollama **local HTTP API** on Ryzen (host not recorded in git) |
| Model | `qwen3:14b` |
| `stream` | `false` |
| `think` | `false` |
| `format` | `json` |

**Prohibited:** `ollama run`, storing raw chain-of-thought, logging full prompts that may contain secrets, persisting API keys or auth URLs.

Prompt to the model MUST include the input JSON and instruct: respond with **only** the output JSON schema fields.

---

## 6. Post-model rules (AFTER model)

If any check fails → override to safe fallback:

| Condition | Forced outcome |
|-----------|----------------|
| Response is not valid JSON | `risk: high`, `route: human_gate`, `requires_human: true`, `confidence: low`, `reason: fallback:invalid_json` |
| Missing required output keys | same fallback (`fallback:missing_keys`) |
| `risk` not in `low\|medium\|high` | same (`fallback:risk_out_of_schema`) |
| `confidence` is `low` | `route: human_gate`, `requires_human: true` (merge reason) |
| Model timeout or API error | same (`fallback:model_error`) |
| Guard said `high` but model says `low` / `auto_allowed` | **Never auto** — use `human_gate` or `blocked` (`fallback:guard_model_mismatch`) |
| Guard said `medium`+ but model says `auto_allowed` with `requires_human: false` | `human_gate` (`fallback:elevated_guard`) |

**Rule:** mismatch between deterministic guard and model → **`human_gate` or `blocked`**, never silent `auto_allowed`.

---

## 7. Acceptance criteria (design closure)

### 7.1 Example — low (docs-only)

**Input:** §2.2 example.  
**Guard:** low candidate → model called.  
**Expected output:**

```json
{
  "risk": "low",
  "route": "auto_allowed",
  "reason": "docs-only under allowed paths; no runtime or workflow flags",
  "confidence": "high",
  "requires_human": false
}
```

*Policy note:* `auto_allowed` still requires an explicit runtime gate before any unattended automation — this contract does not enable loops.

### 7.2 Example — medium (manual n8n import, disabled)

**Input (abbreviated):** `event_type: plan_import`, `n8n_flags: { "touched": true, "import_disabled": true, "workflow_40": false }`.  
**Expected output:**

```json
{
  "risk": "medium",
  "route": "human_gate",
  "reason": "runtime-adjacent n8n import; workflow kept disabled",
  "confidence": "high",
  "requires_human": true
}
```

### 7.3 Example — high (autonomous worker)

**Input (abbreviated):** `automation_flags: { "autonomous_worker": true, "commit_push_loop": true }`.  
**Guard:** forces high **before** model.  
**Expected output:**

```json
{
  "risk": "high",
  "route": "human_gate",
  "reason": "guard:autonomous_worker",
  "confidence": "high",
  "requires_human": true
}
```

### 7.4 Example — invalid model output → fallback

**Model returns:** `not json` or `{ "risk": "maybe" }`.  
**Expected wrapper output:**

```json
{
  "risk": "high",
  "route": "human_gate",
  "reason": "fallback:invalid_json",
  "confidence": "low",
  "requires_human": true
}
```

### 7.5 Design-only checklist

- [x] Input/output JSON defined  
- [x] Pre-model guards defined  
- [x] Post-model validation & fallback defined  
- [x] Ollama API config aligned with smoke PASS  
- [x] low / medium / high examples documented  
- [x] invalid-output fallback example documented  
- [x] Explicit: **no runtime** in this commit path  
- [x] Explicit: **does not unlock PM-34**

---

## 8. Relationship to PM-17

[PM-17](../PM17_OLLAMA_CLASSIFIER_DRY_RUN.md) used schema `pm17-classifier-v1` for plan-file dry-run. **Foundation v2** uses this contract for event-shaped control-plane classification. Future implementation MAY map PM-17 fields into `event_type` / flags or version the schema — until then, **this document prevails** for foundation tactical work.

---

## 9. Next gates (not in this document)

| Gate | Status |
|------|--------|
| Wrapper runtime implementation | **Not started** |
| n8n HTTP node to wrapper | **Forbidden** until explicit PM/runtime packet |
| End-to-end loop | **Backlog** per [PROJECT_VISION §12](../foundation/PROJECT_VISION.md) |
