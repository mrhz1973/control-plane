# V4 GOI F02 GIS endpoint remediation

**TASK_REF:** `V4_VPS_GOI_F02_GIS_ENDPOINT_REMEDIATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T07:07:04Z`
**BASE_HEAD:** `c06babcf3625f337f16dca3a1ee0c8a14fb6639a`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93` / MagicDNS `ionos-n8n-new.tailc01234.ts.net`

```text
F02_GIS_ENDPOINT_REMEDIATION=PASS
F02_GIS_ENDPOINTS=NEW_IDENTITY_RETARGETED
F02_GRAPHHOPPER_DESTINATION=http://100.99.54.93:8989
F02_ORS_DESTINATION=https://ionos-n8n-new.tailc01234.ts.net
F02_DFLIGHT_DESTINATION=http://100.99.54.93:8010
F01_F02_CONFIGURATION_GAPS=CLOSED
REMAINING_GOI_ACTIVATION_CLEARANCE=READY_FOR_NEXT_BOUNDED_SLICE
RUNTIME_SERVICE_STARTS=0
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

GIS/ORS/D-Flight/nginx were not started. GraphHopper left `disabled`/`active`. GIS not promoted to `MIGRATED_VALIDATED`.

## Precheck

- Git `main` matched expected base.
- NEW identity exact.
- `goi-gis-app` WD `/root/local-files/handoff-runtime/cursor-coordinate-converter`; ExecStart `python3 -m http.server 8000 --bind "$TS_IP"`.
- Target file `coordinate_converter Claude.html`; owner/group/mode `root:root` `644`.
- Pre hash `a2829e32267bc025aaada01b6aed2865dc80bfb586a591d017a03ce0ee3d226c`.

## Enumeration (no blind replace)

| Line | Literal | Classification | Action |
|---|---|---|---|
| 84867 | `ROUTING_GRAPHHOPPER_ENDPOINT = "http://100.114.7.53:8989"` | ACTIVE_EFFECTIVE GH | retarget `http://100.99.54.93:8989` |
| 90154 | `ROUTING_ORS_GATEWAY_BASE = "https://ubuntu.tailc01234.ts.net"` | ACTIVE_EFFECTIVE ORS | retarget `https://ionos-n8n-new.tailc01234.ts.net` |
| 42502, 42579 | `_dflightHelperBaseUrlOverride = "http://100.114.7.53:8010"` | ACTIVE_EFFECTIVE D-Flight (self-tests using live helper URL) | retarget `http://100.99.54.93:8010` |
| 91404, 91941 | `ROUTING_GRAPHHOPPER_ENDPOINT.indexOf("100.114.7.53")` | ACTIVE_EFFECTIVE self-test of GH constant | retarget needle `100.99.54.93` |
| 84868 | `ROUTING_GRAPHHOPPER_ENDPOINT_LOCAL = "http://127.0.0.1:8989"` | local option | **unchanged** |

OLD string counts before: `100.114.7.53`=5, `ubuntu.tailc01234.ts.net`=1. All six classified. No STOP.

## Backup

`/root/coordinate_converter_Claude.html.pre-f02-20260907T070603Z`  
metadata `root:root` `644`, hash equal to pre-state. Not in GitHub.

## After

- Post hash `60a51d9620d2f71787357f6460da20ca5aee48c37550400f23061275f366a0f4`
- owner/group/mode still `root:root` `644`
- OLD IP/MagicDNS count **0**
- ORS paths `/ors/status` and `/ors/v2/directions` unchanged
- no `217.160.71.145`, `31.70.139.73`, or `0.0.0.0` introduced
- GIS/ORS/Nav/D-Flight/nginx inactive; no new listeners `443/5000/8000/8010/8020`
- GraphHopper still `disabled`/`active` on `8989`/`8990`

## Next

Next bounded GOI activation slice (ORS/GIS/Nav/D-Flight/nginx runtime) is now configuration-cleared for F01/F02. Do not start those services in this pass.
