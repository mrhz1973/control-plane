# VPS project handoff — schema-engine — 2026-09-07

Parent: #68. Specialist dispatch: #70.

## Evidence basis

Canonical evidence `reports/architecture/d0025_vps_schema_engine.md` proves schema-engine is **not a standalone network service**. It is an isolated Node dependency tree used by Control Plane validation inside the n8n container through `CONTROL_PLANE_AJV_NODE_MODULES=/files/handoff-runtime/schema-engine/node_modules`.

OLD role:
- host path `/root/local-files/handoff-runtime/schema-engine`;
- container path `/files/handoff-runtime/schema-engine/node_modules`;
- Ajv 8.20.0 + ajv-formats 3.0.1;
- no standalone listener, systemd unit, timer, public port, nginx/TLS/DNS/Tailscale identity.

Prep-copy PASS copied the tree OLD→NEW with matching manifest (`75a65eea…`), but no NEW live resolver test was performed in this precheck.

```text
VPS_AS_IS_COMPONENT_MAP
PROJECT=control-plane
COMPONENT=schema-engine isolated node_modules dependency
OLD_HOST=ionos-n8n
NEW_HOST=ionos-n8n-new
APPLICATION_PATHS=/root/local-files/handoff-runtime/schema-engine
CONTAINER_PATHS=/files/handoff-runtime/schema-engine/node_modules
SYSTEMD_UNITS=NONE_COMPONENT_LOCAL
TIMERS=NONE
LISTENING_PORTS=NONE
BIND_ADDRESSES=NONE
TAILSCALE_DEPENDENCIES=NO
NGINX_DEPENDENCIES=NO
TLS_DEPENDENCIES=NO
DNS_DEPENDENCIES=NO
OTHER_PROJECT_DEPENDENCIES=n8n container + control-plane validator
SECRETS=NONE
```

```text
LOCAL_TO_COMPONENT=
- Ajv/ajv-formats isolated node_modules tree

SHARED_INFRASTRUCTURE=
- n8n container/bind mount
- control-plane validator execution surface

SHARED_RESOURCE_COLLISIONS=
- no port/name/Tailscale/nginx/TLS collision
- filesystem path is dedicated under shared handoff-runtime
```

```text
PROJECT_VPS_HANDOFF
PROJECT=control-plane
COMPONENT=schema-engine
AS_IS_COMPLETE=YES
OLD_STATE=isolated validator dependency consumed from n8n container bind mount; no standalone runtime
NEW_STATE=tree copied with matching manifest; live resolver/validator smoke on NEW not yet re-proven
MIGRATION_STATUS=PRESENT_NOT_VALIDATED
OLD_CHANGED=NO
NEW_VALIDATED=NO
RESTART_PERSISTENCE=NOT_TESTED
TAILSCALE_DEPENDENT=NO
NGINX_DEPENDENT=NO
TLS_DEPENDENT=NO
DNS_DEPENDENT=NO
SAFE_TO_COPY_NOW=already copied
SHARED_INFRA_CHANGES_REQUIRED=NONE
MUST_WAIT_FOR_CONTROL_PLANE=NEW resolver smoke can occur independently; does not gate Tailscale join
SHARED_RESOURCE_COLLISIONS=NONE
CUTOVER_REQUIRED=NO
ROLLBACK_REQUIREMENTS=retain OLD tree while OLD is rollback source
BLOCKERS=NEW live resolver/validator smoke only
EVIDENCE_POINTER=reports/architecture/d0025_vps_schema_engine.md; reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md
```

Conclusion: schema-engine remains `PRESENT_NOT_VALIDATED` but is **not a pre-join network blocker**.