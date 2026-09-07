# Shared infrastructure registry

This file records the authoritative owner and current state for VPS resources that must not be configured independently by specialist projects.

Project pre-join handoffs were reconciled before Tailscale join. NEW Tailscale authentication/join succeeded on 2026-09-07 with a unique node identity.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | node `ubuntu`, TS IP `100.114.7.53`, MagicDNS `ubuntu.tailc01234.ts.net` | joined as unique node `ionos-n8n-new`, TS IP `100.99.54.93`; OS hostname still `ubuntu` | join PASS; verify DNSName/MagicDNS + ACL/routes + Serve/Funnel before promotion/GOI activation |
| NEW Tailscale hostname | Control Plane | n/a | `ionos-n8n-new` | explicitly selected and proven by `tailscale status`; do not silently replace with OS hostname `ubuntu` |
| MagicDNS | Control Plane | OLD name live | NEW DNSName not yet read-only captured | read `Self.DNSName`; no GOI/TLS render until exact NEW name is recorded |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD GOI clients use TS-bound `443,5000,8000,8010,8989` | NEW joined; effective advertised routes/ACL acceptance not yet captured | read-only inventory now; no route advertisement or ACL mutation without explicit need |
| Tailscale Serve/Funnel | Control Plane | no serve config in last census | must read-only verify after join | must remain none unless separately authorized |
| nginx global service | Control Plane | active/enabled OLD | installed but inactive/disabled NEW | activation centralized; do not enable before GOI config/TLS pass |
| GOI nginx vhost | Control Plane with GOI input | active on OLD TS IP | staged only, not enabled | render/rebind to NEW `100.99.54.93` + exact NEW MagicDNS after verification; upstream remains `127.0.0.1:8020` |
| GOI Tailscale readiness | Control Plane with GOI input | OLD helper documented against `100.114.7.53` | helper copied/staged; NEW TS IP now `100.99.54.93` | verify/adapt helper and nginx readiness drop-in before enablement |
| GOI endpoint transition | Control Plane with GOI input | GIS references OLD GraphHopper IP and OLD ORS MagicDNS | NEW TS IP known; NEW DNSName verification pending | reconcile endpoints after exact DNSName capture; no client cutover yet |
| TLS identity | Control Plane with GOI input | OLD cert CN belongs to OLD MagicDNS | OLD material archived; no valid NEW serving cert | issue NEW cert only after exact NEW MagicDNS identity is verified |
| TLS renewal | Control Plane with GOI input | OLD timer exists; renewal helper derives identity from host naming | copied but disabled/inactive | qualify after NEW hostname/MagicDNS/cert strategy is final; OS hostname remains `ubuntu` and must not accidentally drive OLD-style identity derivation |
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
NEW_OS_HOSTNAME=ubuntu
IDENTITY_COLLISION=NO
```

## Current shared-infrastructure next

`VERIFY_NEW_TAILSCALE_DNSNAME_ROUTES_SERVE` → record exact NEW MagicDNS → reconcile GOI OLD-IP/domain-dependent config → NEW TLS issuance/renewal qualification → GOI shared activation ordering.
