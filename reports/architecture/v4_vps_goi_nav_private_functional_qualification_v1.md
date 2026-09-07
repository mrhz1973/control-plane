# V4 GOI Nav private functional qualification on NEW

**TASK_REF:** `V4_VPS_GOI_NAV_PRIVATE_FUNCTIONAL_QUALIFICATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T08:21:50Z`
**BASE_HEAD:** `10ba8b499ff7096be508cb6b22751996b742e781`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
GOI_NAV_FUNCTIONAL_QUALIFICATION=PASS
NAV_RUNTIME=ACTIVE_NOT_ENABLED
NAV_BIND=100.99.54.93:5000
NAV_PUBLIC_EXPOSURE=NONE
NAV_APPLICATION_SMOKE=PASS
NAV_FUNCTIONAL_PROXY_SMOKE=NOT_AVAILABLE_CANONICALLY
NAV_BOOT_PERSISTENCE=PENDING
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

Nav is not promoted to `MIGRATED_VALIDATED`. Schema-engine was not started. Other GOI PIDs unchanged. No source/unit/override mutation.

## Precheck

- Git `main`; local HEAD and `origin/main` matched expected base.
- NEW public `31.70.139.73` and Tailscale `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net` exact.
- Serve NONE, Funnel NONE, AdvertiseRoutes None, ExitNodeID empty.
- GraphHopper/ORS/nginx/D-Flight/GIS `active`/`disabled`. Nav `inactive`/`disabled`. No `:5000` before start.

## Effective Nav unit

| Field | Value |
|---|---|
| FragmentPath | `/etc/systemd/system/goi-nav-proxy.service` |
| DropInPaths | `/etc/systemd/system/goi-nav-proxy.service.d/override.conf` |
| User/Group | unset (root) |
| WorkingDirectory | `/root/local-files/handoff-runtime/Planet-Clone` |
| ExecStart | `.venv/bin/flask --app proxy run --host "$TS_IP" --port 5000` with `TS_IP=$(tailscale ip -4)` |
| Environment (override) | `GSAT_STATIC_VERSION=1012` `BING_STATIC_VERSION=15568` |
| After/Wants | `tailscaled.service` `network-online.target` |
| UnitFileState | disabled |

Override is non-secret (`0644` `root:root` 85 bytes). No OLD/NEW identity literals.

Effective `tailscale ip -4` = `100.99.54.93`. Bind is `--host "$TS_IP" --port 5000`. Not public, wildcard, or OLD. Flask `if __name__` `app.run(port=5000)` is unused under systemd CLI.

## Planet-Clone tree

- Path `/root/local-files/handoff-runtime/Planet-Clone`
- Git `main` HEAD `0fa194106b153e77bd22fb0be2ae3cd98cd202c3`
- Entrypoint `proxy.py`; Flask app importable (`HAS_APP`)
- `.venv/bin/flask` and `.venv/bin/python` → system Python 3.12.3
- No package install or tree mutation

## Smoke provenance

Documented in `proxy.py` header and `@app.route("/status")`. Flask url_map has `/status` plus tile templates. No `/` HTML landing. README tile URLs use `{z}/{x}/{y}` only; no canonical concrete tile request in tree. Tile/gsat/bsat fetches not invented.

`GET /status` is read-only application status. It may refresh Garmin tokens and discover gsat/bsat versions as implemented. Token values not persisted.

`NAV_FUNCTIONAL_PROXY_SMOKE=NOT_AVAILABLE_CANONICALLY`

## Start

`systemctl start goi-nav-proxy.service` only. Not enabled.

- active / running / disabled · MainPID `400862` · NRestarts `0` · Result `success`
- Journal: Flask serving `http://100.99.54.93:5000`. No import/permission/bind/traceback. Werkzeug dev-server warning only (not fatal). JOURNAL_SECRET_LEAK=NO

## Listeners / public

- Nav: `100.99.54.93:5000` (flask `400862`)
- no `31.70.139.73:5000` / `0.0.0.0:5000` / `[::]:5000` / OLD TS `:5000`
- `connect_ex(31.70.139.73,5000)=111`

## Application smoke

`GET /` → HTTP 404 (not classified as application PASS).

`GET http://100.99.54.93:5000/status` → `200` `application/json`:

- `tokens_ok=true`
- `last_error=null`
- `charts` keys: seachart, sonarchart, gsat, bsat, strava_run, hillshade (template paths only)
- gsat/bsat `static_fallback_configured=true`, `last_error=null`
- token material not recorded

## Unrelated

GraphHopper PID `185266` · ORS `368923` · nginx `373425` · D-Flight `386202` · GIS `392537` unchanged.
n8n `127.0.0.1:5678` health 200. Tailscale Serve NONE.

## Next

All GOI component functional runtime slices are closed. Boot/restart persistence remains pending. Next separately: schema-engine functional qualification. Do not begin schema-engine here.
