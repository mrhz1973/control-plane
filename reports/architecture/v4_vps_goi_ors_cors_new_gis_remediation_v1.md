# V4 GOI ORS CORS NEW GIS origin remediation

**TASK_REF:** `V4_VPS_GOI_ORS_CORS_NEW_GIS_REMEDIATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T07:33:24Z`
**BASE_HEAD:** `2b723d54ba6f5bec4e1586f70b5493e13f91622d`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
GOI_ORS_CORS_REMEDIATION=PASS
GOI_ORS_GIS_ORIGIN=NEW_IDENTITY
GOI_ORS_FUNCTIONAL_QUALIFICATION=PASS
GOI_ORS_RUNTIME=ACTIVE_NOT_ENABLED
GOI_ORS_BIND=127.0.0.1:8020
GOI_ORS_BOOT_PERSISTENCE=PENDING
GOI_ORS_READY_FOR_NGINX_PRIVATE_CHAIN=YES
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

ORS is not promoted to `MIGRATED_VALIDATED`. nginx / GIS / Nav / D-Flight were not started. GraphHopper PID unchanged.

## GIS origin proof

`goi-gis-app.service` ExecStart:

`python3 -m http.server 8000 --bind "$TS_IP"` with `TS_IP=$(tailscale ip -4)`.

On NEW, `tailscale ip -4` is `100.99.54.93`. Scheme is HTTP (stdlib `http.server`). Port is `8000`. Browser Origin the GIS page will present:

`http://100.99.54.93:8000`

## Effective source

`ExecStart=/usr/bin/python3 /opt/goi-ors-gateway/current/goi_ors_gateway.py`

CORS lives in that Python file as `ORIGIN_ALLOWLIST`. No other `ORIGIN_ALLOWLIST` file under `/opt/goi-ors-gateway`.

| | |
|---|---|
| path | `/opt/goi-ors-gateway/current/goi_ors_gateway.py` |
| pre hash | `f266b8d4882f8f103619f548377ff7c431e1ae130eaab337c1049e263b04091a` |
| post hash | `dd329ce310bea97f4900a065ea91083d7853047173ba53ea2a6f092d07ae3625` |
| owner/group/mode | `goi-ors:goi-ors` `644` (pre and post) |
| backup | `/root/goi_ors_gateway.py.pre-cors-20260907T073323Z` (not in GitHub; metadata-equal to pre-state) |

`py_compile` PASS. Bind constants still `127.0.0.1:8020`. LoadCredential drop-in unchanged: `ORS_API_KEY:/etc/systemd/ors-credentials/ORS_API_KEY`.

## Allowlist enumeration

| Entry | Class | Action |
|---|---|---|
| `http://100.114.7.53:8000` | OLD_GIS_EFFECTIVE_REPLACE | `http://100.99.54.93:8000` |

Count = 1. No KEEP / STALE / AMBIGUOUS. No global OLD-IP replace.

OLD GIS origin before: `http://100.114.7.53:8000`  
NEW GIS origin after: `http://100.99.54.93:8000`

## Restart

`systemctl restart goi-ors-gateway.service` only. Not enabled.

- active / running / disabled
- MainPID `368923` · NRestarts `0` · Result `success`
- journal: `bind=127.0.0.1:8020 secret=PRESENT` · no crash-loop · JOURNAL_SECRET_LEAK=NO
- listener only `127.0.0.1:8020`
- GraphHopper still `185266` on TS `8989` + loopback `8990`
- no `443/5000/8000/8010`

## Status + CORS proof

Source semantics:

- missing Origin: `origin_allowed` returns True (loopback/non-browser)
- present Origin not in allowlist: GET `_forbid_origin` → 403 `origin_forbidden`; OPTIONS → 403
- present Origin in allowlist: GET echoes `Access-Control-Allow-Origin` + `Vary: Origin`; OPTIONS 204 with ACAO + methods

Results:

| Request | HTTP | Result |
|---|---|---|
| GET `/ors/status` no Origin | 200 | `ready` / `PRESENT` |
| GET `/ors/status` Origin NEW GIS | 200 | ACAO `http://100.99.54.93:8000` Vary Origin |
| GET `/ors/status` Origin OLD GIS | 403 | `origin_forbidden`; no ACAO |
| OPTIONS `/ors/status` Origin NEW | 204 | ACAO NEW; methods `GET, POST, OPTIONS` |
| OPTIONS `/ors/status` Origin OLD | 403 | no ACAO |

## Unrelated

nginx / GIS / Nav / D-Flight: disabled / inactive. OLD not contacted.

## Next

ORS is ready for a later nginx/private-chain slice. Do not start nginx in this pass.
