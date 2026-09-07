# V4 GOI ORS loopback functional qualification on NEW

**TASK_REF:** `V4_VPS_GOI_ORS_LOOPBACK_FUNCTIONAL_QUALIFICATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T07:17:15Z`
**BASE_HEAD:** `aba6c0d9daeb685177173603d1d997569c68c51c`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
GOI_ORS_FUNCTIONAL_QUALIFICATION=PASS
GOI_ORS_RUNTIME=ACTIVE_NOT_ENABLED
GOI_ORS_BIND=127.0.0.1:8020
GOI_ORS_BOOT_PERSISTENCE=PENDING
NGINX_RUNTIME=INACTIVE
GIS_RUNTIME=INACTIVE
NAV_RUNTIME=INACTIVE
DFLIGHT_RUNTIME=INACTIVE
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

ORS is not promoted to `MIGRATED_VALIDATED`. nginx / GIS / Nav / D-Flight were not started. GraphHopper left `disabled`/`active` (PID unchanged).

## Precheck

- Git `main` local and `origin/main` matched expected base.
- NEW public/Tailscale identity matched exactly.
- F01 nginx include PASS and F02 GIS HTML retarget PASS remained in force.
- nginx, `goi-gis-app`, `goi-nav-proxy`, `goi-dflight-helper` were `disabled`/`inactive`.
- GraphHopper was `disabled`/`active` on `100.99.54.93:8989` and `127.0.0.1:8990`.
- `goi-ors-gateway` was `disabled`/`inactive` before start.

### Effective unit

| Field | Value |
|---|---|
| Fragment | `/etc/systemd/system/goi-ors-gateway.service` |
| Drop-in | `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf` |
| User / Group | `goi-ors` / `goi-ors` |
| WorkingDirectory | `/opt/goi-ors-gateway/current` |
| ExecStart | `/usr/bin/python3 /opt/goi-ors-gateway/current/goi_ors_gateway.py` |
| Environment | none |
| LoadCredential | `ORS_API_KEY:/etc/systemd/ors-credentials/ORS_API_KEY` |
| After | `network-online.target` |

Credential file metadata only: exists, size 120, nonempty, `root:root` mode `0600`. Value not read or printed.

### Intended bind

Runtime constants in `goi_ors_gateway.py` and `config.example.toml`:

`LISTEN_HOST = "127.0.0.1"` · `LISTEN_PORT = 8020`

No intended bind to Tailscale IP, public IP, `0.0.0.0`, or OLD identity. Source still lists CORS `ORIGIN_ALLOWLIST` with OLD GIS origin; that is not the listen address and was not changed in this task.

## Canonical smoke provenance

Chosen smoke: `GET http://127.0.0.1:8020/ors/status`

Origin (not invented):

- gateway `do_GET` only serves `/ors/status`
- nginx vhost `location = /ors/status` → `proxy_pass http://127.0.0.1:8020`
- GIS constants `ROUTING_ORS_STATUS_PATH = "/ors/status"`
- infra README + deploy contract: status `ready` and `secret=PRESENT` when LoadCredential is installed
- INFRA1 credential-wiring evidence used on-box `/ors/status` as the live check

No canonical live directions request file exists on NEW (`/opt/goi-ors-gateway` has no smoke JSON). Unit-test coordinate pairs in `tests/test_gateway.py` are sanitizer fixtures with no network. `deploy_vps.py` explicitly skips ORS upstream requests. A live `POST /ors/v2/directions/.../geojson` was **not** invented.

## Activation (no boot persistence)

`systemctl start goi-ors-gateway.service` only. Not enabled. No daemon-reload. No other unit start.

- ActiveState `active` / SubState `running` / UnitFileState `disabled`
- MainPID `359203` · NRestarts `0` · Result `success`
- Journal: `Started ... gateway (loopback)` then `start version=0.1.0 bind=127.0.0.1:8020 secret=PRESENT` · no credential-load failure, bind failure, traceback, or crash-loop
- Journal secret-leak scan: NO

## Listeners

- ORS: `127.0.0.1:8020` (python3)
- GraphHopper unchanged: `[::ffff:100.99.54.93]:8989` and `[::ffff:127.0.0.1]:8990` (same PID `185266`)
- No ORS on `100.99.54.93:8020` / `31.70.139.73:8020` / `0.0.0.0:8020` (connect rc=111)
- No listener on `443`, `5000`, `8000`, `8010`

## Smoke result

`GET /ors/status` HTTP `200` JSON keys `profiles,secret,secret_name,service,status,upstream_host,version`.

`status=ready` · `secret=PRESENT` · `version=0.1.0`

No secret value in the JSON.

## Unrelated runtime

| Unit | After |
|---|---|
| nginx | disabled / inactive |
| goi-gis-app | disabled / inactive |
| goi-nav-proxy | disabled / inactive |
| goi-dflight-helper | disabled / inactive |
| goi-graphhopper | disabled / active (unchanged PID) |
| goi-ors-gateway | disabled / active |

OLD was not contacted or modified.

## Next

Leave ORS `active`/`disabled` for a later nginx/private-chain slice. Do not start nginx here. Restart persistence remains pending.
