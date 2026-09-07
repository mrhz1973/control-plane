# V4 GOI D-Flight private functional qualification retry on NEW

**TASK_REF:** `V4_VPS_GOI_DFLIGHT_PRIVATE_FUNCTIONAL_QUALIFICATION_RETRY1_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T07:59:38Z`
**BASE_HEAD:** `a10bebda3d19e057228c33473ac4aba470cd51f9`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93`

```text
GOI_DFLIGHT_FUNCTIONAL_QUALIFICATION=PASS
DFLIGHT_RUNTIME=ACTIVE_NOT_ENABLED
DFLIGHT_BIND=100.99.54.93:8010
DFLIGHT_PUBLIC_EXPOSURE=NONE
DFLIGHT_STATUS_SMOKE=PASS
DFLIGHT_LKG_READ=PASS
DFLIGHT_GIS_NEW_ORIGIN=PASS
DFLIGHT_BOOT_PERSISTENCE=PENDING
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

D-Flight is not promoted to `MIGRATED_VALIDATED`. GIS/Nav were not started. GraphHopper/ORS/nginx PIDs unchanged. Historical STOP report left intact.

## Permission regression check

As `goi-dflight`: traverse `/etc/goi-dflight` PASS; read `config.toml` PASS; read `csrf-public.pem` PASS. No content printed.

## Effective unit / config

| Field | Value |
|---|---|
| User/Group | `goi-dflight` / `goi-dflight` |
| WorkingDirectory | `/opt/goi-dflight-helper/current` |
| ExecStart | `/usr/bin/python3 .../goi_dflight_helper.py` |
| Environment | `GOI_DFLIGHT_CONFIG` → `/etc/goi-dflight/config.toml` |
| LoadCredential | `dflight_username` / `dflight_password` under `/etc/systemd/dflight-credentials/` (nonempty `600` `root:root`; values not read) |
| Bind | `host=100.99.54.93` `port=8010` |
| Origin allowlist | `http://100.99.54.93:8000` |

LKG metadata: `current.json` 7335344 bytes `goi-dflight:goi-dflight` `644`; `feature_count=841`.

## Start

`systemctl start goi-dflight-helper.service` only. Not enabled.

- active / running / disabled · MainPID `386202` · NRestarts `0` · Result `success`
- Journal: `event=server_start host=100.99.54.93 port=8010` · JOURNAL_FLAGS=NONE · JOURNAL_SECRET_LEAK=NO

## Listeners / public

- D-Flight: `100.99.54.93:8010` (python3 `386202`)
- no `31.70.139.73:8010` / `0.0.0.0:8010` / `[::]:8010` / OLD TS
- `connect_ex(31.70.139.73,8010)=111`
- no new `5000`/`8000`

## Smoke provenance (source)

`GET /status` and `GET /dataset` in `do_GET`; `POST /refresh` mutating — not used.

| Check | Result |
|---|---|
| GET `/status` no Origin | 200 · `service=goi-dflight-helper` · `status=READY` · `dataset_available=true` · `feature_count=841` · `helper_version=0.1.3` |
| GET `/status` Origin NEW | 200 · ACAO `http://100.99.54.93:8000` |
| GET `/status` Origin OLD | 403 `origin_forbidden` · no ACAO |
| GET `/dataset` | 200 · `application/json` · 7646502 bytes · prefix FeatureCollection · sha256 `ccb56b35…6c4dfe` (HTTP body; body not persisted) |

## Unrelated

GraphHopper `185266` / ORS `368923` / nginx `373425` unchanged. GIS/Nav inactive. n8n `127.0.0.1:5678` 200. Serve NONE.

## Next

GIS functional qualification in a separate task. Do not start GIS here.
