# D-0025-W — LiteLLM auth design read-only preflight

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W-LITELLM-AUTH-DESIGN-READONLY-PREFLIGHT`  
**Date:** 2026-08-28  
**Status:** **PASS**  
**Operator references:** issue #31 comment `5453047517` (schema review) · standing AUTO-VIA `5452941338`  
**Runtime mutations:** 0  
**Inference / provider calls:** 0  
**Credential / OAuth mutations:** 0  
**Secret exposure:** false  
**TeamViewer / WORK-PC network mutations:** 0

## Result summary

| Field | Classification |
|---|---|
| **PROXY_AUTH_REQUIRED (current live)** | **false** → **UNNECESSARY** |
| **PROVIDER_AUTH_REQUIRED (future config gate)** | **true** (separate gate) |
| **PRIVATE_DOCKER_ONLY** | **true** |
| **UNTRUSTED_SIBLING_PRESENT** | **false** |
| **Recommendation** | **CREDENTIALLESS_PRIVATE_PROXY** |

---

## Scope 1 — `litellm-primary` current state (read-only)

| Field | Value |
|---|---|
| Image | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| Container ID | `e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a` |
| StartedAt | `2026-08-28T11:22:56.302613323Z` |
| Entrypoint / Cmd | `docker/prod_entrypoint.sh` · `--port 4000` |
| Network mode | `root_default` |
| Host published ports | **0** (`PortBindings={}`) |
| Mounts | **none** |
| Config file arg | **false** |
| Config mount | **false** |
| `LITELLM_MASTER_KEY` env name present | **false** |
| Provider/credential env names | **none** (only runtime names: `PATH`, `SSL_CERT_FILE`, Prisma-related) |
| Proxy currently credentialless | **true** |

---

## Scope 2 — current proxy auth behavior

### Live evidence (no POST /v1/responses)

| Probe | From | Result |
|---|---|---|
| `GET /health/readiness` | `root-n8n-1` → `litellm-primary:4000` | **200** |
| `GET /v1/models` | `root-n8n-1` → `litellm-primary:4000` | **200** · `{"data":[],"object":"list"}` · **no Authorization header** |

### LiteLLM 1.98.0 source (in-container, read-only)

From `litellm/proxy/proxy_server.py`:

> `LITELLM_MASTER_KEY is not set! All requests will be treated as INTERNAL_USER with no admin access.`

From `litellm/proxy/auth/user_api_key_auth.py`:

- When `master_key is None`, builder returns `INTERNAL_USER` without requiring API key.
- Comment explicitly documents **“No-auth dev mode: master_key unset … The proxy is unauthenticated by configuration.”**

### Classification

| Case | Current live |
|---|---|
| A. No master key → `/v1/responses` does not require proxy auth | **true** (supported by source + GET behavior) |
| B. Master key mandatory for all proxy routes | **false** (not configured) |
| C. Other mechanism (JWT/OAuth2 proxy auth) | **false** (not configured) |

**PROXY_AUTH_REQUIRED = false** for the deployed credentialless instance.

---

## Scope 3 — private exposure model

| Check | Result |
|---|---|
| `litellm-primary` on `root_default` only | **yes** |
| Host published ports | **0** |
| Network mode != host | **yes** |
| `root-n8n-1` on same `root_default` | **yes** |
| Docker DNS `litellm-primary` | resolvable (prior deploy evidence) |

### `root_default` members (names only)

1. `root-n8n-1`
2. `litellm-primary`

| Field | Value |
|---|---|
| **PRIVATE_DOCKER_ONLY** | **true** |
| **UNTRUSTED_SIBLING_PRESENT** | **false** |

No network membership mutation performed.

---

## Scope 4 — WF61 auth requirement (artifact read-only)

**File:** `workflows/61-litellm-primary-remote-planner.template.json`  
**Node:** `HTTP Request - LiteLLM primary one-shot`

| Field | Value |
|---|---|
| URL | `http://litellm-primary:4000/v1/responses` |
| Method | `POST` |
| `authentication` | `genericCredentialType` |
| `genericAuthType` | `httpHeaderAuth` |
| Credential placeholder ID | `LITELLM_PRIMARY_HEADER_AUTH_CREDENTIAL_ID` |
| Credential placeholder name | `CONTROL PLANE - LiteLLM Primary Header Auth` |

Artifact **not modified**.

### WF61 Header Auth classification vs current topology

