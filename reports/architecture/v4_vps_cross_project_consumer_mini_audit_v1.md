# V4 VPS cross-project consumer mini-audit

**TASK_REF:** `V4_VPS_CROSS_PROJECT_CONSUMER_MINI_AUDIT_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T02:34:00Z`
**BASE_HEAD:** `86a99ba42ef4972589a72455729ab84097ad7a17`
**Hosts:** OLD `217.160.71.145` / `100.114.7.53` · NEW `31.70.139.73` / `100.99.54.93`

Read-only. No service/container/Tailscale/nginx mutation. No secret values.

## Identity

| | OLD | NEW |
|---|---|---|
| Public IPv4 | `217.160.71.145` | `31.70.139.73` |
| Tailscale | `ubuntu` `100.114.7.53` `ubuntu.tailc01234.ts.net` | `ionos-n8n-new` `100.99.54.93` `ionos-n8n-new.tailc01234.ts.net` |
| Routes / Serve / Funnel | none / none / none | none / none / none |

## OLD consumers vs registry

| Consumer | OLD runtime | Shared deps | Classification |
|---|---|---|---|
| PostgreSQL `root-postgres-1` | Docker healthy; volume `root_n8n_postgres_data_seqresync_retry_prod` | Docker | REGISTERED_AND_ACCOUNTED |
| n8n `root-n8n-1` | loopback `127.0.0.1:5678` production | Docker, local-files, inbox, compose | REGISTERED_AND_ACCOUNTED |
| LiteLLM `litellm-primary` | unpublished `4000/tcp:null` | Docker, local-files config/auth binds | REGISTERED_AND_ACCOUNTED |
| `n8n-compose.service` | enabled, active (exited after `up -d`) | Docker compose `/root/docker-compose.yaml` | REGISTERED_AND_ACCOUNTED |
| Hermes/browser | processes under `hermes-test` (Xvfb/x11vnc/noVNC/Chromium); **no** hermes systemd units | loopback `9222/5900/6080` | REGISTERED_AND_ACCOUNTED |
| GraphHopper | enabled+active; TS `8989` + admin `8990` | Tailscale | REGISTERED_BUT_PENDING (NEW functional, persistence pending) |
| ORS gateway | enabled+active; loopback `127.0.0.1:8020`; tree `/opt/goi-ors-gateway` | LoadCredential, nginx/TLS | REGISTERED_BUT_PENDING |
| GIS / cursor-coordinate-converter | `goi-gis-app` WD `/root/local-files/handoff-runtime/cursor-coordinate-converter`; TS `:8000` | Tailscale | REGISTERED_BUT_PENDING |
| Nav / Planet-Clone | `goi-nav-proxy` WD `/root/local-files/handoff-runtime/Planet-Clone`; TS `:5000` | Tailscale | REGISTERED_BUT_PENDING |
| D-Flight | `goi-dflight-helper`; TS `:8010`; `/opt/goi-dflight-helper` + `/var/lib/goi-dflight` | Tailscale | REGISTERED_BUT_PENDING |
| nginx / TLS | enabled+active; public `:80` default vhost; TS `:443` `goi-ors-gateway`; cert dir `/etc/goi-ors/tls` | Tailscale | REGISTERED_BUT_PENDING (NEW inactive) |
| TLS renewal timer | `goi-ors-cert-renew.timer` enabled+active; oneshot unit `failed` (OLD-only state) | MagicDNS/TLS | REGISTERED_BUT_PENDING |
| `goi-tailscale-ready` | enabled+active | Tailscale helper | REGISTERED_AND_ACCOUNTED (shared nginx/GOI readiness) |
| schema-engine | tree `/root/local-files/handoff-runtime/schema-engine`; no unit | n8n/CP | REGISTERED_BUT_PENDING |
| dev-method | tree `/root/local-files/handoff-runtime/dev-method`; no unit | none | REGISTERED_AND_ACCOUNTED |
| OpenClaw `/opt/openclaw-app` `/opt/openclaw-node` | trees present; no unit | none | REGISTERED_BUT_PENDING (`KEEP_STAGED_PENDING`) |
| Tailscale node | enabled+active | all TS consumers | REGISTERED_BUT_PENDING (NEW identity PASS, component reachability pending) |
| Docker engine | enabled+active | core compose | REGISTERED_AND_ACCOUNTED |
| Historical PG volumes `root_n8n_postgres_data`, `_retry006`, `_seqresync_prod` | unused leftovers | none | OBSOLETE_CANDIDATE (already registered) |
| `/root/local-files/handoff-runtime/_quarantine` | OLD-only leftover | none | OBSOLETE_CANDIDATE |
| `/srv/cp-verifier-inbox` | n8n bind, owner `cpinbox` | n8n | was implicit; documented this pass |
| `/root/local-files` + control-plane checkout bind | n8n + LiteLLM mounts | Docker/n8n | was implicit; documented this pass |

No enabled application systemd unit, timer, socket, container, or cron workload on OLD was left unattributed. Root crontab empty. `cron.d` only `e2scrub_all` / `sysstat`.

OLD listeners of note are explained by the topology above (plus SSH/resolver/Tailscale/mdns). `0.0.0.0:80` is the nginx default site, already owned as public `80/443` in the shared registry.

## NEW state (unchanged this pass)

| Consumer | present | status | persistence |
|---|---|---|---|
| PostgreSQL / n8n / LiteLLM | yes | running unpublished; n8n loopback | compose enabled |
| Hermes systemd xvfb/chromium/x11vnc/novnc | yes | enabled+active | boot-persistent |
| GraphHopper + tailscale-ready | yes | active, **disabled** | functional PASS, boot pending |
| ORS / GIS / Nav / D-Flight / nginx / cert timer | yes (trees/units) | disabled+inactive | pending activation |
| schema-engine / dev-method / OpenClaw / inbox / local-files / control-plane bind | yes | trees only (OpenClaw inactive) | schema smoke pending |
| Historical extra PG volumes | absent (only live volume + `root_n8n_data`) | n/a | OLD leftovers not copied |

GraphHopper was left running. No start/stop/enable.

## Documentary gaps closed in registries

No runtime/copy/config change. Rows/notes added for proven mounts and exact GIS/Nav/TLS paths so every necessary consumer is explicit.

## Verdict

```text
VPS_CONSUMER_REGISTRY_COVERAGE=PASS
CROSS_PROJECT_CONSUMER_MINI_AUDIT=PASS
OLD_DECOMMISSION_ELIGIBLE=NO
```

No necessary live consumer is missing from the registries after the documentary update. Remaining work is activation/qualification, not unknown ownership.

## Next

Unchanged: remaining GOI private slices → schema-engine smoke → restart-persistence / parallel validation. No remediation in this pass.
