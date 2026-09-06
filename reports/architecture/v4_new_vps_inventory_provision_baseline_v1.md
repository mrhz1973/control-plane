# V4 new VPS inventory + non-destructive provisioning baseline

**TASK_REF:** `V4_NEW_VPS_INVENTORY_PROVISION_BASELINE_V1`  
**Issues:** #62 (this pass) · parent #60  
**Classification:** `PASS`  
**Timestamp (UTC):** `2026-09-06T19:48:20Z`  
**BASE_HEAD:** `4023a6152af4ad26e6b58a0c2de674ba08443803`  
**Hosts:** OLD `ionos-n8n` (`217.160.71.145`) · NEW `ionos-n8n-new` (`31.70.139.51`)  
**Cutover:** **NOT performed** · OLD remains LIVE production

No secret values (passwords, API keys, tokens, cookies, private keys, credentials) are recorded here. Only names, paths, presence, and lengths.

---

## 1. OLD AS-IS

| Item | Proven value |
|---|---|
| OS | Ubuntu 24.04.4 LTS (`noble`) |
| Kernel | `6.8.0-138-generic` · **REBOOT_REQUIRED=YES** (`linux-image-6.8.0-139-generic`) — **do not reboot** |
| CPU / RAM | 4 vCPU (AMD EPYC-Milan) · 3.8 GiB · swapfile 1.0 GiB **~100% used** |
| Disk | 120G vda · `/` ext4 116G, 66G used (58%) |
| Hostname / MagicDNS | `ubuntu` / `ubuntu.tailc01234.ts.net` |
| Public IPv4 | `217.160.71.145` |
| Tailscale IPv4 | `100.114.7.53` (`tailscale0`) · v1.102.3 · Serve/Funnel: none |
| Uptime at inventory | 15 days |
| Docker | `docker.io` 29.1.3 + Compose plugin **v5.5.0** · project `root` · file `/root/docker-compose.yaml` (mode 0600, uid 0) |
| Host Node | system `/usr/bin/node` **v18.19.1** · root nvm default **v22.23.2** (Hermes/tooling) · OpenClaw bundled Node **v24.19.0** at `/opt/openclaw-node` |
| Python | 3.12.3 |
| Users of interest | `cpinbox` 1000:1000 · `hermes-test` 1001:1001 · `graphhopper` 997:988 |

### Live Docker (unchanged through this pass)

