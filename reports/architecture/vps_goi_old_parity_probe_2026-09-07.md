# VPS GOI OLD parity probe — 2026-09-07

Scope: OLD VPS `217.160.71.145` only. Live read-only operator evidence gathered after NEW Tailscale join and NEW GOI read-only reconciliation. No OLD mutation, restart, shutdown, credential-content disclosure, DNS/public routing change, or cutover occurred.

## OLD identity / live service proof

```text
HOSTNAME=ubuntu
TAILSCALE_IPV4=100.114.7.53
OLD_MAGICDNS=ubuntu.tailc01234.ts.net
```

OLD GOI remains live and enabled/active:
- `goi-graphhopper.service`
- `goi-ors-gateway.service`
- `goi-dflight-helper.service`
- `goi-gis-app.service`
- `goi-nav-proxy.service`
- `goi-tailscale-ready.service`
- `nginx.service`

Live OLD listeners confirmed:
- `100.114.7.53:443` nginx
- `100.114.7.53:5000` Nav proxy
- `100.114.7.53:8000` GIS
- `100.114.7.53:8010` D-Flight
- `100.114.7.53:8989` GraphHopper application
- `127.0.0.1:8020` ORS gateway
- `127.0.0.1:8990` GraphHopper admin

This is the rollback/live production source and remains untouched.

## NEW-absent paths: OLD parity result

Every one of the five paths previously confirmed absent on NEW is present on OLD live:

| Path | OLD live state | Initial classification |
|---|---|---|
| `/etc/systemd/ors-credentials/ORS_API_KEY` | present, mode `600`, root:root, size 120 | `COPY_REQUIRED_SECRET_SAFE` |
| `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf` | present, mode `644`, root:root; active ORS drop-in | `COPY_REQUIRED` |
| `/etc/systemd/system/goi-nav-proxy.service.d/override.conf` | present, mode `644`, root:root; active Nav drop-in | `INSPECT_NONSECRET_THEN_COPY_OR_RECONSTRUCT` |
| `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf` | present, mode `644`, root:root; active nginx drop-in | `COPY_REQUIRED` (depends on NEW-specific readiness helper) |
| `/var/lib/goi-dflight` | present with current/previous LKG + metadata/state | `COPY_REQUIRED_STATE_SAFE` |

Therefore these absences are real parity gaps, not obsolete-by-default artifacts.

## ORS credential continuity

OLD:
- `/etc/systemd/ors-credentials/ORS_API_KEY`: present, mode `600`, root:root, size 120; SHA-256 recorded in operator evidence without printing value.
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`: present and active as a systemd drop-in.
- drop-in uses `LoadCredential=ORS_API_KEY:/etc/systemd/ors-credentials/ORS_API_KEY`.

NEW activation of ORS remains blocked until both are restored secret-safely and metadata/hash parity is verified. No secret value belongs in GitHub/chat.

## D-Flight credential and state continuity

OLD D-Flight credentials are present:
- `/etc/systemd/dflight-credentials/dflight_username`, mode `600`, root:root, size 9
- `/etc/systemd/dflight-credentials/dflight_password`, mode `600`, root:root, size 13

Hashes were captured in operator evidence but no credential contents were printed.

Prep-copy reported these credential files copied to NEW, but the live NEW reconciliation did not yet explicitly verify their current metadata/hashes. Therefore classification is:

`D_FLIGHT_CREDENTIALS=VERIFY_NEW_PARITY_BEFORE_COPY`

OLD persistent D-Flight state exists and is migration-relevant:
- `/var/lib/goi-dflight/current.json` — 7,335,344 bytes, owner `goi-dflight:goi-dflight`, mode `644`
- `/var/lib/goi-dflight/current.meta.json` — 436 bytes, owner `goi-dflight:goi-dflight`, mode `600`
- `/var/lib/goi-dflight/previous.json` — 7,144,867 bytes, owner `goi-dflight:goi-dflight`, mode `644`
- `/var/lib/goi-dflight/previous.meta.json` — 436 bytes, owner `goi-dflight:goi-dflight`, mode `600`
- `/var/lib/goi-dflight/state.json` — 121 bytes, owner `goi-dflight:goi-dflight`, mode `600`

NEW lacks `/var/lib/goi-dflight`, so this is `COPY_REQUIRED_STATE_SAFE` before D-Flight qualification.

## CSRF public PEM ownership mismatch

OLD:
- `/etc/goi-dflight/csrf-public.pem` mode `640`, owner `root:goi-dflight`, size 451

NEW previous live probe:
- same path mode `640`, owner `root:root`, size 451

This is a material parity mismatch because `goi-dflight-helper.service` runs as `goi-dflight`. Content hash still requires explicit NEW↔OLD comparison, but ownership must ultimately be corrected on NEW to a service-readable group if content parity is confirmed.

Classification:
`DFLIGHT_CSRF_PEM=VERIFY_HASH_THEN_FIX_NEW_OWNERSHIP`

## OLD identity references to render away on NEW

OLD live configuration confirms the semantics already seen stale on NEW staged copies:

- D-Flight bind: `100.114.7.53:8010`
- D-Flight origin allowlist: `http://100.114.7.53:8000`
- readiness helper `WANT=100.114.7.53`
- nginx GOI: `listen 100.114.7.53:443 ssl`
- nginx `server_name ubuntu.tailc01234.ts.net`
- GraphHopper generated runtime: application `8989` bound to `100.114.7.53`, admin `8990` bound to `127.0.0.1`

