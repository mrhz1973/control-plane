# D-0025-W — Provider wiring exact read-only preflight

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_PROVIDER_WIRING_EXACT_READONLY_PREFLIGHT`  
**Date:** 2026-08-28  
**Baseline:** `origin/main = 993be4e410a3fae3247056ac700928718396c58d`  
**Status:** **PASS** — wiring candidate ready  
**Classification:** `PROVIDER_MATERIAL_STAGED` · `WIRING_CANDIDATE_READY=true`

| Metric | Value |
|---|---|
| Runtime mutations | **0** |
| Provider calls | **0** |
| Inference | **0** |
| Secret values read/displayed/persisted | **false** |
| TeamViewer / WORK-PC network mutations | **0** |

---

## 1 — Staged provider material (metadata only)

| Artifact | Host path | Size | Owner | Mode | mtime (UTC) | Non-empty |
|---|---|---:|---|---:|---|---|
| Z.AI env file | `/root/local-files/handoff-runtime/secrets/litellm-primary.env` | 69 B | root:root | 600 | 2026-08-28 13:45:52 | **yes** |
| ChatGPT OAuth store | `/root/local-files/handoff-runtime/secrets/chatgpt-auth/auth.json` | 3721 B | root:root | 600 | 2026-08-28 13:49:54 | **yes** |

| Check | Result |
|---|---|
| Env file key names ( `-f1` only) | **`ZAI_CODING_API_KEY`** (sole key) |
| Env file contents read | **no** |
| `auth.json` contents read | **no** |
| Parent dirs | `/root/local-files/handoff-runtime/secrets` `drwx------ root:root` · `chatgpt-auth/` `drwx------ root:root` |

**Shape compatibility (without reading VPS token values):** `auth.json` byte size **3721** matches the D-0024 WORK-PC store verified live in issue #30 recovery (`chatgpt/gpt-5.6-sol` catalog PASS). LiteLLM **1.98.0** `Authenticator` reads JSON dict from `CHATGPT_TOKEN_DIR`/`CHATGPT_AUTH_FILE` — no alternate shape required by source inspection.

---

## 2 — Live `litellm-primary` baseline (reconstructed)

| Field | Value |
|---|---|
| Container ID | `e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a` |
| Name | `litellm-primary` |
| State / StartedAt | running · `2026-08-28T11:22:56.302613323Z` |
| Restart policy | `unless-stopped` |
| Network | `root_default` (bridge) |
| Host published ports | **0** (`PortBindings={}` · `PublishAllPorts=false`) |
| Image (pinned) | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| Image ID | `sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| RepoDigest | `ghcr.io/berriai/litellm@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| Entrypoint | `["docker/prod_entrypoint.sh"]` |
| Cmd | `["--port","4000"]` |
| Mounts | **0** |
| Env names | `PATH`, Prisma-related, `SSL_CERT_FILE` only — **no provider env** |
| Process user | **root** (`docker top` → litellm as root) |
| Proxy credentialless | **yes** — no `LITELLM_MASTER_KEY` |

### Original authorized create (rollback target)

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

## 3 — Network / sibling safety

| Check | Result |
|---|---|
| `root_default` ID | `f8b0d12255f8…` (bridge) |
| Members | `litellm-primary`, `root-n8n-1` |
| `root-n8n-1` ID / StartedAt | `ef3520640a8e…` · `2026-08-28T13:11:52.618956662Z` — **unchanged** |
| WF40 / WF60 export | **OK** |
| WF61 imported | **no** |

---

## 4 — Canonical config artifact

**Host path:** `/root/local-files/handoff-runtime/control-plane/configs/litellm/control-plane-primary-remote.template.yaml` (1892 B, present on VPS checkout `db7879e0`)

| Requirement | Template binding |
|---|---|
| GLM | `api_key: os.environ/ZAI_CODING_API_KEY` |
| Codex | `chatgpt/gpt-5.6-sol` · OAuth via env store |
| Proxy master key | **absent** (credentialless preserved) |

**Recommended internal mount (read-only):** `/etc/litellm/config.yaml`  
**Required CLI addition:** `--config /etc/litellm/config.yaml` (alongside existing `--port 4000`)

LiteLLM **1.98.0** entrypoint: `exec litellm "$@"` — passes `--config` through.

---

## 5 — ChatGPT OAuth wiring (LiteLLM 1.98.0 source)

From `litellm/llms/chatgpt/authenticator.py`:

```python
self.token_dir = os.getenv("CHATGPT_TOKEN_DIR", os.path.expanduser("~/.config/litellm/chatgpt"))
self.auth_file = os.path.join(self.token_dir, os.getenv("CHATGPT_AUTH_FILE", "auth.json"))
```

| Variable | Required? | Recommended value |
|---|---|---|
| `CHATGPT_TOKEN_DIR` | **yes** (default container path wrong) | `/secrets/chatgpt-auth` |
| `CHATGPT_AUTH_FILE` | optional but **explicit recommended** | `auth.json` |

**Exact internal auth path:** `/secrets/chatgpt-auth/auth.json`

**Recommended mount:** host `/root/local-files/handoff-runtime/secrets/chatgpt-auth` → container `/secrets/chatgpt-auth:ro`

Container runs as **root** → mode **600** root-owned staged files remain readable on bind mount.

---

## 6 — Z.AI env wiring

| Mechanism | Detail |
|---|---|
| Host staged file | `/root/local-files/handoff-runtime/secrets/litellm-primary.env` |
| Docker wiring | `--env-file /root/local-files/handoff-runtime/secrets/litellm-primary.env` |
| Injected env name | `ZAI_CODING_API_KEY` (name verified; value **not** read) |
| Config mount | **not required** for env file — Docker injects at create time |

No literal key in YAML (template uses `os.environ/ZAI_CODING_API_KEY`).

---

## 7 — Candidate recreate command (NEXT runtime gate — DO NOT RUN in this pass)

Equivalent baseline + sole provider/config additions:

```bash
docker stop litellm-primary && docker rm litellm-primary

