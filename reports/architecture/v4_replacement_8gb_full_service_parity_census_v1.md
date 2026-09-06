# V4 replacement 8GB — full service parity census

**TASK_REF:** `V4_REPLACEMENT_8GB_FULL_SERVICE_PARITY_CENSUS_V1`  
**Issues:** #68 (primary) · #67 (parent migration) · #60 campaign  
**Classification:** `PASS` (census only — no migration)  
**Timestamp (UTC):** `2026-09-06T23:41:00Z`  
**BASE_HEAD:** `bc288f64a033418d748cefb430beb287b080c38b`  
**Hosts:** OLD `ionos-n8n` `217.160.71.145` · NEW `ionos-n8n-new` `31.70.139.73`  
**Mode:** READ-ONLY both hosts · **zero** copy/restart/enable/Tailscale/DNS/nginx/workflow/reboot  

No secret values recorded (names/paths only).

---

## Identity proof

| field | OLD | NEW |
|---|---|---|
| public IPv4 | `217.160.71.145` | `31.70.139.73` |
| hostname | `ubuntu.tailc01234.ts.net` | `ubuntu` |
| Tailscale IPv4 | `100.114.7.53` | none (`NeedsLogin`) |
| REBOOT_REQUIRED flag | YES (not executed) | YES (not executed) |

---

## Verdict

| field | value |
|---|---|
| **OLD_DECOMMISSION_ELIGIBLE** | **NO** |
| reason | ≥1 `MISSING` + ≥1 `PRESENT_NOT_VALIDATED` + unresolved `OBSOLETE_NEEDS_HUMAN_DECISION` |

---

## Counts

| metric | count |
|---|---|
| Components censused | **34** |
| `MIGRATED_VALIDATED` | **9** |
| `PRESENT_NOT_VALIDATED` | **5** |
| `MISSING` | **17** |
| `OBSOLETE_NEEDS_HUMAN_DECISION` | **3** |

---

## Parity matrix

