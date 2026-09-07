# V4 GOI cold-start boot persistence on NEW

**TASK_REF:** `V4_VPS_GOI_COLD_START_BOOT_PERSISTENCE_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T08:46:30Z`
**BASE_HEAD:** `5d0c98f46df1e50ee4d935d0a2ab5fc10c69e8e6`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` (OLD untouched)

```text
GOI_COLD_START_PERSISTENCE_QUALIFICATION=PASS
GOI_SYSTEMD_ENABLEMENT=PASS
GOI_COLD_START=PASS
GOI_LISTENER_TOPOLOGY_AFTER_COLD_START=PASS
GOI_FUNCTIONAL_REGRESSION=PASS
GOI_PUBLIC_EXPOSURE=NONE
GOI_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
HOST_REBOOT_EXECUTED=NO
HOST_REBOOT_PROOF=NOT_REQUIRED_STRUCTURAL
ACTIVE_NGINX_TLS_RENEWAL=PENDING_SEPARATE_TASK
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

## Canonical host-reboot requirement

`docs/vps/DECOMMISSION_CHECKLIST.md` requires "restart persistence proven for every required boot service". No canonical doc requires an actual whole-host reboot for component promotion. Decision: **B — enabled boot graph + controlled cold-start proof** is canonical acceptance. No host reboot performed or required.

## Precheck

Git `main` matched expected base. NEW identity exact. Serve/Funnel NONE, AdvertiseRoutes None, ExitNodeID empty. n8n health 200 loopback-only; PostgreSQL healthy; LiteLLM unpublished; Hermes four units active/loopback.

Containers (before = after, RestartCount 0):

| Entity | ID | StartedAt |
|---|---|---|
| `root-n8n-1` | `d20d2ddb…59cc95` | `2026-09-06T22:05:03Z` |
| `litellm-primary` | `db6114de…43eaf` | `2026-09-06T22:09:18Z` |
| `root-postgres-1` | `62aceb82…a688d` | `2026-09-06T22:02:45Z` healthy |

## Pre-task GOI state

All six runtime units `active`/`disabled` + `goi-tailscale-ready` `active (exited)`/`disabled`. Renewal timer `inactive`/`disabled`. Listener topology exactly NEW-private; no `:80`; public negatives `31.70.139.73` ports 80/443/5000/8000/8010/8989 all `connect_ex=111`.

Pre PIDs: GH `185266` · ORS `368923` · nginx `373425` · D-Flight `386202` · GIS `392537` · Nav `400862`.

## Boot graph

`goi-tailscale-ready` (oneshot, RemainAfterExit, `Requires/After=tailscaled.service`, helper waits NEW TS IPv4) → nginx (`Requires/After=goi-tailscale-ready` via `goi-tailscale-ready.conf` drop-in). Other units `Wants=tailscaled/network-online`, no OLD identity dependency in any effective unit/drop-in. ORS keeps `credential.conf` drop-in; Nav keeps non-secret `override.conf`.

## Enablement

`systemctl enable` (no `--now`) for `goi-tailscale-ready`, `goi-graphhopper`, `goi-ors-gateway`, `goi-dflight-helper`, `goi-gis-app`, `goi-nav-proxy`, `nginx`. Seven symlinks created under `multi-user.target.wants` (nginx via systemd-sysv-install). Renewal timer NOT enabled.

## Cold-stop

Reverse order: nginx → GIS → Nav → D-Flight → ORS → GraphHopper → tailscale-ready. All GOI listeners absent (`NO_GOI_LISTENERS`); no unexpected failures outside GOI; Tailscale identity healthy; n8n health 200.

GraphHopper showed `failed/exit-code` purely as SIGTERM stop artifact (`status=143`, clean Jetty shutdown, "Stopped"). `systemctl reset-failed` applied before cold-start; not a startup failure.

## Cold-start (no host reboot)

Dependency order: `goi-tailscale-ready` → GraphHopper → ORS → D-Flight → GIS → Nav → nginx.

| Unit | State | New PID | NRestarts |
|---|---|---|---|
| `goi-tailscale-ready` | active (exited) / enabled | — | 0 |
| `goi-graphhopper` | active running / enabled | `417115` | 0 |
| `goi-ors-gateway` | active running / enabled | `417117` | 0 |
| `nginx` | active running / enabled | `417203` | 0 |
| `goi-dflight-helper` | active running / enabled | `417124` | 0 |
| `goi-gis-app` | active running / enabled | `417155` | 0 |
| `goi-nav-proxy` | active running / enabled | `417184` | 0 |

Journal after start: no fatal/permission/bind/traceback/credential lines. `nginx -t` PASS. Renewal timer still `inactive`/`disabled`.

## Listener topology after cold-start

`100.99.54.93:443` nginx · `:5000` Nav · `:8000` GIS · `:8010` D-Flight · `:8989` GraphHopper · `127.0.0.1:8020` ORS · `127.0.0.1:8990` GH admin. No `:80`; no public/wildcard/IPv6 wildcard on GOI ports; public negatives `111`.

## Functional regression smokes

| Smoke | Result |
|---|---|
| POST `/route` canonical hiking + GIS Origin | 200 · distance `3230.315` · time `2324633` · points `122` · ACAO `*` |
| HTTPS `/ors/status` hostname-verified + GIS Origin | 200 · `ready`/`PRESENT` · ACAO exact GIS origin · `Server: nginx` |
| GET `:8010/status` + GIS Origin | 200 · `READY` · `dataset_available=true` · `feature_count=841` |
| GET `coordinate_converter%20Claude.html` | 200 · SHA256 `60a51d96…36a0f4` = disk/F02 |
| GET `:5000/status` | 200 · `tokens_ok=true` · `last_error=null` |

## Unrelated postcheck

n8n/PostgreSQL/LiteLLM same IDs+StartedAt, health 200. Hermes unchanged loopback. OpenClaw zero units. schema-engine non-network unchanged. Tailscale Serve NONE, routes unchanged.

## F03

Aggregate rollup frozen: `15/14/0/1` with `ROLLUP_COUNTS_STATUS=UNRECONCILED_F03`. Six GOI runtime rows promoted individually per canonical acceptance B; TLS renewal row remains `PRESENT_NOT_VALIDATED` (active-nginx renewal pending).

## Next

Active-nginx TLS renewal qualification (separate task), then parallel OLD↔NEW validation, then human cutover gate.
