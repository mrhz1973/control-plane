# VPS GOI NEW final parity verification — 2026-09-07

Scope: NEW VPS `31.70.139.73`, read-only operator evidence immediately before bounded NEW-only parity copy/config render. No GOI/nginx service was started or enabled; OLD was not changed.

## Result

```text
GOI_NEW_FINAL_PARITY_VERIFY=PASS_WITH_ACTIONABLE_DELTA
DFLIGHT_CREDENTIAL_PARITY=PASS
CSRF_PEM_CONTENT_PARITY=NOT_PROVEN_OLD_HASH_NOT_CAPTURED
CSRF_PEM_OWNERSHIP_PARITY=FAIL_NEW_ROOT_ROOT
TARGET_PARENT_DIRS_MISSING=4
GRAPHHOPPER_ACTIVE_NEW_SOURCES_STILL_OLD_IP_GATED=YES
GOI_NEW_LISTENERS=NONE
GOI_NEW_SERVICES=DISABLED_INACTIVE
```

## D-Flight credentials

NEW live metadata/hash evidence matches the previously captured OLD live hashes exactly for:
- `/etc/systemd/dflight-credentials/dflight_username`
- `/etc/systemd/dflight-credentials/dflight_password`

Therefore these credential files are already parity-equivalent on NEW and do **not** need to be recopied.

No credential value was printed or stored in GitHub/chat evidence.

## CSRF PEM

NEW:
- path `/etc/goi-dflight/csrf-public.pem`
- mode `640`
- owner `root:root`
- size `451`

OLD prior metadata:
- mode `640`
- owner `root:goi-dflight`
- size `451`

The OLD hash was not captured in the read-only parity probe, so exact content parity remains unproven. Safe migration action is to copy the exact OLD file secret-safe/non-content-visible to NEW and install it as `root:goi-dflight` mode `640`.

## Target parent directories

Missing on NEW and therefore must be created before parity copy:
- `/etc/systemd/ors-credentials`
- `/etc/systemd/system/goi-ors-gateway.service.d`
- `/etc/systemd/system/goi-nav-proxy.service.d`
- `/etc/systemd/system/nginx.service.d`

Already present:
- `/etc/systemd/dflight-credentials` mode `700` root:root
- `/var/lib` mode `755` root:root

## GraphHopper active NEW sources

Identity-generic template is healthy:
- `config-server-B-linux-mmap.yml.template` uses `__TAILSCALE_IPV4__`

But active NEW scripts remain fail-closed to OLD IP `100.114.7.53`:
- `/opt/goi-graphhopper/bin/render-config.sh`
- `/opt/goi-graphhopper/bin/preflight.sh`

Both require bounded NEW-specific replacement to `100.99.54.93` before render/preflight can succeed.

## Safety state

All remain disabled/inactive:
- goi-graphhopper
- goi-ors-gateway
- goi-dflight-helper
- goi-gis-app
- goi-nav-proxy
- goi-tailscale-ready
- nginx

No listeners exist on `443,5000,8000,8010,8020,8989,8990`.

## Operator authorization

The operator explicitly authorized copying passwords/secrets required for migration. This authorization permits direct OLD→NEW secret transfer, but does not relax the standing evidence rule: **secret values must never be printed into chat or committed to GitHub**. Transfers must remain direct/secret-safe.

## Bounded NEW-only delta now authorized

1. Directly transfer from OLD to NEW without displaying content:
   - ORS API key
   - ORS credential drop-in
   - nginx Tailscale-readiness drop-in
   - Nav proxy override
   - D-Flight LKG/state directory
   - OLD CSRF PEM for exact parity/ownership
2. Do not recopy D-Flight username/password because hashes already match.
3. Reconstruct NEW-specific identity in:
   - D-Flight bind/origin
   - `goi-wait-tailscale-ip`
   - nginx GOI vhost
   - GraphHopper render/preflight IP guard
   - TLS renewal helper domain
4. Keep all GOI/nginx services disabled/inactive during the delta.
5. Validate hashes/permissions/systemd/rendered config before activation.

OLD remains LIVE; cutover remains not authorized; OLD decommission eligibility remains NO.