| COMPONENT | PROJECT/OWNER | OLD_STATE | OLD_PATHS | OLD_PORTS | OLD_BOOT_PERSISTENCE | NEW_STATE | PARITY_STATUS |
|---|---|---|---|---|---|---|---|
| Docker engine + Compose | infra | Docker running · Compose present | `/usr/bin/docker` | n/a | `docker.service` enabled | Docker 29.8 / Compose v5.5.1 enabled | MIGRATED_VALIDATED |
| `root-postgres-1` PostgreSQL 16.15 | n8n/CP | healthy · unpublished | volume `root_n8n_postgres_data_seqresync_retry_prod` · compose `/root/docker-compose.yaml` | `5432/tcp` null | via `n8n-compose.service` + restart=always | healthy · unpublished · same image digest | MIGRATED_VALIDATED |
| `root-n8n-1` n8n 2.33.3 | n8n/CP | running · loopback · **LIVE production** (capable>0) | binds `/root/local-files`, `/srv/cp-verifier-inbox`, volume `root_n8n_data` | `127.0.0.1:5678` | `n8n-compose.service` enabled + restart=always | running · loopback · **isolated** (capable=0) · health 200 | MIGRATED_VALIDATED |
| `litellm-primary` v1.98.0 | CP LiteLLM | running · unpublished | config template + `secrets/chatgpt-auth` | `4000/tcp` null | restart=unless-stopped (manual container) | running · unpublished · same digest | MIGRATED_VALIDATED |
| `n8n-compose.service` | n8n boot | enabled+active · `docker compose -f /root/docker-compose.yaml up -d` | `/etc/systemd/system/n8n-compose.service` · WD `/root` | n/a | WantedBy=multi-user | compose file present · **unit absent** | MISSING |
| Hermes Agent v0.21.0 | hermes-test | installed · git · local `3ac671db` | `~/.hermes/hermes-agent` · `~/.local/bin/hermes` | n/a | no systemd unit (CLI) | installed · same pin · runnable | MIGRATED_VALIDATED |
| Hermes browser stack (Xvfb/CDP/x11vnc/noVNC) | hermes-test | running **manual** processes · sandbox 4755 | profile `~/.hermes/chatgpt-chrome-profile` · Playwright chromium-1234 | `127.0.0.1:9222/5900/6080` | **no** systemd (not boot-persistent) | systemd `hermes-{xvfb,chromium,x11vnc,novnc}` enabled+active · fresh profile · non-auth validated | MIGRATED_VALIDATED |
| `chrome-devel-sandbox` | hermes | present root:root `4755` | `/usr/local/sbin/chrome-devel-sandbox` | n/a | file | present `4755` | MIGRATED_VALIDATED |
| Hermes ChatGPT **authenticated** session | hermes-test | authenticated profile in use on OLD | OLD profile (not inventoried for cookies) | via CDP | manual | fresh empty profile · **no login** | PRESENT_NOT_VALIDATED |
| Tailscale join + MagicDNS identity | infra/GOI | Logged in · `ubuntu.tailc01234.ts.net` · IP `100.114.7.53` | `tailscaled` enabled | TS ports + serve none | `tailscaled.service` enabled | package present · **NeedsLogin** · hostname `ubuntu` | MISSING |
| nginx (engine + default site) | infra | active+enabled · listen `:80` all | `/etc/nginx` · site `default` | `0.0.0.0:80` | `nginx.service` enabled | **unit not found / no sites-enabled** | MISSING |
| nginx `goi-ors-gateway` | GOI | enabled site · TLS on TS IP | `/etc/nginx/sites-enabled/goi-ors-gateway` · cert `/etc/goi-ors/tls/fullchain.pem` | `100.114.7.53:443` → `127.0.0.1:8020` | with nginx | absent | MISSING |
| GOI TLS material | GOI | CN=`ubuntu.tailc01234.ts.net` · LE · notAfter `2026-11-15` | `/etc/goi-ors/tls/{fullchain,privkey}.pem` | n/a | renew timer | absent | MISSING |
| `goi-ors-cert-renew.timer/.service` | GOI | timer enabled+active · **service last state failed** | `/usr/local/sbin/goi-ors-renew-cert` | n/a | weekly timer | absent | MISSING |
| `goi-graphhopper.service` | GOI | enabled+active · Java GH 11.0 · `-Xmx768m` | `/opt/goi-graphhopper` (~2.8G) · JDK `/opt/goi-graphhopper/jdk/current` · caches nord-ovest-B (~755M+741M) | TS `8989` · loopback `8990` | enabled · After=tailscaled | absent · no java · no `/opt/goi-graphhopper` | MISSING |
| `goi-ors-gateway.service` | GOI | enabled+active · user `goi-ors` | `/opt/goi-ors-gateway/current` | `127.0.0.1:8020` | enabled | absent | MISSING |
| `goi-dflight-helper.service` | GOI | enabled+active · user `goi-dflight` | `/opt/goi-dflight-helper/current` · config `/etc/goi-dflight/config.toml` · LoadCredential `dflight_username`,`dflight_password` | (helper; no public host port in census) | enabled | absent · users/credentials absent | MISSING |
| `goi-gis-app.service` | GOI / cursor-coordinate-converter | enabled+active · `python3 -m http.server 8000` bind TS IP | WD `/root/local-files/handoff-runtime/cursor-coordinate-converter` | `100.114.7.53:8000` | enabled · requires Tailscale IP | absent | MISSING |
| `goi-nav-proxy.service` | GOI / Planet-Clone | enabled+active · flask `:5000` on TS IP | WD `/root/local-files/handoff-runtime/Planet-Clone` · `.venv` | `100.114.7.53:5000` | enabled · requires Tailscale IP | absent | MISSING |
| `goi-tailscale-ready.service` | GOI | enabled+active | `/usr/local/sbin/goi-wait-tailscale-ip` | n/a | enabled | absent | MISSING |
| OS users `graphhopper`,`goi-dflight`,`goi-ors` | GOI | present (uids 997/995/994) | homes as configured | n/a | n/a | **absent** (only `cpinbox`/`hermes-test`) | MISSING |
| handoff `control-plane` checkout | CP | present · HEAD `fbc0efd` · ~18M | `/root/local-files/handoff-runtime/control-plane` | n/a | bind-mounted into n8n | present · HEAD `477c376` (stale vs `bc288f6`) · ~14M | PRESENT_NOT_VALIDATED |
| handoff `cursor-coordinate-converter` | GOI GIS | present · HEAD `f215011` · ~198M | `/root/local-files/handoff-runtime/cursor-coordinate-converter` | via gis-app | used by `goi-gis-app` | **MISSING** | MISSING |
| handoff `Planet-Clone` | GOI Nav | present · HEAD `0fa1941` · ~25M | `/root/local-files/handoff-runtime/Planet-Clone` | via nav-proxy | used by `goi-nav-proxy` | **MISSING** | MISSING |
| handoff `dev-method` | CP tooling | present · HEAD `bef41cc` · ~544K | `/root/local-files/handoff-runtime/dev-method` | n/a | tree only | **MISSING** | MISSING |
| handoff `schema-engine` | CP tooling | present | `/root/local-files/handoff-runtime/schema-engine` | n/a | tree only | **MISSING** | MISSING |
| `/srv/cp-verifier-inbox` | CP verifier | present · mounted into n8n | `/srv/cp-verifier-inbox` | n/a | dir + compose bind | dir present · owner `cpinbox` · empty (~4K) | PRESENT_NOT_VALIDATED |
| LiteLLM secret deps | CP | `secrets/chatgpt-auth` · env file(s) | `/root/local-files/handoff-runtime/secrets/` | n/a | container binds | present (names only) · replica-scoped | PRESENT_NOT_VALIDATED |
| n8n/Postgres env files | n8n | present mode 600 | `/root/.env` · `.n8n-postgres-seqresync-retry-*.env` | n/a | compose env_file | present on NEW | PRESENT_NOT_VALIDATED |
| `/opt/openclaw-app` + `/opt/openclaw-node` | OpenClaw | trees present · Node v24.19.0 · **no systemd unit / no listener** | `/opt/openclaw-*` | none observed | none | absent | OBSOLETE_NEEDS_HUMAN_DECISION |
| OLD historical Docker volumes | n8n ops | extra volumes present | `root_n8n_postgres_data`, `_retry006`, `_seqresync_prod` | n/a | leftover | only active prod volume names | OBSOLETE_NEEDS_HUMAN_DECISION |
| OLD Hermes browser **manual** supervision | hermes | running without systemd | processes under hermes-test | 9222/5900/6080 | **not** boot-persistent | N/A (NEW uses systemd) | OBSOLETE_NEEDS_HUMAN_DECISION |
| Tailscale Serve/Funnel | infra | **No serve config** | n/a | n/a | n/a | No serve config | MIGRATED_VALIDATED |
| SSH daemon | infra | listen `:22` | sshd | `0.0.0.0:22` | enabled | same | MIGRATED_VALIDATED |

