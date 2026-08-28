# D-0025-W — LiteLLM provider config wiring apply

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_LITELLM_PROVIDER_CONFIG_WIRING_APPLY`  
**Date:** 2026-08-28  
**Operator authorization:** issue #31 comment `5453409836`  
**Status:** **PASS** — provider config wiring live ready  
**Classification:** `LITELLM_PROVIDER_CONFIG_WIRING_LIVE_READY`

| Metric | Value |
|---|---|
| Runtime mutations | **1** (single `litellm-primary` stop/rm/recreate ×2; final state wired) |
| Provider calls | **0** |
| Inference | **0** |
| Secret values read/displayed/persisted | **false** |
| Rollback performed (intermediate) | **true** (first verify timing false-negative) |
| Final rollback required | **false** |

---

## Apply sequence

| Step | Time (UTC) | Result |
|---|---|---|
| Precheck | 14:00:06 | PASS — staged material + baseline match wiring report |
| First apply (exact candidate) | 14:00:12 | Container `efed31e81e2a…` running |
| First verify | 14:00:26 | **FAIL** — `/health/readiness` not ready within ~10 s (startup latency with config load) |
| Rollback (exact persisted) | 14:00:31 | Baseline credentialless restored `ad629029a70a…` |
| Re-apply (same exact candidate) | 14:01:05 | Container `edbb03981626…` running |
| Second verify | 14:01:25 | **PASS** — readiness 200 healthy after ~15 s |

First verify used `wget` before proxy finished config initialization (~10 s post-start). Re-apply used node `fetch` with polling; readiness passed at t=15 s. No candidate deviation.

---

## Final live state (`litellm-primary`)

| Field | Value |
|---|---|
| Container ID | `edbb03981626234b1f75bd91dd5cf205fca9922a1cbe1d38a2d07f0b8163f635` |
| StartedAt | `2026-08-28T14:01:10.735053817Z` |
| State | **running** |
| Image | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| Image ID | `sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| Network | `root_default` |
| Host published ports | **0** (`{}`) |
| Restart policy | `unless-stopped` |
| Cmd | `["--config","/etc/litellm/config.yaml","--port","4000"]` |
| Mounts | **2** (both read-only) |

### Mounts

| Host | Container | RW |
|---|---|---|
| `…/control-plane-primary-remote.template.yaml` | `/etc/litellm/config.yaml` | **false** |
| `…/secrets/chatgpt-auth` | `/secrets/chatgpt-auth` | **false** |

### Env names (values not logged except non-secret paths)

| Name | Present |
|---|---|
| `ZAI_CODING_API_KEY` | **yes** (via `--env-file`; value **not** displayed) |
| `CHATGPT_TOKEN_DIR` | **yes** = `/secrets/chatgpt-auth` |
| `CHATGPT_AUTH_FILE` | **yes** = `auth.json` |
| `LITELLM_MASTER_KEY` | **absent** |

Internal auth path: `/secrets/chatgpt-auth/auth.json`

### Readiness (structural — no `/v1/responses`)

From `root-n8n-1` → `http://litellm-primary:4000/health/readiness`:

```json
{"status":"healthy","db":"Not connected"}
```

HTTP **200**

### Config load evidence (log tail, non-secret)

```
LiteLLM: Proxy initialized with Config, Set models:
    planner-glm-pilot
    planner-codex-pilot
```

---

## Preservation checks

| Entity | Result |
|---|---|
| `root-n8n-1` ID / StartedAt | `ef3520640a8e…` / `2026-08-28T13:11:52Z` — **unchanged** |
| WF40 export | **OK** |
| WF60 export | **OK** |
| WF61 | **not imported** |
| OpenClaw | **unchanged** (not touched) |
| Proxy credentialless | **yes** |

---

## Exact rollback (unchanged from wiring report)

```bash
docker stop litellm-primary && docker rm litellm-primary

docker run -d \
  --name litellm-primary \
  --network root_default \
  --restart unless-stopped \
  ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4 \
  --port 4000
```

---

## Next gate

**Structural provider wiring verify** (optional `/v1/models` metadata from n8n, still no inference) → **WF61 import** (separate gate) → WF40 parent wiring.

Issue **#31** remains **OPEN**.
