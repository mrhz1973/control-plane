# VPS project handoff — OpenClaw — 2026-09-07

Parent: #68. Specialist dispatch: #71.

## Evidence basis

Current Foundation (`docs/foundation/PROJECT_VISION.md`) defines OpenClaw as a **preserved fallback/existing broker**, not the primary remote gateway; LiteLLM is primary. The latest OLD census recorded `/opt/openclaw-app` + `/opt/openclaw-node`, Node v24.19.0, **no systemd unit, no listener, no boot persistence**. Prep-copy PASS copied both trees to NEW with matching manifests and deliberately did not start them.

No live SSH claim is added by this handoff.

```text
VPS_AS_IS_COMPONENT_MAP
PROJECT=control-plane/OpenClaw
COMPONENT=OpenClaw preserved fallback/existing broker trees
OLD_HOST=ionos-n8n
NEW_HOST=ionos-n8n-new
APPLICATION_PATHS=/opt/openclaw-app,/opt/openclaw-node
SYSTEMD_UNITS=NONE_OBSERVED
TIMERS=NONE_OBSERVED
DOCKER_CONTAINERS=NONE_OBSERVED_COMPONENT_LOCAL
LISTENING_PORTS=NONE_OBSERVED
BIND_ADDRESSES=NONE_OBSERVED
BOOT_PERSISTENCE=NONE_OBSERVED
TAILSCALE_DEPENDENCIES=POTENTIAL_FUTURE_FALLBACK_PATH_ONLY
NGINX_DEPENDENCIES=NO_CURRENT_RUNTIME
TLS_DEPENDENCIES=NO_CURRENT_RUNTIME
DNS_DEPENDENCIES=NO_CURRENT_RUNTIME
SECRETS=provider/auth dependencies exist only if fallback runtime is later activated; values forbidden
OTHER_PROJECT_DEPENDENCIES=n8n/LiteLLM/Control Plane policy if explicitly selected as fallback
```

```text
LOCAL_TO_COMPONENT=
- /opt/openclaw-app
- /opt/openclaw-node
- component-local runtime/config if later activated under a separate gate

SHARED_INFRASTRUCTURE=
- Tailscale transport only if an authorized fallback path later needs it
- n8n/LiteLLM/Control Plane routing policy
- provider/auth secret stores

SHARED_RESOURCE_COLLISIONS=
- NONE for current staged/no-listener state
- future listener/port/Tailscale requirements must be rechecked before any activation
```

```text
PROJECT_VPS_HANDOFF
PROJECT=control-plane/OpenClaw
COMPONENT=preserved fallback/existing broker trees
AS_IS_COMPLETE=YES
OLD_STATE=trees present; no systemd unit/listener/boot persistence observed in latest census
NEW_STATE=trees copied with matching manifests; not activated
MIGRATION_STATUS=PRESENT_NOT_VALIDATED
OLD_CHANGED=NO
NEW_VALIDATED=NO
RESTART_PERSISTENCE=NOT_TESTED
TAILSCALE_DEPENDENT=NO for current staged state; YES only for a future explicitly selected fallback transport
NGINX_DEPENDENT=NO
TLS_DEPENDENT=NO
DNS_DEPENDENT=NO
SAFE_TO_COPY_NOW=already copied
SHARED_INFRA_CHANGES_REQUIRED=NONE before Tailscale join
MUST_WAIT_FOR_CONTROL_PLANE=any future OpenClaw activation/provider-auth/listener configuration
SHARED_RESOURCE_COLLISIONS=NONE_CURRENTLY
CUTOVER_REQUIRED=NO for staged preservation
ROLLBACK_REQUIREMENTS=retain OLD trees while OLD remains rollback source
BLOCKERS=human disposition/activation policy remains separate; not a Tailscale pre-join blocker
EVIDENCE_POINTER=docs/foundation/PROJECT_VISION.md; reports/architecture/v4_replacement_8gb_full_service_parity_census_v1.md; reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md
```

```text
OPENCLAW_DISPOSITION_RECOMMENDATION=KEEP_STAGED_PENDING
RATIONALE=Foundation still preserves OpenClaw as an authorized fallback/existing broker path, while the current OLD footprint has no listener/unit and NEW activation is unnecessary for the migration join gate. Keeping the verified copy staged preserves fallback optionality without creating network or provider-auth risk.
```

Conclusion: OpenClaw does **not** block creation/join of a unique NEW Tailscale identity. Activation remains a later, separate gate.