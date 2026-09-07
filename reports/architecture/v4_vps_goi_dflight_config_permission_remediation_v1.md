# V4 GOI D-Flight config permission remediation on NEW

**TASK_REF:** `V4_VPS_GOI_DFLIGHT_CONFIG_PERMISSION_REMEDIATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T07:54:31Z`
**BASE_HEAD:** `1851763f23c11645596b6425172c3eaf33ff18c3`
**Host:** NEW `31.70.139.73` / Tailscale `100.99.54.93`

```text
GOI_DFLIGHT_PERMISSION_REMEDIATION=PASS
DFLIGHT_CONFIG_ACCESS=GOI_DFLIGHT_USER_READABLE
DFLIGHT_CSRF_ACCESS=GOI_DFLIGHT_USER_READABLE
DFLIGHT_RUNTIME=INACTIVE_DISABLED
DFLIGHT_FUNCTIONAL_QUALIFICATION=PENDING_RETRY
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

D-Flight was not started. GIS/Nav were not started. No file content, credential, state, or unit mutation.

## OLD permission model (read-only)

OLD `217.160.71.145` inspected via `stat`/`namei` only. `getfacl` not available; no ACL indicated. Unit `User=goi-dflight` `Group=goi-dflight`.

| Path | Mode | Owner:Group |
|---|---|---|
| `/etc/goi-dflight` | `0750` | `root:goi-dflight` |
| `/etc/goi-dflight/config.toml` | `0640` | `root:goi-dflight` |
| `/etc/goi-dflight/csrf-public.pem` | `0640` | `root:goi-dflight` |

Access mechanism: POSIX group DAC (directory group-execute/read, files group-read). Root remains owner. Not world-readable. No ACL.

OLD was not written, chmod'd, or restarted.

## NEW pre metadata

| Path | Mode | Owner:Group |
|---|---|---|
| `/etc/goi-dflight` | `0750` | `root:root` |
| `/etc/goi-dflight/config.toml` | `0640` | `root:root` |
| `/etc/goi-dflight/csrf-public.pem` | `0640` | `root:goi-dflight` |

Pre hashes: config `59c0d53acb08768d6a93dcc6bff387442cab47d02293f8228a83b7444e2155f7` · pem `ebb6c391688cf190edde373912706a022339e84c3a74be2e17fabae4663ad61a`

PEM already matched OLD metadata → **not mutated**.

Local snapshot (not in GitHub): `/root/goi-dflight-perm-pre-20260907T075431Z.txt`

## Mutation (NEW only)

- `chown root:goi-dflight /etc/goi-dflight` (mode stayed `0750`)
- `chown root:goi-dflight /etc/goi-dflight/config.toml` (mode stayed `0640`)

## Post

Same metadata as OLD for dir + config. PEM unchanged. Hashes identical to pre. `User=goi-dflight`: `test -x`/`test -r` PASS on dir, config, pem; one-byte open without printing content PASS.

Runtime: D-Flight inactive/disabled; no `:8010`; GraphHopper `185266` / ORS `368923` / nginx `373425` unchanged; GIS/Nav inactive.

## Next

Retry `V4_VPS_GOI_DFLIGHT_PRIVATE_FUNCTIONAL_QUALIFICATION_V1` in a separate task. Do not start D-Flight here.
