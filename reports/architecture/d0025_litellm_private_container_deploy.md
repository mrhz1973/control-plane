# D-0025-W — LiteLLM private container deploy

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W-LITELLM-PRIVATE-CONTAINER-DEPLOY`  
**Date:** 2026-08-28  
**Status:** PASS — private sibling container deployed  
**Operator authorization:** issue #31 comment `5451709148`  
**Runtime mutations:** 1 bounded (create/start `litellm-primary` on existing `root_default`)  
**Inference / provider calls:** 0  
**Credential / OAuth mutations:** 0  
**n8n workflow mutations:** 0  
**Secret values read/displayed/persisted:** 0  
**TeamViewer / WORK-PC network mutations:** 0

## Deployment classification

**PRIVATE_PROXY_READY_CREDENTIALLESS**

- Container running with pinned LiteLLM **1.98.0** image
- Uvicorn proxy listening on internal `0.0.0.0:4000` (no host publish)
- No provider config mount, no API keys, no OAuth material, no master key
- Provider/model readiness intentionally deferred to later credential/config gate

---

## Precheck (before mutation)

| Check | Result |
|---|---|
| issue #31 | **OPEN** |
| authorization comment `5451709148` | **present** |
| VPS host arch | **x86_64** |
| `root-n8n-1` | **running** · StartedAt `2026-08-21T21:38:26.189399585Z` · RestartCount **0** |
| `root_default` network | **exists** (bridge) |
| existing `litellm-primary` | **none** |
| Docker anomalies | **none observed** |

---

## Image pin verification

| Field | Value |
|---|---|
| Image ref | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| RepoDigest after pull | `ghcr.io/berriai/litellm@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| Architecture | **amd64** |
| LiteLLM package version (in-container) | **1.98.0** (`/app/.venv/lib/python3.13/site-packages/litellm-1.98.0.dist-info/METADATA`) |

Digest/architecture match: **PASS**

---

## Container deploy

| Field | Value |
|---|---|
| Container name | `litellm-primary` |
| Container ID | `e9b3828c5992` |
| State | **running** |
| Restart policy | `unless-stopped` |
| Network mode | `root_default` |
| Host published ports | **0** (`PortBindings={}`) |
| Internal exposed port | `4000/tcp` (Docker network only) |
| `--network host` | **not used** |
| New Docker network created | **no** |
| `-p` / `--publish` | **not used** |

### Authorized create command (sanitized)

```bash
docker run -d \
  --name litellm-primary \
  --network root_default \
  --restart unless-stopped \
  ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4 \
  --port 4000
```

No environment variables, bind mounts, or credential-like placeholders were set.

### Startup evidence (log tail, non-secret)

```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:4000 (Press CTRL+C to quit)
```

---

## Private network evidence

| Check | Result |
|---|---|
| `root_default` members | `root-n8n-1`, `litellm-primary` |
| Docker DNS from `root-n8n-1` → `litellm-primary` | **172.18.0.3** (IPv4) |
| Provider/model HTTP call from n8n | **not performed** |
| Inference | **0** |

DNS/name resolution only; no `/v1/responses` probe in this gate.

---

## n8n safety (after deploy)

| Field | Before | After | Delta |
|---|---|---|---|
| `root-n8n-1` state | running | running | none |
| StartedAt | `2026-08-21T21:38:26.189399585Z` | same | none |
| RestartCount | 0 | 0 | none |
| WF40/WF60 | unchanged | unchanged | none |
| n8n workflow import/update/execute | — | **none** | — |

---

## Scope budget (this pass)

| Metric | Value |
|---|---|
| provider_calls | 0 |
| inference | 0 |
| GLM | 0 |
| Codex | 0 |
| Qwen | 0 |
| credential/OAuth mutations | 0 |
| n8n mutations | 0 |
| OpenClaw mutations | 0 |
| WORK-PC/TeamViewer network mutations | 0 |
| secret_exposure | false |

---

## Preserved (not touched)

- OpenClaw / WF60 / WF40 live unchanged
- WF61 not imported
- control-plane read-only mount not created
- VPS schema engine not installed
- credential/OAuth state unchanged
- firewall / Tailscale / public listener unchanged

---

## Next separate gates

1. control-plane read-only mount into `root-n8n-1`
2. isolated Ajv/ajv-formats on n8n surface
3. Header Auth credential binding
4. WF61 inactive import
5. parent ingress / WF40 wiring (later)

Issue **#31** remains **OPEN**.