NEW target identity is:
- Tailscale IPv4 `100.99.54.93`
- MagicDNS `ionos-n8n-new.tailc01234.ts.net`

These are `RECONSTRUCT_NEW_SPECIFIC`, not byte-for-byte copy targets.

## Runtime/drop-in structure

OLD live systemd confirms:
- ORS credential drop-in is loaded.
- Nav proxy override is loaded; its exact non-secret content was not emitted by the safe grep and needs one bounded read-only inspection before deciding whether to copy verbatim or reconstruct NEW-specific.
- nginx readiness drop-in is loaded and contains `Requires=goi-tailscale-ready.service` + `After=goi-tailscale-ready.service`.
- D-Flight unit uses `LoadCredential=` for the two credential paths.

## Classification summary

```text
GOI_OLD_PARITY_PROBE=PASS
OLD_CHANGED=NO

COPY_REQUIRED_SECRET_SAFE=
- /etc/systemd/ors-credentials/ORS_API_KEY

COPY_REQUIRED=
- /etc/systemd/system/goi-ors-gateway.service.d/credential.conf
- /etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf

COPY_REQUIRED_STATE_SAFE=
- /var/lib/goi-dflight

VERIFY_NEW_PARITY_BEFORE_COPY=
- /etc/systemd/dflight-credentials/dflight_username
- /etc/systemd/dflight-credentials/dflight_password

VERIFY_HASH_THEN_FIX_NEW_OWNERSHIP=
- /etc/goi-dflight/csrf-public.pem

INSPECT_NONSECRET_THEN_COPY_OR_RECONSTRUCT=
- /etc/systemd/system/goi-nav-proxy.service.d/override.conf

RECONSTRUCT_NEW_SPECIFIC=
- D-Flight bind/origin
- goi-wait-tailscale-ip expected IP
- nginx listen/server_name/TLS identity
- GraphHopper generated runtime bind
- any client endpoint references to OLD IP/MagicDNS
```

## Safety state

```text
NEW_GOI_ACTIVATION_SAFE=NO
NEW_TLS_ISSUANCE_READY=NOT_YET
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
```

## Required next

1. Bounded read-only inspection of the OLD Nav proxy override content (non-secret) and helper/render semantics needed for NEW-specific reconstruction.
2. On NEW, metadata/hash verification for D-Flight credentials and CSRF PEM; confirm relevant target parent directories and current files without printing secret values.
3. Then perform a bounded NEW-only parity copy/config render. Keep all GOI/nginx units disabled/inactive during the mutation.
4. Validate config syntax and file ownership/permissions before any service activation.
5. NEW MagicDNS TLS issuance and controlled component qualification follow later.