---

## MISSING ordered by migration dependency

1. **Tailscale join + unique MagicDNS hostname** (blocks all TS-bound GOI listeners and TLS CN)  
2. **OS users** `graphhopper`, `goi-dflight`, `goi-ors` (+ credential store layout)  
3. **`/opt/goi-graphhopper`** tree + JDK + graph-cache (~2.8G) + `goi-graphhopper.service`  
4. **`/opt/goi-ors-gateway`** + `goi-ors-gateway.service` (loopback `:8020`)  
5. **nginx engine + `goi-ors-gateway` site** + `/etc/goi-ors/tls` + renew timer/script  
6. **`goi-tailscale-ready.service`** helper  
7. **handoff `cursor-coordinate-converter`** (~198M) + `goi-gis-app.service`  
8. **handoff `Planet-Clone`** + venv + `goi-nav-proxy.service`  
9. **`/opt/goi-dflight-helper`** + `/etc/goi-dflight/config.toml` + LoadCredential `dflight_username`/`dflight_password` + service  
10. **`n8n-compose.service`** boot unit on NEW (compose file already present)  
11. **handoff `dev-method`**, **`schema-engine`** (tooling completeness)  
12. **Hermes ChatGPT human login** on NEW fresh profile (auth qualification — not copy OLD cookies)

---

## Secret dependency names/paths only