| Container | Image | Status | Publish | Restart | StartedAt (unchanged) |
|---|---|---|---|---|---|
| `root-n8n-1` | `docker.n8n.io/n8nio/n8n:2.33.3` (`sha256:769d3a62…1cc9`) | running, rc=0 | `127.0.0.1:5678→5678` | always | `2026-09-05T08:15:02Z` |
| `root-postgres-1` | `postgres@sha256:f1c3376c…6f94` (16.15) | running **healthy**, rc=0 | 5432 **internal only** | always | `2026-09-01T14:32:36Z` |
| `litellm-primary` | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa6…ed2f4` | running, rc=0 | 4000 **internal only** | unless-stopped | `2026-08-28T14:01:10Z` |

Network: `root_default` `172.18.0.0/16` (all three containers). LiteLLM is **not** Compose-managed (empty compose labels).

**n8n health:** HTTP 200 `{"status":"ok"}` at inventory and at close.

### PostgreSQL topology

- Live volume (compose override `name:`): `root_n8n_postgres_data_seqresync_retry_prod` → `/var/lib/postgresql/data` (~387M)
- DB `n8n` owner `n8n` · UTF8 · **283 MB** · workflows **50** · credentials **3** · executions **10185**
- Env files (values not recorded): `/root/.n8n-postgres-seqresync-retry-server.env` (`POSTGRES_PASSWORD`) · `/root/.n8n-postgres-seqresync-retry-n8n.env` (`DB_POSTGRESDB_PASSWORD`)
- Historical/evidence volumes (do not delete): `root_n8n_postgres_data`, `root_n8n_postgres_data_retry006`, `root_n8n_postgres_data_seqresync_prod`
- Backup dirs: `/root/n8n-postgres-migration-backups` **26G** + canary/rehearsal/runs

### n8n runtime

- Compose env: `DB_TYPE=postgresdb`, host `postgres:5432`, db/user `n8n`, `N8N_RUNNERS_ENABLED=true`, `N8N_PROTOCOL=http`, `N8N_PORT=5678`, TZ `Europe/Berlin`
- **`N8N_ENCRYPTION_KEY` env: ABSENT**
- Volume `root_n8n_data` (~1.5G, uid 1000 `cpinbox`): `/home/node/.n8n/config` present, keys=`encryptionKey` only, **encryptionKey nonempty string len=32**
- Leftover SQLite `database.sqlite` ~1.4G in the same volume (pre-Postgres artifact; **not** the live DB)
- Task runner process observed inside container (`@n8n/task-runner`)
- **WEBHOOK_URL / N8N_EDITOR_BASE_URL env: ABSENT.** Settings table has no URL/webhook keys. Bind is loopback-only. Operator access remains SSH tunnel (`ssh -N -L 5678:127.0.0.1:5678 ionos-n8n`).
- Bind mounts: `/root/local-files` → `/files` · `/srv/cp-verifier-inbox` → `/files/control-plane-verifier-inbox` · control-plane checkout **ro** → `/files/handoff-runtime/control-plane`
- Boot helper: `/etc/systemd/system/n8n-compose.service` (oneshot `docker compose -f /root/docker-compose.yaml up -d`)

### LiteLLM

- Standalone `docker run` (not in `/root/docker-compose.yaml`)
- Cmd: `--config /etc/litellm/config.yaml --port 4000`
- Config bind (ro): `/root/local-files/handoff-runtime/control-plane/configs/litellm/control-plane-primary-remote.template.yaml`
- Auth bind (ro): `/root/local-files/handoff-runtime/secrets/chatgpt-auth` → `/secrets/chatgpt-auth`
- Env-file (key name only): `/root/local-files/handoff-runtime/secrets/litellm-primary.env` → `ZAI_CODING_API_KEY`
- Container env names also include `CHATGPT_AUTH_FILE`, `CHATGPT_TOKEN_DIR`

### nginx / Tailscale / GOI (non-Docker)

| Component | Bind | Notes |
|---|---|---|
| nginx 1.24.0 | `:80` all + **Tailscale `:443` only** `100.114.7.53:443` | vhost `goi-ors-gateway` → `127.0.0.1:8020`; cert `/etc/goi-ors/tls/fullchain.pem` (LE, CN `ubuntu.tailc01234.ts.net`, until 2026-11-15); `goi-ors-cert-renew.service` currently **failed** |
| GraphHopper 11.0 | Tailscale `:8989` + loopback `:8990` | systemd `goi-graphhopper` · user `graphhopper` · bundled JDK `/opt/goi-graphhopper/jdk/current` · `-Xmx768m` |
| ORS gateway | `127.0.0.1:8020` | `goi-ors-gateway` · secret via systemd `LoadCredential=ORS_API_KEY` |
| GIS app | Tailscale `:8000` | python http.server bound to Tailscale IPv4 |
| Navionics proxy | Tailscale `:5000` | Flask from `Planet-Clone` `.venv` |
| D-Flight helper | Tailscale `:8010` | `LoadCredential` username/password |

Tailscale Serve/Funnel: **none**. GOI TLS terminator depends on Tailscale IPv4 + cert.

### Control Plane helpers (non-Docker)

- Checkout `/root/local-files/handoff-runtime/control-plane` (stale HEAD `fbc0efd` vs this dispatch `4023a615`) plus `cursor-coordinate-converter`, `Planet-Clone`, `dev-method`
- Hermes 0.21.0 under `/home/hermes-test/.hermes` (qualification is a **later** #60 slice; not moved)
- OpenClaw trees under `/opt/openclaw-app` / `/opt/openclaw-node` — **no systemd unit**, not listening
- No root/ubuntu/hermes-test crontabs; GOI cert renew is a systemd timer

---

## 2. NEW baseline (after this pass)

| Item | Value |
|---|---|
| OS / kernel | Ubuntu 24.04.4 LTS · `6.8.0-138-generic` · REBOOT_REQUIRED=NO |
| CPU / RAM / disk | 8 vCPU · 15 GiB · swap **0** · `/` 464G, 7.6G used (images pulled) |
| Public IPv4 | `31.70.139.51` |
| Hostname | still `ubuntu` (**MagicDNS collision if Tailscale-joined as-is**) |
| Docker | `docker.io` 29.1.3 + Compose plugin **v5.5.1** (OLD was v5.5.0; compatible) · **zero containers** |
| Images pulled (not started) | n8n `2.33.3` · postgres `sha256:f1c3376c…` · litellm `v1.98.0@sha256:26eb8aa6…` |
| Node | **v22.23.2** (NodeSource) — Node 18 **not** installed |
| Python | 3.12.3 |
| nginx | 1.24.0 default site only on `:80` (Ubuntu welcome; **not** GOI/n8n; DNS still points at OLD) |
| Tailscale | package 1.102.3 · `tailscaled` running · **BackendState=NeedsLogin** · **Logged out** · no `tailscale up` |
| Users | `cpinbox` 1000:1000 · `hermes-test` 1001:1001 |
| Dirs | `/root/local-files/handoff-runtime` root:root 755 · `/srv/cp-verifier-inbox` 1000:1000 755 · `/home/hermes-test` 1001:1001 750 |
| n8n on NEW | **not running** (loopback :5678 connection refused) |

---

## 3. OLD → NEW mapping

| Component | OLD | NEW this pass | Replica later |
|---|---|---|---|
| OS | 24.04.4 | 24.04.4 | — |
| Docker Engine | 29.1.3 | 29.1.3 | — |
| Compose | v5.5.0 | v5.5.1 | use same `/root/docker-compose.yaml` layout |
| n8n 2.33.3 | live, :5678 loopback | image only | restore volume + env; **do not enable schedules until isolated** |
| PostgreSQL 16.15 | live volume `root_n8n_postgres_data_seqresync_retry_prod` | image only | restore **that named volume** (not empty `n8n_postgres_data`) |
| LiteLLM v1.98.0 | standalone container | image only | recreate `docker run` + config/secret binds; keep unpublished |
| nginx | default `:80` + TS `:443` GOI | default `:80` only | copy GOI vhost **after** Tailscale IPv4 exists |
| Tailscale | logged in, MagicDNS `ubuntu` | logged out | **GATE** (auth + unique hostname) |
| GraphHopper/Java | live systemd | not installed | copy `/opt/goi-graphhopper` + unit; needs Tailscale |
| GOI helpers | live | not installed | copy units + `LoadCredential` files via secret-safe path |
| Host Node | 18 system + nvm 22 | **22 system** | do not install Node 18 |
| Hermes | user+install on OLD | user only | later #60 qualification |
| Control-plane checkout | stale bind-mount | dir placeholder | clone/fetch current `main` then bind-mount |

---

## 4. Data / volumes / config to replicate

**Required for Control Plane stack replica (next micro-task):**

1. `/root/docker-compose.yaml`
2. `/root/.n8n-postgres-seqresync-retry-server.env` and `/root/.n8n-postgres-seqresync-retry-n8n.env` (secret-safe scp; **not git**)
3. Docker volume `root_n8n_postgres_data_seqresync_retry_prod` (live PG) — `docker run` volume clone or `pg_dump`/`pg_restore`
4. Docker volume `root_n8n_data` including `config` (encryption key) — **must not be regenerated**
5. Bind trees: `/root/local-files` (minus needless 26G backup unless operator wants archive), `/srv/cp-verifier-inbox`
6. LiteLLM: config yaml path, `litellm-primary.env`, `chatgpt-auth` dir, recreate container on `root_default` with unpublished `:4000`

**Optional / later (GOI + rollback archive):**

- `/opt/goi-graphhopper`, `/opt/goi-ors-gateway`, `/opt/goi-dflight-helper`, GOI systemd units + drop-ins
- `/etc/nginx/sites-available/goi-ors-gateway`, `/etc/goi-ors/tls/` (cert will need re-issue for new MagicDNS name)
- `/etc/systemd/ors-credentials/ORS_API_KEY`, `/etc/systemd/dflight-credentials/*`
- Historical PG volumes + `/root/n8n-postgres-migration-backups` (26G)
- Hermes tree `/home/hermes-test/.hermes`

**Do not git-commit any of the secret files.**

---

## 5. Secret dependencies (names/paths only)

| Secret | Where on OLD | Notes |
|---|---|---|
| n8n encryption key | `root_n8n_data` file `config` key `encryptionKey` (len 32) | env `N8N_ENCRYPTION_KEY` absent; copy volume/file intact |
| `POSTGRES_PASSWORD` | `/root/.n8n-postgres-seqresync-retry-server.env` | postgres compose `env_file` |
| `DB_POSTGRESDB_PASSWORD` | `/root/.n8n-postgres-seqresync-retry-n8n.env` | n8n compose `env_file` |
| `ZAI_CODING_API_KEY` | `/root/local-files/handoff-runtime/secrets/litellm-primary.env` | LiteLLM env |
| ChatGPT auth material | `/root/local-files/handoff-runtime/secrets/chatgpt-auth/` | bind-mounted into LiteLLM |
| `ORS_API_KEY` | `/etc/systemd/ors-credentials/ORS_API_KEY` via `LoadCredential` | GOI |
| D-Flight username/password | `/etc/systemd/dflight-credentials/` via `LoadCredential` | GOI |
| nginx `privkey.pem` | `/etc/goi-ors/tls/privkey.pem` | Tailscale/LE cert; re-issue on new node name |
| n8n DB `credentials_entity` (3 rows) | PostgreSQL | encrypted **with** the n8n encryption key |
| Tailscale node key / auth | NOT exported | NEW join requires operator `tailscale up` |

---

## 6. Recommended migration order

1. **This pass (done):** inventory + NEW package/runtime baseline. No production processes on NEW.
2. Secret-safe copy of env files + compose (not via git).
3. Volume replica of Postgres live volume **and** `root_n8n_data` (encryption key).
4. Start Postgres + n8n on NEW **loopback-only**, with **all production schedules/webhooks disabled or n8n stopped after restore verify** — dual-fire of WF40/WF90 is the main conflict risk.
5. Recreate LiteLLM unpublished on `root_default` only after n8n restore is verified; same provider keys would share quota with OLD.
6. Refresh control-plane checkout to current `main`, keep bind-mount `:ro`.
7. Operator Tailscale join **after** unique hostname; then GOI nginx/GraphHopper/helpers.
8. Parallel validation (health, workflow count, one inactive-path proof).
9. **Human cutover gate** (DNS / public routes / Tailscale MagicDNS). OLD retained for rollback.

---

## 7. Prerequisites / gates

| Gate | Status | Owner |
|---|---|---|
| SSH both hosts | PASS | done |
| Encryption key handling | GROUNDED (file in `root_n8n_data`, env absent) | replica must copy, not mint |
| Compose provenance | GROUNDED `/root/docker-compose.yaml` project `root` | — |
| Postgres live volume name | GROUNDED `root_n8n_postgres_data_seqresync_retry_prod` | — |
| **Tailscale join on NEW** | **GATE — STOPPED here only** | requires operator auth; NEW hostname `ubuntu` **collides** with OLD MagicDNS `ubuntu.tailc01234.ts.net`; rename NEW before `tailscale up`; do not export OLD node key |
| Dual n8n scheduler | GATE for replica start | disable WF40/WF90 (and any production triggers) on NEW until cutover |
| OLD kernel reboot | pending 6.8.0-139 | **do not reboot OLD** |
| Human DNS/public cutover | CLOSED | #60 |

Tailscale operator action (when the replica task needs the tailnet; **not** this pass):

```text
ssh ionos-n8n-new
```

```text
hostnamectl set-hostname ionos-n8n-new
```

Then `tailscale up` in an interactive session (auth URL / one-time login). Do not paste auth keys into git or chat.

---

## 8. Risks

- Starting production n8n on NEW with copied workflows **double-fires** schedules (WF40, WF90 always-on).
- Starting LiteLLM on NEW with the same provider key **shares/races quota** with OLD.
- Regenerating n8n encryption key **destroys** ability to decrypt the 3 credentials.
- Restoring the wrong Postgres volume (historical `retry006` / `seqresync_prod`) yields stale or failed-cutover data.
- Tailscale join without hostname change **clashes** with live MagicDNS `ubuntu`.
- NEW default nginx `:80` is a distinct IP (no DNS cutover) but is a public welcome page — not Control Plane production.
- OLD swap is exhausted; extra load on OLD during rsync could OOM. Prefer `nice`/`ionice` and do not stop services.
- Stale VPS control-plane checkout (`fbc0efd`) must not be treated as live git authority.

---

## 9. Rollback

- This pass made **no OLD mutations**. Rollback of NEW baseline = leave NEW as-is or `apt` remove unused packages; images/dirs are disposable.
- Future replica rollback: stop NEW stack; OLD remains authoritative until human cutover.
- Do not `docker compose down` on OLD (`n8n-compose.service` ExecStop would stop production).
- Do not delete historical PG volumes or `/root/n8n-postgres-migration-backups` on OLD.

---

## 10. Post-replica checks (for the next task, not this pass)

- OLD still health 200 / PG healthy / same container IDs until an authorized recreate.
- NEW n8n health 200 on **127.0.0.1:5678** only; public DNS still OLD.
- `encryptionKey` presence+length match; credentials still decrypt (UI or API without printing values).
- workflow count 50 / PG `n8n` size in the same order of magnitude.
- No Tailscale Serve/Funnel stolen from OLD; NEW either logged out or a **distinct** MagicDNS name.
- WF40/WF90 **inactive** on NEW until cutover gate.

### This-pass close validations

| Check | Result |
|---|---|
| OLD n8n health | 200 `{"status":"ok"}` |
| OLD container IDs/StartedAt | **identical** to inventory (n8n `4df66089…` 2026-09-05T08:15:02Z; pg `6691aadd…` 2026-09-01T14:32:36Z; llm `edbb0398…` 2026-08-28T14:01:10Z) |
| OLD public IPv4 | still `217.160.71.145` |
| NEW reachable | SSH PASS · Docker/Compose/Node22/nginx/tailscaled |
| NEW production stack | **no containers** · n8n :5678 refused |
| NEW Tailscale | Logged out / NeedsLogin |
| Cutover | **NO** |
| Hard walls | **none crossed** |

---

## 11. NEXT MICRO_TASK

**`V4_NEW_VPS_SECRET_SAFE_LOCALHOST_STACK_REPLICA_V1`** (parent #60)

Scope: secret-safe copy of compose+env+live PG volume+`root_n8n_data`; start Postgres+n8n on NEW bound to `127.0.0.1` only; **keep all production schedules disabled**; do not join Tailscale; do not start GOI/nginx vhost; do not start LiteLLM until a localhost-only smoke is defined; no DNS change.

Not this next task: Hermes 24/7 qualification, GraphHopper copy, human cutover.