docker run -d \
  --name litellm-primary \
  --network root_default \
  --restart unless-stopped \
  --env-file /root/local-files/handoff-runtime/secrets/litellm-primary.env \
  -e CHATGPT_TOKEN_DIR=/secrets/chatgpt-auth \
  -e CHATGPT_AUTH_FILE=auth.json \
  -v /root/local-files/handoff-runtime/control-plane/configs/litellm/control-plane-primary-remote.template.yaml:/etc/litellm/config.yaml:ro \
  -v /root/local-files/handoff-runtime/secrets/chatgpt-auth:/secrets/chatgpt-auth:ro \
  ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4 \
  --config /etc/litellm/config.yaml \
  --port 4000
```

### Candidate invariants

| Invariant | Preserved |
|---|---|
| Image digest pinned | **yes** |
| Container name | **yes** |
| Network `root_default` | **yes** |
| Host ports | **0** |
| `LITELLM_MASTER_KEY` | **absent** |
| n8n / WF40 / WF60 / OpenClaw | **untouched by this command** |

### Post-recreate verification (separate gate, no provider HTTP required for wiring gate)

1. `docker inspect litellm-primary` — mounts=2, config cmd includes `--config`
2. Env **names** present: `ZAI_CODING_API_KEY`, `CHATGPT_TOKEN_DIR`, `CHATGPT_AUTH_FILE` (do not log values)
3. `GET /health/readiness` from `root-n8n-1` (optional structural probe — no `/v1/responses`)

---

## 8 — Exact rollback

Restore credentialless baseline (section 2 rollback block). Removes provider env injection, config mount, and auth mount; returns to `--port 4000` only.

---

## 9 — Next gate classification

| Gate | Action |
|---|---|
| **Immediate next** | `D-0025-W_LITELLM_PROVIDER_CONFIG_WIRING_APPLY` — execute candidate recreate above (operator-authorized runtime mutation) |
| **After wiring** | Read-only structural verify (health/models list metadata, no inference) |
| **Later** | WF61 import · WF40 parent wiring |

Issue **#31** remains **OPEN**.
