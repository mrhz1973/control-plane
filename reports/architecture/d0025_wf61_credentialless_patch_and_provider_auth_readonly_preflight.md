# D-0025-W — WF61 credentialless patch + provider-auth read-only preflight

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_WF61_CREDENTIALLESS_PATCH_AND_PROVIDER_AUTH_READONLY_PREFLIGHT`  
**Date:** 2026-08-28  
**GPT-Web authoring:** issue #31 comment `5453176557`  
**Baseline:** `origin/main = ae3fdeafabb1ac29bcf4ef77f55e0712888d0bfb`  
**Status:** **WF61 patch PASS** · **provider preflight STOP**  
**Terminal classification:** `STOP_PROVIDER_AUTH_HUMAN_GATE_REQUIRED`

| Metric | Value |
|---|---|
| Repo mutations (WF61 + test + docs) | yes (repo-only) |
| VPS runtime mutations | **0** |
| Provider calls | **0** |
| Inference | **0** |
| Credential / OAuth mutations | **0** |
| Secret values read/displayed/persisted | **false** |
| TeamViewer / WORK-PC network mutations | **0** |

---

## Part 1 — WF61 credential-free patch (verbatim GPT-Web)

**File:** `workflows/61-litellm-primary-remote-planner.template.json`

| Field | Value |
|---|---|
| Pre-patch blob (baseline) | `ebd838c27a3fde388e5e45faf2e8e71feff68483` |
| Post-patch blob (workspace) | `528f40f2111850383953991b2f822ef2816ad621` |
| JSON parse | **PASS** |
| Target HTTP node count | **1** |

### Node `d0025-6106-4006-8006-000000000006` — removed

| Field | Before | After |
|---|---|---|
| `parameters.authentication` | `genericCredentialType` | **absent** |
| `parameters.genericAuthType` | `httpHeaderAuth` | **absent** |
| `credentials.httpHeaderAuth` | placeholder ID/name | **absent** |

### Node `d0025-6106-4006-8006-000000000006` — preserved

| Field | Value |
|---|---|
| method | `POST` |
| URL | `http://litellm-primary:4000/v1/responses` |
| `sendHeaders` | `true` |
| `Content-Type` | `application/json` |
| body | `={{ JSON.stringify($json.request_body) }}` |
| timeout | `120000` |
| response | full-response / text / neverError |
| `onError` | `continueRegularOutput` |
| `alwaysOutputData` | `true` |
| connections / fail-closed branches | unchanged |
| retry / one-shot | single HTTP attempt (no retry node) |
| workflow `active` | **false** |

### Sticky note `d0025-6113-4013-8013-000000000013`

Final runtime-prerequisites paragraph replaced verbatim per GPT-Web comment `5453176557`; preceding text unchanged. Documents credentialless n8n→LiteLLM proxy; no Header Auth / `LITELLM_MASTER_KEY`.

### Structural validation

| Check | Result |
|---|---|
| `tests/litellm-primary-cycle/run.mjs` | **16/16 PASS** (`wf61-structural-pass`) |
| Test updated | credentialless HTTP node required (no auth fields) |

---

## Part 2 — Provider auth / config read-only preflight (VPS)

**Host:** `ionos-n8n` (SSH read-only) · **Timestamp:** `2026-08-28T13:38:58Z`

### `ZAI_CODING_API_KEY` (names only)

| Surface | Present |
|---|---|
| `litellm-primary` container env name | **ABSENT** |
| `/root/.profile` | **ABSENT** |
| `/root/.bashrc` | **ABSENT** |
| `/etc/environment` | **ABSENT** |
| `/root/docker-compose.yml` | file **absent** |

**Classification:** key material is **not** already wired on the LiteLLM host. Next wiring requires **human gate** for creation/transfer + container env injection (no values inspected).

### ChatGPT OAuth store (names / metadata only)

| Surface | Result |
|---|---|
| `CHATGPT_TOKEN_DIR` env name on container | **ABSENT** |
| `CHATGPT_AUTH_FILE` env name on container | **ABSENT** |
| Host env files (names only) | **ABSENT** |
| `/root/.config/litellm/chatgpt` | **ABSENT** |
| `/root/.codex` | **exists** `drwxr-xr-x root:root` (Aug 26) — sqlite/state only; **no** `auth`/`token`/`oauth` files under shallow scan |
| `auth.json` under `/root` (maxdepth 5) | **none found** |
| `chatgpt-auth` directory under `/root` (maxdepth 5) | **none found** |

**Classification:** ChatGPT OAuth store for LiteLLM is **not** present/wireable on VPS without **human gate** (create/transfer path + env wiring; possible device OAuth if store absent on WORK-PC export path).

### `litellm-primary` runtime wiring (metadata)

| Field | Value |
|---|---|
| Container ID | `e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a` |
| StartedAt | `2026-08-28T11:22:56.302613323Z` |
| Mounts | **0** |
| Config file arg | **false** (`cmd=["--port","4000"]` only) |
| Provider/credential env names | **none** (runtime-only: `PATH`, Prisma, `SSL_CERT_FILE`) |
| Proxy credentialless | **true** (unchanged) |

### Canonical template applicability

**Path (VPS checkout):** `/root/local-files/handoff-runtime/control-plane/configs/litellm/control-plane-primary-remote.template.yaml` — **present** (1892 bytes, Aug 28 11:47).

Template references `os.environ/ZAI_CODING_API_KEY` and ChatGPT OAuth via `CHATGPT_TOKEN_DIR` / `CHATGPT_AUTH_FILE`. **Cannot be applied** using existing material alone: requires config mount/apply **and** provider env/OAuth wiring — all absent today. That apply gate is **out of scope** for this preflight (read-only).

---

## Part 3 — No-mutation validation

| Entity | Before | After | Delta |
|---|---|---|---|
| `root-n8n-1` ID / StartedAt | `ef352064…` / `2026-08-28T13:11:52Z` | same | none |
| `litellm-primary` ID / StartedAt | `e9b3828c…` / `2026-08-28T11:22:56Z` | same | none |
| WF40 export | OK | OK | none |
| WF60 export | OK | OK | none |
| WF61 live import | not imported | not imported | none |

---

## Exact next gates (human)

1. **`ZAI_CODING_API_KEY`** — operator creation/transfer to VPS + inject env name on `litellm-primary` (or approved secret mount); **no value read in control-plane pass**.
2. **ChatGPT OAuth store** — establish `CHATGPT_TOKEN_DIR` + `CHATGPT_AUTH_FILE` on LiteLLM host pointing at a valid auth store (transfer from WORK-PC spike path or new device OAuth); **no token contents read**.
3. **LiteLLM config apply** — separate runtime gate: mount/apply `control-plane-primary-remote.template.yaml` with `--config` after (1)+(2); recreate/restart **not** performed in this pass.

Proxy layer remains **credentialless** (no `LITELLM_MASTER_KEY`, no n8n Header Auth). WF61 repo artifact is ready but **must stay unimported** until provider auth/config readiness passes.

---

## Preserved

- OpenClaw / WF40 / WF60 unchanged  
- Qwen deferred  
- GLM **0/10** · Codex **1/10 used / 9 remaining**  
- Schema engine live · control-plane mount RO · private `root_default` · host ports **0**

Issue **#31** remains **OPEN**.
