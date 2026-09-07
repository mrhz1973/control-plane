# Shared infrastructure registry

This file records the authoritative owner and current state for VPS resources that must not be configured independently by specialist projects.

Project pre-join handoffs were reconciled before Tailscale join. NEW Tailscale authentication/join and post-join read-only identity/static-state verification succeeded on 2026-09-07 with a unique node identity.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | node `ubuntu`, TS IP `100.114.7.53`, MagicDNS `ubuntu.tailc01234.ts.net` | node `ionos-n8n-new`, TS IPv4 `100.99.54.93`, TS IPv6 `fd7a:115c:a1e0::6a3a:365f`, MagicDNS `ionos-n8n-new.tailc01234.ts.net`; OS hostname still `ubuntu` | join + exact DNSName/static config PASS; keep component row conservative until private reachability/restart persistence is proven |
| NEW Tailscale hostname | Control Plane | n/a | `ionos-n8n-new` | explicitly selected and proven by `tailscale status`/Self.HostName; do not silently replace with OS hostname `ubuntu` |
| MagicDNS | Control Plane | OLD `ubuntu.tailc01234.ts.net` live | exact NEW name `ionos-n8n-new.tailc01234.ts.net` verified | use this exact NEW identity for GOI/TLS rendering; never reuse OLD name while OLD is live |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD GOI clients use TS-bound `443,5000,8000,8010,8989` | `PrimaryRoutes=NONE`; no advertised primary routes observed | no route advertisement mutation unless explicitly required; component reachability validation still pending |
| Tailscale exit-node role | Control Plane | not required by current migration state | `ExitNodeOption=False` | do not enable without a separate explicit requirement |
| Tailscale Serve/Funnel | Control Plane | no serve config in last census | `No serve config` / `No serve config` verified after join | must remain none unless separately authorized |
| nginx global service | Control Plane | active/enabled OLD | installed but inactive/disabled NEW | activation centralized; do not enable before GOI config/TLS pass |
| GOI nginx vhost | Control Plane with GOI input | active on OLD TS IP | staged only, not enabled | render/rebind to NEW `100.99.54.93` + `ionos-n8n-new.tailc01234.ts.net`; upstream remains `127.0.0.1:8020` |
| GOI Tailscale readiness | Control Plane with GOI input | OLD helper documented against `100.114.7.53` | helper copied/staged; NEW identity now exact | verify/adapt helper and nginx readiness drop-in before enablement |
| GOI endpoint transition | Control Plane with GOI input | GIS references OLD GraphHopper IP and OLD ORS MagicDNS | NEW exact identity known: `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net` | reconcile endpoints read-only-first, then bounded config delta; no client cutover yet |
| TLS identity | Control Plane with GOI input | OLD cert CN belongs to `ubuntu.tailc01234.ts.net` | OLD material archived; no valid NEW serving cert | NEW certificate must target `ionos-n8n-new.tailc01234.ts.net`; issuance remains a later shared-infra mutation |
| TLS renewal | Control Plane with GOI input | OLD timer exists; renewal helper derives identity from host naming | copied but disabled/inactive | qualify after NEW-specific render; OS hostname remains `ubuntu`, so helper must not infer the wrong identity from OS hostname |
| Public ports `80/443` | Control Plane | OLD nginx owns | NEW refuses / no listener from prep-copy evidence | no public activation before shared infra pass; GOI `443` must be Tailscale-bound only |
| GOI TS-bound ports | Control Plane allocates; specialist validates component | OLD `443,5000,8000,8010,8989`; loopback `8020,8990` | no GOI TS listeners activated yet | enable only after config collision check and NEW identity reconciliation; never expose `8020/8990` to tailnet/public |
| n8n loopback `5678` | Control Plane | OLD production | NEW isolated replica | NEW publication/cutover separately authorized; specialist projects must not mutate |
| schema-engine local dependency | Control Plane | isolated Ajv dependency consumed through n8n bind mount | copied, resolver smoke pending | no network dependency; validate independently |
| dev-method reference tree | dev-method / Control Plane | tree-only method/reference copy | copied/validated | no shared network dependency |
| OpenClaw preserved fallback | Control Plane | `/opt/openclaw-*`, no unit/listener in latest census | copied/staged, inactive | future activation/listener/provider-auth work is a separate gate |
| Hermes CDP/VNC/noVNC `9222/5900/6080` | Control Plane/Hermes | loopback | loopback, qualified | must remain private/loopback |
| Docker common runtime | Control Plane | Docker/Compose live | Docker/Compose live | shared namespace collisions checked centrally |
| Common service users | Control Plane with component input | `graphhopper`, `goi-ors`, `goi-dflight` | present as nologin accounts | UID/GID collision check before changes; no numeric-parity mutation required for Tailscale identity itself |
| Common paths `/opt` | Control Plane registry; project-local ownership below subtree | GOI/OpenClaw trees | staged copies present | projects may mutate only assigned subtree |
| `/root/local-files/handoff-runtime` | Control Plane | project handoff trees | staged copies present | project scope only; cross-project paths centralized |
| `/srv/cp-verifier-inbox` | Control Plane | live bind | validated NEW directory | no specialist mutation unless explicitly assigned |
| n8n/PostgreSQL/LiteLLM secrets | Control Plane | live OLD | replica continuity validated secret-safe | names/paths/hashes only in evidence, never values |
| Cutover | Control Plane + human operator | OLD live | NOT AUTHORIZED | no specialist project can authorize |
| Rollback retention | Control Plane + human operator | OLD retained | not entered | starts only after successful cutover |
| Decommission | Human final authorization via Control Plane | forbidden now | n/a | only when checklist is fully green |

## Current identity proof

```text
OLD_TS_NODE=ubuntu
OLD_TS_IPV4=100.114.7.53
OLD_MAGICDNS=ubuntu.tailc01234.ts.net
NEW_TS_NODE=ionos-n8n-new
NEW_TS_IPV4=100.99.54.93
NEW_TS_IPV6=fd7a:115c:a1e0::6a3a:365f
NEW_MAGICDNS=ionos-n8n-new.tailc01234.ts.net
NEW_PRIMARY_ROUTES=NONE
NEW_EXIT_NODE_OPTION=FALSE
NEW_SERVE_CONFIG=NONE
NEW_FUNNEL_CONFIG=NONE
NEW_OS_HOSTNAME=ubuntu
IDENTITY_COLLISION=NO
```

The Tailscale admin UI screenshot additionally corroborates OLD and NEW simultaneously connected with the distinct IPv4 addresses above.

## Current shared-infrastructure next

`GOI_IDENTITY_CONFIG_RECONCILIATION_READ_ONLY` → bounded NEW-specific GOI config delta → NEW TLS issuance/renewal qualification → GOI shared activation ordering → private reachability/restart-persistence proof.
