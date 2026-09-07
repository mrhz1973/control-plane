# Shared infrastructure registry

This file records the authoritative owner and current state for VPS resources that must not be configured independently by specialist projects.

GOI specialist requirements were ingested on 2026-09-07 from `reports/architecture/vps_goi_project_handoff_2026-09-07.md`. They refine the shared-infrastructure activation constraints without changing current migration counts or authorizing activation.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | `ubuntu.tailc01234.ts.net`, TS IP `100.114.7.53` | NeedsLogin; OS hostname `ubuntu` collides | unique NEW hostname + join required; GOI requirements now fully ingested for this gate |
| MagicDNS | Control Plane | OLD name live | NEW not assigned | derive only after NEW join; must not reuse OLD identity while OLD is live |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| Tailscale ACL/routes | Control Plane with project input | OLD GOI clients use TS-bound `443,5000,8000,8010,8989`; effective routes/ACL are not fully captured in handoff | NEW not joined; ACL/routes unknown | after join, inventory/reconcile intended access; `8020/8990` must remain loopback; no Serve/Funnel unless explicitly intended |
| nginx global service | Control Plane | active/enabled OLD | installed but inactive/disabled NEW | specialist projects may request vhost/upstream requirements; activation centralized |
| GOI nginx vhost | Control Plane with GOI input | active on OLD TS IP | staged only, not enabled | render/rebind to NEW TS IP + NEW MagicDNS after join; upstream remains `127.0.0.1:8020` |
| GOI Tailscale readiness | Control Plane with GOI input | OLD helper documented against `100.114.7.53` and gates nginx startup | helper copied/staged; NEW identity not assigned | verify/adapt helper and nginx readiness drop-in to NEW identity before enablement |
| GOI endpoint transition | Control Plane with GOI input | GIS references OLD GraphHopper IP and OLD ORS MagicDNS in documented topology | unresolved | choose/validate NEW endpoint transition or approved identity-continuity strategy before GOI cutover |
| TLS identity | Control Plane with GOI input | OLD cert CN belongs to OLD MagicDNS | OLD material archived; no valid NEW serving cert | issue NEW cert after NEW MagicDNS identity exists; CN/SAN must match NEW identity |
| TLS renewal | Control Plane with GOI input | OLD timer exists; renewal helper derives identity from host naming | copied but disabled/inactive | qualify only after NEW hostname/MagicDNS/cert strategy is final; verify renewal helper presence before enablement |
| Public ports `80/443` | Control Plane | OLD nginx owns | NEW refuses / no listener | no activation before shared infra pass; GOI `443` must be TS-bound only |
| GOI TS-bound ports | Control Plane allocates; specialist validates component | OLD `443,5000,8000,8010,8989` plus loopback `8020,8990` | no TS listeners yet | enable only after collision check and NEW TS IP; never expose `8020/8990` to tailnet/public |
| n8n loopback `5678` | Control Plane | OLD production | NEW isolated replica | NEW publication/cutover separately authorized; GOI must not mutate |
| Hermes CDP/VNC/noVNC `9222/5900/6080` | Control Plane/Hermes | loopback | loopback, qualified | must remain private/loopback |
| Docker common runtime | Control Plane | Docker/Compose live | Docker/Compose live | shared namespace collisions checked centrally |
| Common service users | Control Plane with component input | `graphhopper`, `goi-ors`, `goi-dflight` | present as nologin accounts | UID/GID collision check before changes; handoff did not live-verify numeric parity |
| Common paths `/opt` | Control Plane registry; project-local ownership below subtree | GOI/OpenClaw trees | staged copies present | projects may mutate only assigned subtree |
| `/root/local-files/handoff-runtime` | Control Plane | project handoff trees | staged copies present | project scope only; cross-project paths centralized |
| `/srv/cp-verifier-inbox` | Control Plane | live bind | validated NEW directory | no specialist mutation unless explicitly assigned |
| n8n/PostgreSQL/LiteLLM secrets | Control Plane | live OLD | replica continuity validated secret-safe | names/paths/hashes only in evidence, never values |
| Cutover | Control Plane + human operator | OLD live | NOT AUTHORIZED | no specialist project can authorize |
| Rollback retention | Control Plane + human operator | OLD retained | not entered | starts only after successful cutover |
| Decommission | Human final authorization via Control Plane | forbidden now | n/a | only when checklist is fully green |

## Collision law

Before any shared resource is activated, Control Plane must reconcile `SHARED_RESOURCE_COLLISIONS` from every dependent project. Unknowns are blockers, not implicit clearance.

GOI has now reported these material shared collisions/dependencies:

- NEW hostname `ubuntu` must not silently reuse OLD MagicDNS/TLS identity.
- OLD Tailscale IP `100.114.7.53` is embedded in documented readiness/D-Flight/GraphHopper/GIS dependencies and requires NEW-identity reconciliation.
- GOI nginx bind/domain and TLS CN/SAN must be rendered for NEW, not copied as an active OLD identity.
- Tailscale ACL/routes for GOI must be read-only inventoried/reapplied to the NEW node as intended.
- Effective service-account UID/GID collision state remains to be checked before any identity mutation.

## Current shared-infrastructure next

`TAILSCALE_UNIQUE_HOSTNAME_JOIN_ON_NEW` → record NEW Tailscale IPv4/MagicDNS → reconcile GOI IP/domain-dependent config + ACL/routes → NEW TLS issuance/renewal qualification → GOI shared activation ordering.
