# V4 GOI GIS private functional qualification on NEW

**TASK_REF:** `V4_VPS_GOI_GIS_PRIVATE_FUNCTIONAL_QUALIFICATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T08:08:41Z`
**BASE_HEAD:** `48a036c1d1944a0a93b2c7b60b1bc7cee85abdf2`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
GOI_GIS_FUNCTIONAL_QUALIFICATION=PASS
GIS_RUNTIME=ACTIVE_NOT_ENABLED
GIS_BIND=100.99.54.93:8000
GIS_PUBLIC_EXPOSURE=NONE
GIS_SERVED_ARTIFACT_MATCH=PASS
GIS_NEW_ENDPOINTS=PASS
GIS_BROWSER_ORS_CHAIN=PASS
GIS_BROWSER_DFLIGHT_CHAIN=PASS
GIS_BROWSER_GRAPHHOPPER_CHAIN=PASS
GIS_BOOT_PERSISTENCE=PENDING
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

GIS is not promoted to `MIGRATED_VALIDATED`. Nav was not started. GraphHopper/ORS/nginx/D-Flight PIDs unchanged. No config/HTML/CORS remediation.

## Precheck

- Git `main`; local HEAD and `origin/main` matched expected base.
- NEW public `31.70.139.73` and Tailscale `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net` exact.
- Serve NONE, Funnel NONE, AdvertiseRoutes None, ExitNodeID empty.
- GraphHopper/ORS/nginx/D-Flight `active`/`disabled`. GIS/Nav `inactive`/`disabled`. No `:8000` before start.

## Effective GIS unit

| Field | Value |
|---|---|
| FragmentPath | `/etc/systemd/system/goi-gis-app.service` |
| Drop-ins | none |
| User/Group | unset (root) |
| WorkingDirectory | `/root/local-files/handoff-runtime/cursor-coordinate-converter` |
| ExecStart | `python3 -m http.server 8000 --bind "$TS_IP"` with `TS_IP=$(tailscale ip -4)` |
| Environment | empty |
| After/Wants | `tailscaled.service` `network-online.target` |

Effective `tailscale ip -4` = `100.99.54.93`. Bind cannot resolve to public/wildcard/OLD.

## Served artifact

File: `coordinate_converter Claude.html`  
`root:root` `644` size `10870746`  
SHA256 `60a51d9620d2f71787357f6460da20ca5aee48c37550400f23061275f366a0f4` (matches F02).

Bounded endpoint constants:

| Line | Constant |
|---|---|
| 84867 | `ROUTING_GRAPHHOPPER_ENDPOINT = "http://100.99.54.93:8989"` |
| 90154 | `ROUTING_ORS_GATEWAY_BASE = "https://ionos-n8n-new.tailc01234.ts.net"` |
| 42502 / 42579 | `_dflightHelperBaseUrlOverride = "http://100.99.54.93:8010"` |

Counts: NEW GH 1, NEW ORS 1, NEW D-Flight 2.  
`100.114.7.53` / `ubuntu.tailc01234.ts.net` / `217.160.71.145` / `31.70.139.73` / `0.0.0.0` = 0. HTML body not persisted.

GIS GraphHopper fetches use `credentials: "omit"` (lines 39049, 41966, 50748). `withCredentials` = 0.

## GraphHopper CORS provenance

Effective config `/run/goi-graphhopper/config.yml` has no CORS allowlist; app bind `100.99.54.93:8989`. Runtime class `com.graphhopper.http.CORSFilter` emits `Access-Control-Allow-Origin: *` plus Methods/Headers including `Content-Type`. Browser-valid for credential-omit XHR. Canonical hiking request sha256 `ebf9d5599ed4148ea9048e4c7d8622398bf26bdf9ae7098e53e0812d80b1c8b9`.

## Start

`systemctl start goi-gis-app.service` only. Not enabled. No other start/restart.

- active / running / disabled · MainPID `392537` · NRestarts `0` · Result `success`
- Journal: Starting/Started only. JOURNAL_FLAGS=NONE

## Listeners / public

- GIS: `100.99.54.93:8000` (python3 `392537`)
- no `31.70.139.73:8000` / `0.0.0.0:8000` / `[::]:8000` / OLD TS `:8000`
- `connect_ex(31.70.139.73,8000)=111`

## HTTP application smoke

`GET /` is directory listing (`200`, 896 bytes) — **not** classified as the app.

Canonical path: `http://100.99.54.93:8000/coordinate_converter%20Claude.html` → `200` `text/html` 10870746 bytes, SHA256 equal to disk. Body contains the three NEW constants and no OLD identities.

## Browser-backend (Origin `http://100.99.54.93:8000`)

| Backend | Result |
|---|---|
| HTTPS `ionos-n8n-new.tailc01234.ts.net/ors/status` via `100.99.54.93:443`, TLS hostname verify (no `-k`) | 200 · `status=ready` `secret=PRESENT` · ACAO exact NEW origin · `Vary: Origin` · `Server: nginx` |
| GET `http://100.99.54.93:8010/status` | 200 · `READY` · `dataset_available=true` · `feature_count=841` · ACAO exact NEW origin |
| OPTIONS + POST `/route` canonical hiking | OPTIONS 200 ACAO `*` · POST 200 · `distance=3230.315` `time=2324633` `points_len=122` · ACAO `*` |

## Unrelated

GraphHopper PID `185266` · ORS `368923` · nginx `373425` · D-Flight `386202` unchanged.  
Nav inactive/disabled. n8n `127.0.0.1:5678` health 200; public `:5678` connect 111. Tailscale Serve NONE.

## Next

Nav private functional qualification in a separate task. Do not start Nav here. GIS boot persistence pending.