| Classification | Rationale |
|---|---|
| **UNNECESSARY** (current live) | Live proxy has no `LITELLM_MASTER_KEY`; LiteLLM 1.98.0 treats requests as unauthenticated when master key unset; private Docker-only boundary with no untrusted siblings. |
| Would become **REQUIRED** only if | Operator later enables `LITELLM_MASTER_KEY` / `general_settings.master_key` on LiteLLM. |

GPT-Web may remove the Header Auth placeholder in a subsequent **repo-only** WF61 patch if credentialless private proxy remains the chosen design.

---

## Scope 5 — future provider config impact

**File:** `configs/litellm/control-plane-primary-remote.template.yaml`

| Auth layer | Required when config gate applies? | Mechanism |
|---|---|---|
| **Provider auth** | **yes** | `ZAI_CODING_API_KEY` env on LiteLLM host for GLM; ChatGPT OAuth local store for Codex |
| **Proxy auth (n8n → LiteLLM)** | **not implied** | Template sets no `general_settings.master_key`; provider credentials ≠ proxy master key |

Adding provider credentials does **not** necessarily require a LiteLLM master key or n8n Header Auth. Those remain independent decisions.

---

## Scope 6 — decision matrix

### OPTION A — Credentialless private Docker proxy (**RECOMMENDED**)

| Dimension | Assessment |
|---|---|
| Security boundary | Docker network isolation; only `root-n8n-1` can reach `:4000`; no host exposure |
| Runtime mutations | none for proxy auth |
| Secret required | **false** for n8n→LiteLLM |
| LiteLLM restart/recreate | **not required** for auth |
| n8n credential | **not required** |
| WF61 artifact change | optional repo-only removal of Header Auth placeholder |
| Compatible with `root_default` | **yes** |

### OPTION B — LiteLLM master key + n8n Header Auth

| Dimension | Assessment |
|---|---|
| Security boundary | Adds shared secret between n8n and LiteLLM inside Docker |
| Runtime mutations | set `LITELLM_MASTER_KEY`, recreate/restart LiteLLM; create/bind n8n Header Auth credential |
| Secret required | **true** (master key) |
| LiteLLM restart/recreate | **true** |
| n8n credential | **true** |
| WF61 artifact change | bind real credential ID (GPT-Web) |
| Compatible with `root_default` | **yes** |

### OPTION C — Other (JWT/OAuth2 proxy auth)

| Dimension | Assessment |
|---|---|
| Status | **not supported/present** in current deployment or template |
| Recommendation | **not applicable** |

### Preferred design

**CREDENTIALLESS_PRIVATE_PROXY**

Conditions met:

- host ports = 0
- private Docker-only (`root-n8n-1` + `litellm-primary` only)
- no untrusted sibling
- LiteLLM 1.98.0 supports unauthenticated proxy when master key unset

**Not** `REAL_CREDENTIAL_GATE_REQUIRED` for n8n→LiteLLM Header Auth at this stage.

Separate future gate remains for **provider** credentials (`ZAI_CODING_API_KEY`, ChatGPT OAuth) on LiteLLM — distinct from proxy auth.

---

## Scope 7 — no-mutation validation

| Entity | Before | After | Delta |
|---|---|---|---|
| `root-n8n-1` ID | `ef3520640a8e7006a58655109b8da3c69af40a03da6b79de4865723b67077568` | same | none |
| `root-n8n-1` StartedAt | `2026-08-28T13:11:52.618956662Z` | same | none |
| `litellm-primary` ID | `e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a` | same | none |
| `litellm-primary` StartedAt | `2026-08-28T11:22:56.302613323Z` | same | none |
| WF40 | active `9ZMj2ACTKyDVhCue` | unchanged | none |
| WF60 | inactive `d0015600-4001-8001-0001-0653506aabcd` | unchanged | none |
| WF61 | not imported | not imported | none |

| Metric | Value |
|---|---|
| provider_calls | 0 |
| inference | 0 |
| credential/OAuth mutations | 0 |
| compose/network mutations | 0 |

---

## Preserved

- OpenClaw / WF40 / WF60 unchanged
- Qwen deferred
- GLM **0/10** · Codex **1/10 used / 9 remaining**
- Schema engine live · control-plane mount RO

---

## Next gates (separate)

1. **Provider config gate** — mount/apply `control-plane-primary-remote.template.yaml`, `ZAI_CODING_API_KEY`, ChatGPT OAuth (LiteLLM host)
2. **WF61 import** — prefer GPT-Web repo-only patch removing Header Auth placeholder before import if credentialless design accepted
3. Parent WF40 wiring (later)

Issue **#31** remains **OPEN**.
