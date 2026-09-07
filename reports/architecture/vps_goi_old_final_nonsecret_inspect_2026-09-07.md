# VPS GOI OLD final non-secret inspect — 2026-09-07

Scope: OLD VPS `217.160.71.145` only. Read-only operator evidence. No service mutation, no secret value printed.

## Nav proxy override

`/etc/systemd/system/goi-nav-proxy.service.d/override.conf` exists on OLD, mode `0644`, owner `root:root`, size `85` bytes.

Identity grep result: `NO_OLD_OR_NEW_IDENTITY_REFERENCE`.

Classification: `COPY_REQUIRED_NON_IDENTITY` pending exact content transfer/inspection only; it does not encode OLD or NEW Tailscale/MagicDNS identity.

## TLS renewal helper semantics

`/usr/local/sbin/goi-ors-renew-cert` contains:

```text
DOMAIN="$(hostname -f)"
/usr/bin/tailscale cert --cert-file "$TMP/cert.pem" --key-file "$TMP/key.pem" "$DOMAIN"
install -o root -g root -m 0644 "$TMP/cert.pem" /etc/goi-ors/tls/fullchain.pem
install -o root -g root -m 0600 "$TMP/key.pem" /etc/goi-ors/tls/privkey.pem
```

Material implication for NEW: NEW OS hostname remains `ubuntu`, while NEW Tailscale/MagicDNS identity is `ionos-n8n-new.tailc01234.ts.net`. Therefore the OLD helper must **not** be executed unchanged on NEW. It must be rendered/configured to target the exact NEW MagicDNS identity explicitly, or the OS hostname strategy must be separately changed under Control Plane ownership. Current decision: `RECONSTRUCT_NEW_SPECIFIC`; no OS-hostname change authorized.

## GraphHopper render / preflight semantics

Current template correctly uses `__TAILSCALE_IPV4__` for application bind and `127.0.0.1` for admin bind, but active helper scripts are fail-closed to OLD Tailscale IPv4:

- `/opt/goi-graphhopper/bin/render-config.sh` requires `TS_IP == 100.114.7.53`.
- `/opt/goi-graphhopper/bin/preflight.sh` requires `TS_IP == 100.114.7.53`.

OLD staging/history also contains many OLD-IP references, but those are historical artifacts and are not the active NEW render source.

Classification for NEW:

```text
GRAPHHOPPER_TEMPLATE=NEW_COMPATIBLE_DYNAMIC_PLACEHOLDER
GRAPHHOPPER_RENDER_SCRIPT=RECONSTRUCT_NEW_SPECIFIC_100.99.54.93
GRAPHHOPPER_PREFLIGHT=RECONSTRUCT_NEW_SPECIFIC_100.99.54.93
GRAPHHOPPER_HISTORY=NO_MIGRATION_ACTION_REQUIRED
```

## Safety result

```text
OLD_FINAL_NONSECRET_INSPECT=PASS_WITH_ACTIONABLE_DELTA
OLD_CHANGED=NO
NAV_OVERRIDE_IDENTITY_DEPENDENT=NO
TLS_RENEW_HELPER_NEW_SAFE_UNCHANGED=NO
GRAPHHOPPER_RENDER_NEW_SAFE_UNCHANGED=NO
GRAPHHOPPER_PREFLIGHT_NEW_SAFE_UNCHANGED=NO
```

## Next

Return to NEW and complete final read-only parity verification for D-Flight credential hashes, CSRF PEM hash/ownership, target parent directories, GraphHopper active NEW sources, and service inactive-state safety. After that, prepare one bounded NEW-only parity/config delta while all GOI/nginx units remain disabled/inactive.
