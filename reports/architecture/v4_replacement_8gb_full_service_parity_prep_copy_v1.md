# V4 replacement 8GB — full service parity prep-copy

**TASK_REF:** `V4_REPLACEMENT_8GB_FULL_SERVICE_PARITY_PREP_COPY_V1`  
**Issues:** #68 primary · #67 Hermes evidence reconciliation · #60 campaign  
**Classification:** `PASS`  
**Timestamp (UTC):** `2026-09-07T00:28:30Z`  
**BASE_HEAD:** `adb32612f1c0bbe2a1192ba29ce8f226167f88c9`  
**Hosts:** OLD `217.160.71.145` LIVE · NEW `31.70.139.73`  
**Cutover / Tailscale join / DNS:** **NOT performed**  
**OLD_DECOMMISSION_ELIGIBLE:** **NO**

No secret values recorded.

---

## Summary

Non-destructive OLD→NEW prep-copy completed for all census items that can land without Tailscale/DNS/cutover. GOI/nginx units installed **disabled/inactive**. Core replica + Hermes loopback stack preserved. Manifest hashes for all copied trees match OLD.

| metric | before (#68 census) | after this pass |
|---|---|---|
| `MISSING` | 17 | **1** (Tailscale join + unique MagicDNS / live GOI activation prerequisite) |
| `PRESENT_NOT_VALIDATED` | 5 | **14** (copied/staged, not production-activated) |
| `MIGRATED_VALIDATED` | 9 | **14** |
| `OBSOLETE_NEEDS_HUMAN_DECISION` | 3 | **1** (historical Docker volumes on OLD only) |

---

## Delta matrix

| COMPONENT | BEFORE_STATUS | AFTER_STATUS | SOURCE_PATH | TARGET_PATH | VALIDATION | STARTED_ON_NEW | CUTOVER_REQUIRED |
|---|---|---|---|---|---|---|---|
| Users `graphhopper`/`goi-dflight`/`goi-ors` | MISSING | MIGRATED_VALIDATED | OLD uids remapped | NEW uids 970/971/972 (name-based) | accounts nologin present | NO | NO |
| GraphHopper tree+JDK+cache | MISSING | PRESENT_NOT_VALIDATED | `/opt/goi-graphhopper` | same | du+files+manifest `90ed3d27…` match · 559 files · ~2.96GiB | NO | YES (TS) |
| `goi-graphhopper.service` | MISSING | PRESENT_NOT_VALIDATED | `/etc/systemd/system/…` | same | installed disabled/inactive | NO | YES |
| ORS gateway tree | MISSING | PRESENT_NOT_VALIDATED | `/opt/goi-ors-gateway` | same | manifest `b459ef47…` match | NO | YES |
| `goi-ors-gateway.service` | MISSING | PRESENT_NOT_VALIDATED | unit | unit | disabled/inactive | NO | YES |
| D-Flight helper | MISSING | PRESENT_NOT_VALIDATED | `/opt/goi-dflight-helper` | same | manifest `3e6ee0ed…` match | NO | YES |
| D-Flight config | MISSING | PRESENT_NOT_VALIDATED | `/etc/goi-dflight/config.toml` | same | sha256 `6d28f325…` match · mode 640 | NO | YES |
| D-Flight credentials | MISSING | PRESENT_NOT_VALIDATED | `/etc/systemd/dflight-credentials/` | same | names `dflight_username/password` · mode 600 · manifest `8483dc4c…` match · **values never printed** | NO | YES |
| `goi-dflight-helper.service` | MISSING | PRESENT_NOT_VALIDATED | unit | unit | disabled/inactive | NO | YES |
| `goi-tailscale-ready` + sbin | MISSING | PRESENT_NOT_VALIDATED | unit + `/usr/local/sbin/goi-wait-tailscale-ip` | same | disabled/inactive | NO | YES |
| cursor-coordinate-converter | MISSING | PRESENT_NOT_VALIDATED | handoff tree | same | HEAD `f215011` · manifest `bc28d2d1…` | NO | YES |
| `goi-gis-app.service` | MISSING | PRESENT_NOT_VALIDATED | unit | unit | disabled (needs TS IP) | NO | YES |
| Planet-Clone | MISSING | PRESENT_NOT_VALIDATED | handoff tree | same | HEAD `0fa1941` · manifest `7be130c5…` | NO | YES |
| `goi-nav-proxy.service` | MISSING | PRESENT_NOT_VALIDATED | unit | unit | disabled (needs TS IP) | NO | YES |
| `dev-method` | MISSING | PRESENT_NOT_VALIDATED | handoff tree | same | HEAD `bef41cc` · manifest match | NO | NO |
| `schema-engine` | MISSING | PRESENT_NOT_VALIDATED | handoff tree | same | manifest `75a65eea…` match (no `.git`) | NO | NO |
| OpenClaw app+node | OBSOLETE | PRESENT_NOT_VALIDATED | `/opt/openclaw-*` | same | manifests match · **no unit/start** | NO | HUMAN |
| nginx engine | MISSING | PRESENT_NOT_VALIDATED | apt | installed | **disabled/inactive** · sites-enabled empty · no :80/:443 | NO | YES |
| nginx `goi-ors-gateway` vhost | MISSING | PRESENT_NOT_VALIDATED | sites-available | staged only | **not** in sites-enabled | NO | YES |
| GOI TLS material | MISSING | PRESENT_NOT_VALIDATED | `/etc/goi-ors/tls` | archive path same | fullchain/privkey sha256 match · OLD CN only · not active NEW cert | NO | YES (re-issue) |
| cert renew service/timer | MISSING | PRESENT_NOT_VALIDATED | unit+`/usr/local/sbin/goi-ors-renew-cert` | same | disabled/inactive · **not executed** | NO | YES |
| `n8n-compose.service` | MISSING | MIGRATED_VALIDATED | OLD unit | NEW safer unit | enabled+active · ExecStart compose up · ExecStop=`stop` (not `down`) | YES (oneshot) | NO |
| control-plane checkout | PRESENT_NOT_VALIDATED | MIGRATED_VALIDATED | git | `/root/local-files/handoff-runtime/control-plane` | exact `adb3261…` · clean | NO | NO |
| `/srv/cp-verifier-inbox` | PRESENT_NOT_VALIDATED | MIGRATED_VALIDATED | dir | dir | empty · owner cpinbox · manifest match | NO | NO |
| n8n/Postgres env files | PRESENT_NOT_VALIDATED | MIGRATED_VALIDATED | `/root/.env` + seqresync envs | same | sha256 match all three | NO | NO |
| LiteLLM chatgpt-auth | PRESENT_NOT_VALIDATED | MIGRATED_VALIDATED | `secrets/chatgpt-auth/auth.json` | same | sha256 `26048942…` match | NO | NO |
| LiteLLM runtime env file | PRESENT_NOT_VALIDATED | PRESENT_NOT_VALIDATED | OLD has `litellm-primary.env`; NEW `litellm.runtime.env` | NEW path | replica-proven runtime; filename differs from OLD live | YES (llm) | NO |
| Hermes ChatGPT auth/session | PRESENT_NOT_VALIDATED (census stale) | MIGRATED_VALIDATED | #67 comments evidence | NEW profile | `HERMES_WEB_ROUNDTRIP`/`CHATGPT_WEB_AUTH_SESSION`/`AUTH_PERSISTENCE`/`LONG_CHAT_RECALL`/`RESOURCE_BASELINE=GREEN` | YES (existing) | NO |
| Tailscale join + unique hostname | MISSING | **MISSING** | n/a | NeedsLogin | still Logged out | NO | YES |
| Historical OLD docker volumes | OBSOLETE | OBSOLETE | OLD-only leftovers | n/a | not copied | NO | HUMAN |
| OLD manual Hermes supervision | OBSOLETE | resolved on NEW | n/a | systemd hermes-* | NEW uses systemd (already) | YES | NO |

---

## Hermes frontier reconciliation (#67)

Read-only from issue #67 comments (no re-login/re-test):

| flag | evidence |
|---|---|
| `HERMES_WEB_ROUNDTRIP_NEW8GB=PASS` | comment 5562958145 |
| `CHATGPT_WEB_AUTH_SESSION=PASS` | same |
| `AUTH_PERSISTENCE=PASS` | comment 5562991857 |
| `RESOURCE_BASELINE=GREEN` | comment 5563006658 |
| `LONG_CHAT_RECALL_NEW8GB=PASS` | comment 5563075741 |

Census/frontier stale claim of “no ChatGPT login yet” is superseded by this evidence.

---

## Disk / resources

| | before | after |
|---|---|---|
| root used | 17G (8%) | **21G (9%)** |
| available | 215G | 211G |
| Mem available | ~4.5Gi | ~4.6Gi |
| OOM | none | none |

---

## NEW listeners (final)

`22` public · resolver · `127.0.0.1:5678` · `127.0.0.1:9222/5900/6080` only.  
Public probes `:80/:443/:8989/:8020/:5000/:8000/:8010` refused.  
Tailscale: Logged out / NeedsLogin.

---

## Core + OLD close

| check | result |
|---|---|
| NEW n8n health | 200 |
| NEW execution_capable / published | **0 / 0** |
| NEW max execution id | **311171** (unchanged) |
| NEW PostgreSQL | healthy |
| NEW LiteLLM | running unpublished |
| Hermes systemd | all active |
| OLD n8n/pg/llm IDs+StartedAt | **unchanged** vs precheck |
| OLD GOI services | remain active (untouched) |

---

## Residual DECOMMISSION_BLOCKERS

1. Tailscale join with **unique** hostname (cannot keep `ubuntu`)  
2. NEW MagicDNS TLS issuance (OLD cert CN invalid for NEW)  
3. Enable + qualify GOI stack (GraphHopper/ORS/D-Flight/GIS/Nav/nginx) on NEW TS IP  
4. Parallel validation window  
5. Human cutover gate  
6. OpenClaw activate-or-archive human decision  
7. n8n production publish on NEW (explicit later)

---

## NEXT

Tailscale unique hostname/join → NEW MagicDNS/TLS → GOI activation qualification (still no DNS/public cutover until human gate).