| dependency | path / name | OLD | NEW |
|---|---|---|---|
| n8n encryption / compose env | `/root/.env`, `/root/.n8n-postgres-seqresync-retry-*.env` | yes | yes |
| LiteLLM runtime env | `/root/local-files/handoff-runtime/secrets/litellm.runtime.env` (keys: `ZAI_CODING_API_KEY`, `CHATGPT_TOKEN_DIR`, `CHATGPT_AUTH_FILE`) | yes | yes |
| LiteLLM ChatGPT auth dir | `/root/local-files/handoff-runtime/secrets/chatgpt-auth/` (`auth.json`) | yes | yes |
| Hermes agent env | `/home/hermes-test/.hermes/.env` | yes | yes (unconfigured providers this campaign) |
| Hermes config | `/home/hermes-test/.hermes/config.yaml` | yes | yes (`cdp_url` only proven) |
| VNC passwd file | `/home/hermes-test/.hermes/vnc/passwd` | yes | yes (fresh local) |
| D-Flight credentials | systemd LoadCredential names `dflight_username`, `dflight_password` · store under `/etc/systemd/dflight-credentials/` | yes | **no** |
| GOI TLS private key | `/etc/goi-ors/tls/privkey.pem` | yes | **no** |
| Chromium profile auth state | `~/.hermes/chatgpt-chrome-profile` (OLD authenticated; NEW fresh) | yes | fresh only |

---

## Collisions OLD ↔ NEW

| collision | detail |
|---|---|
| MagicDNS hostname | both default hostnames are `ubuntu` → **must rename NEW before Tailscale join** |
| n8n always-on / WF40 | cannot publish NEW workflows while OLD LIVE (dual-fire) |
| Tailscale Serve/routes | none currently; still cannot bind same advertised names/ports on two nodes without design |
| GOI nginx CN | cert CN is OLD MagicDNS name; NEW needs new cert after hostname decision |
| Public `:80` | OLD serves nginx; NEW must not steal public DNS until cutover |

---

## Cannot start in parallel (keep OLD LIVE)

- Published n8n workflows / WF40 / WF90 / always-on dispatcher  
- Tailscale identity sharing same MagicDNS name  
- nginx `goi-ors-gateway` on production DNS/TS name  
- Any GOI client traffic cutover endpoints  
- Authenticated Hermes ChatGPT session assumed unique (do not dual-login without policy)

## Can copy/prepare without cutover

- GraphHopper install + graph-cache + unit files (**do not enable** until Tailscale ready)  
- ORS gateway / D-Flight helper trees + unit files (**disabled**)  
- handoff git trees: `cursor-coordinate-converter`, `Planet-Clone`, `dev-method`, `schema-engine`  
- nginx site files as **disabled** drafts  
- `n8n-compose.service` unit install (NEW already has compose; enabling is OK if it only ensures current isolated stack)  
- OpenClaw trees **if** human marks them in-scope  
- Refresh NEW `control-plane` checkout to current `main` (still read-only mount)

---

## Tailscale / nginx / cert prerequisites

1. Decide **unique** NEW Tailscale hostname (cannot keep `ubuntu`).  
2. `tailscale up` / join on NEW (explicit later pass).  
3. Install nginx; add `goi-ors-gateway` site bound to **NEW** TS IP (not OLD `100.114.7.53`).  
4. Issue/renew TLS for NEW MagicDNS CN (`tailscale cert` / existing renew script adapted).  
5. Repair/verify `goi-ors-cert-renew` (OLD service currently **failed**).  
6. Only then enable GOI units that `ExecStartPre` wait for Tailscale IPv4.

---

## DECOMMISSION_BLOCKERS

1. All **MISSING** rows above still absent on NEW.  
2. NEW core is **isolated** (execution-capable=0) — not production-published.  
3. Hermes NEW lacks ChatGPT auth qualification.  
4. Tailscale/nginx/GOI stack entirely missing on NEW.  
5. handoff GIS/Nav repos missing on NEW.  
6. Unresolved OpenClaw / historical volume / OLD manual Hermes supervision decisions.  
7. Hostname MagicDNS collision unresolved.  
8. No cutover / parallel validation window completed.

---

## Listener snapshot (non-secret)

**OLD:** `:22`, nginx `:80`, TS `100.114.7.53:{443,5000,8000,8010}`, GraphHopper TS `8989` + loopback `8990`, n8n `127.0.0.1:5678`, Hermes `127.0.0.1:{9222,5900,6080}`, ORS `127.0.0.1:8020`.  

**NEW:** `:22`, n8n `127.0.0.1:5678`, Hermes `127.0.0.1:{9222,5900,6080}` only (plus resolver). PG/LiteLLM unpublished.

---

## Next

Use this matrix as the definitive migrate-next backlog (#68). Immediate prep candidates = “Can copy/prepare without cutover”. Cutover remains GATE.
