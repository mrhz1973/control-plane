# Shared infrastructure registry

This file records the authoritative owner and current state for VPS resources that must not be configured independently by specialist projects.

| Shared resource | Owner | OLD current state | NEW current state | Mutation rule / gate |
|---|---|---|---|---|
| Public host identity | Control Plane | `217.160.71.145` LIVE | `31.70.139.73` PREP | no public cutover before human gate |
| Tailscale node identity | Control Plane | `ubuntu.tailc01234.ts.net`, TS IP `100.114.7.53` | NeedsLogin; OS hostname `ubuntu` collides | unique NEW hostname + join required |
| MagicDNS | Control Plane | OLD name live | NEW not assigned | derive only after NEW join |
| DNS/public routing | Control Plane | OLD remains production | NEW not cut over | explicit human cutover only |
| nginx global service | Control Plane | active/enabled OLD | installed but inactive/disabled NEW | specialist projects may request vhost/upstream requirements; activation centralized |
| GOI nginx vhost | Control Plane with GOI input | active on OLD TS IP | staged only, not enabled | rebind to NEW TS IP after join |
| TLS identity | Control Plane with GOI input | OLD cert CN belongs to OLD MagicDNS | OLD material archived; no valid NEW serving cert | issue NEW cert after NEW MagicDNS identity exists |
| TLS renewal | Control Plane with GOI input | OLD timer exists; historical service failure observed | copied but disabled/inactive | repair/qualify only after NEW cert strategy fixed |
| Public ports `80/443` | Control Plane | OLD nginx owns | NEW refuses / no listener | no activation before shared infra pass |
| GOI TS-bound ports | Control Plane allocates; specialist validates component | OLD `443,5000,8000,8010,8989` plus loopback services | no TS listeners yet | enable only after collision check and NEW TS IP |
| n8n loopback `5678` | Control Plane | OLD production | NEW isolated replica | NEW publication/cutover separately authorized |
| Hermes CDP/VNC/noVNC `9222/5900/6080` | Control Plane/Hermes | loopback | loopback, qualified | must remain private/loopback |
| Docker common runtime | Control Plane | Docker/Compose live | Docker/Compose live | shared namespace collisions checked centrally |
| Common service users | Control Plane with component input | `graphhopper`, `goi-ors`, `goi-dflight` | present as nologin accounts | UID/GID collision check before changes |
| Common paths `/opt` | Control Plane registry; project-local ownership below subtree | GOI/OpenClaw trees | staged copies present | projects may mutate only assigned subtree |
| `/root/local-files/handoff-runtime` | Control Plane | project handoff trees | staged copies present | project scope only; cross-project paths centralized |
| `/srv/cp-verifier-inbox` | Control Plane | live bind | validated NEW directory | no specialist mutation unless explicitly assigned |
| n8n/PostgreSQL/LiteLLM secrets | Control Plane | live OLD | replica continuity validated secret-safe | names/paths/hashes only in evidence, never values |
| Cutover | Control Plane + human operator | OLD live | NOT AUTHORIZED | no specialist project can authorize |
| Rollback retention | Control Plane + human operator | OLD retained | not entered | starts only after successful cutover |
| Decommission | Human final authorization via Control Plane | forbidden now | n/a | only when checklist is fully green |

## Collision law

Before any shared resource is activated, Control Plane must reconcile `SHARED_RESOURCE_COLLISIONS` from every dependent project. Unknowns are blockers, not implicit clearance.

## Current shared-infrastructure next

`TAILSCALE_UNIQUE_HOSTNAME_JOIN_ON_NEW` → NEW MagicDNS identity → NEW TLS issuance/renewal qualification → GOI shared activation ordering.