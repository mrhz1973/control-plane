# Project VPS handoff standard

Every specialist project that owns a VPS component must first describe how the component was organized on the VPS before migration or activation work.

## Required AS-IS block

```text
VPS_AS_IS_COMPONENT_MAP

PROJECT
COMPONENT

OLD_HOST
OLD_HOSTNAME
OLD_PUBLIC_IP
OLD_TAILSCALE_IP
OLD_MAGICDNS_NAME

SYSTEMD_UNITS
TIMERS
DOCKER_CONTAINERS
DOCKER_NETWORKS
DOCKER_VOLUMES

LISTENING_PORTS
BIND_ADDRESSES
PUBLIC_PORTS
LOOPBACK_PORTS
TAILSCALE_BOUND_PORTS

NGINX_SITES
NGINX_UPSTREAMS
TLS_CERT_PATHS
TLS_CN
TLS_RENEWAL_METHOD

TAILSCALE_DEPENDENCIES
MAGICDNS_DEPENDENCIES
SERVE_FUNNEL_STATE
ROUTES

USERS_GROUPS
SERVICE_ACCOUNTS

APPLICATION_PATHS
DATA_PATHS
CACHE_PATHS
CONFIG_PATHS
LOG_PATHS
VENV_JDK_NODE_RUNTIME_PATHS

BOOT_PERSISTENCE
START_ORDER
AFTER_REQUIRES_DEPENDENCIES

SECRETS
- names/paths only; never values

EXTERNAL_DEPENDENCIES
OTHER_PROJECT_DEPENDENCIES
CUTOVER_DEPENDENCIES
ROLLBACK_REQUIREMENTS
```

## Required ownership classification

Each project must classify every dependency into:

```text
LOCAL_TO_COMPONENT
SHARED_INFRASTRUCTURE
```

Shared infrastructure normally belongs to Control Plane: Tailscale, MagicDNS, DNS, global nginx, TLS identity, public listeners/firewall, cross-project users/groups, shared Docker namespaces, n8n/PostgreSQL/LiteLLM core and final cutover.

## Required collision report

Every project must emit `SHARED_RESOURCE_COLLISIONS` and explicitly check relevant:

- TCP/UDP ports and bind addresses
- Tailscale routes / MagicDNS names
- nginx vhosts/upstreams
- TLS CN/SAN
- Linux users/groups/UID/GID
- `/opt`, `/srv`, `/root/local-files` paths
- Docker network/volume names
- timers/service names
- credential-store paths

Use `UNKNOWN` when unproven; never assume safe.

## Required final handoff

```text
PROJECT_VPS_HANDOFF

PROJECT=<name>
COMPONENT=<name-or-set>
AS_IS_COMPLETE=YES|NO

OLD_STATE=<summary>
NEW_STATE=<summary>

MIGRATION_STATUS=MIGRATED_VALIDATED|PRESENT_NOT_VALIDATED|MISSING|STOP
OLD_CHANGED=YES|NO
NEW_VALIDATED=YES|NO
RESTART_PERSISTENCE=PASS|FAIL|NOT_TESTED

TAILSCALE_DEPENDENT=YES|NO
NGINX_DEPENDENT=YES|NO
TLS_DEPENDENT=YES|NO
DNS_DEPENDENT=YES|NO

SAFE_TO_COPY_NOW=<items>
SHARED_INFRA_CHANGES_REQUIRED=<items>
MUST_WAIT_FOR_CONTROL_PLANE=<items>
SHARED_RESOURCE_COLLISIONS=<items|NONE>
CUTOVER_REQUIRED=YES|NO
ROLLBACK_REQUIREMENTS=<items>
BLOCKERS=<items|NONE>
EVIDENCE_POINTER=<repo/path/issue/comment>
```

## Specialist-project prompt contract

A Control Plane migration prompt handed to a specialist GPT/project must include:
- canonical OLD and NEW host/IP identities;
- current status from the VPS registry / active migration issue;
- exact component scope;
- mandatory `VPS_AS_IS_COMPONENT_MAP` before changes;
- mandatory local/shared classification;
- mandatory collision check;
- exact safe-to-migrate boundaries;
- secret-safe transfer rules;
- PASS/STOP criteria;
- required `PROJECT_VPS_HANDOFF` return format;
- prohibition on unrelated Tailscale/nginx/DNS/TLS/cutover mutations.