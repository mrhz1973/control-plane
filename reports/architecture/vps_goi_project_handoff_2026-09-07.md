# GOI PROJECT VPS HANDOFF — 2026-09-07

Status: `INGESTED_BY_CONTROL_PLANE`

Scope: GOI components only. This handoff is based on canonical repository material and the OLD VPS snapshot documented in `docs/INFRA_VPS.md` (2026-08-21), plus the already-proven NEW prep-copy state. No direct live SSH verification of OLD/NEW was performed by the specialist pass; live-only unknowns remain explicit.

## PROJECT_VPS_HANDOFF

```text
PROJECT=GOI
COMPONENT=GraphHopper,ORS-gateway,GIS/cursor-coordinate-converter,Navionics/Planet-Clone,D-Flight,goi-tailscale-ready,nginx-GOI,ORS-TLS-renewal
AS_IS_COMPLETE=NO

OLD_STATE=LIVE production topology reconstructed from canonical snapshot
NEW_STATE=PREP isolated replica; major payloads staged; GOI units/nginx/cert renewal inactive
MIGRATION_STATUS=PRESENT_NOT_VALIDATED
OLD_CHANGED=NO
NEW_VALIDATED=NO
RESTART_PERSISTENCE=NOT_TESTED

TAILSCALE_DEPENDENT=YES
NGINX_DEPENDENT=YES
TLS_DEPENDENT=YES
DNS_DEPENDENT=YES
CUTOVER_REQUIRED=YES
```

## GOI network / bind requirements

### Tailscale-only listeners
- ORS nginx: `443`
- Planet-Clone/Nav proxy: `5000`
- GIS: `8000`
- D-Flight: `8010`
- GraphHopper application: `8989`

### Loopback-only listeners
- ORS gateway: `127.0.0.1:8020`
- GraphHopper admin: `127.0.0.1:8990`

### Shared / non-GOI invariant
- n8n `127.0.0.1:5678` is Control Plane-owned and must not be changed by GOI work.
- Global nginx, Tailscale identity, MagicDNS, TLS identity, DNS/public routing and cutover remain Control Plane-owned.

## Material environment-dependent blockers

1. NEW Tailscale identity/IP/MagicDNS are not assigned; OLD identity remains live.
2. NEW OS hostname is currently `ubuntu`, colliding semantically with OLD `ubuntu.tailc01234.ts.net`.
3. `goi-wait-tailscale-ip` is documented with OLD Tailscale IP semantics (`100.114.7.53`) and must not be activated unchanged.
4. D-Flight `config.toml` contains OLD environment identity: server bind and GIS origin allowlist require NEW values before activation.
5. GraphHopper OLD application bind is `100.114.7.53:8989`; exact effective NEW bind source must be verified/adapted.
6. GOI nginx vhost must be rendered/rebound to NEW Tailscale IP + NEW MagicDNS identity before enablement.
7. OLD GOI TLS material is not a valid final NEW identity; NEW cert CN/SAN must match the NEW approved MagicDNS identity.
8. GIS has documented endpoint dependencies on OLD GraphHopper IP and OLD ORS MagicDNS; endpoint transition/identity-continuity must be resolved before cutover.

## Project-local items requiring explicit presence verification on NEW

These are not classified as missing yet; current status is `UNKNOWN` because the specialist pass did not have direct live SSH verification:

- `/etc/systemd/ors-credentials/ORS_API_KEY` — path/name only, never value
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`
- `/usr/local/sbin/goi-ors-renew-cert`
- `/etc/goi-dflight/csrf-public.pem`
- `/var/lib/goi-dflight/*` last-known-good/cache state
- `/etc/systemd/system/goi-nav-proxy.service.d/override.conf`
- `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`
- effective GraphHopper configuration carrying its bind address
- effective rendered GOI nginx site contents
- GOI service-account UID/GID collision state (`graphhopper`, `goi-ors`, `goi-dflight`)
- effective Tailscale routes/ACL/Serve/Funnel state

## Shared-resource collisions / gates

```text
SHARED_RESOURCE_COLLISIONS=
- OLD/NEW hostname ubuntu
- OLD MagicDNS identity already active
- OLD Tailscale IP embedded in readiness/D-Flight/GraphHopper/GIS dependencies
- nginx rendered bind/domain
- TLS CN/SAN identity
- Tailscale ACL target identity/IP
- service-account UID/GID values not live-verified
- global nginx/public :80 ownership is shared
```

Unknowns are blockers for activation, not evidence of absence.

## Control Plane activation order

1. Verify project-local file/account/config presence on NEW, read-only where possible.
2. Assign a unique NEW Tailscale node identity and join NEW.
3. Record NEW Tailscale IPv4 and MagicDNS name.
4. Reconcile ACL/routes; preserve no Serve/Funnel unless explicitly intended.
5. Adapt OLD-IP/domain-dependent GOI local configuration.
6. Resolve GIS GraphHopper + ORS endpoint transition.
7. Validate `goi-tailscale-ready` against NEW identity.
8. Issue/qualify NEW TLS identity and renewal strategy.
9. Render/validate GOI nginx vhost; only then enable shared nginx integration.
10. Start/qualify GOI services in a controlled validation window.
11. Perform tailnet smoke tests and restart-persistence proof.
12. Parallel OLD↔NEW validation.
13. Human cutover only after end-to-end PASS; retain OLD through rollback window.

## Rollback requirements

- OLD VPS remains LIVE and unchanged until NEW end-to-end validation and cutover.
- Do not revoke OLD Tailscale identity before rollback exit.
- Preserve OLD MagicDNS/TLS service during transition.
- Preserve GraphHopper rollback cache `nord-ovest-B`.
- Preserve D-Flight current/previous LKG data.
- Preserve OLD GIS/Planet-Clone runtime until rollback window closes.

## Control Plane classification

The GOI handoff is **ingested**, but it does **not** promote GOI rows to `MIGRATED_VALIDATED`. Major payload copy is already proven; environment parity and runtime validation remain pending.

Current migration class remains:

`PRESENT_NOT_VALIDATED`

Primary shared-infrastructure blocker remains:

`TAILSCALE_UNIQUE_HOSTNAME_JOIN_ON_NEW`
