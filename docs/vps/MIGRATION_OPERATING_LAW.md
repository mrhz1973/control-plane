# VPS migration operating law

## Canonical sequence

`OLD LIVE → NEW PREP → FULL REPLICA → PARALLEL VALIDATION → HUMAN CUTOVER GATE → SHORT ROLLBACK WINDOW → DECOMMISSION`

## Hard walls

- no OLD shutdown/reboot/deletion before full parity is proven;
- no automatic DNS/public-route cutover;
- no production n8n publication on NEW before explicit cutover authorization;
- no destructive OLD DB action;
- no secret/cookie/password/API-key values in chat, GitHub or evidence;
- CDP/VNC/noVNC remain loopback/private only;
- project-specific agents may describe shared infrastructure dependencies but must not mutate shared Tailscale/nginx/DNS/TLS state unless Control Plane explicitly assigns that scope;
- copied/staged services remain disabled/inactive until their dependency gate is satisfied;
- OLD remains authoritative production until human cutover.

## Ownership split

### Specialist project owns
- its application/runtime tree
- project-local config
- project-local service definition
- project-local data/cache/runtime dependencies
- component-specific validation
- `VPS_AS_IS_COMPONENT_MAP`
- `SHARED_RESOURCE_COLLISIONS`
- final `PROJECT_VPS_HANDOFF`

### Control Plane owns
- OLD/NEW host identity
- Tailscale node identity / MagicDNS name
- DNS/public route
- global nginx
- TLS identity/certificate strategy
- firewall/public listeners
- cross-project users/groups and shared namespaces
- n8n/PostgreSQL/LiteLLM core
- final service activation ordering
- cutover, rollback and decommission

## Safe migration principle

Copy and stage before activation whenever technically possible. Validation must distinguish:

- `MIGRATED_VALIDATED`
- `PRESENT_NOT_VALIDATED`
- `MISSING`
- `OBSOLETE_NEEDS_HUMAN_DECISION`
- `STOP`

Unknowns are never silently classified as safe.

## Cutover invariant

No project handoff may authorize global cutover by itself. Final cutover requires Control Plane reconciliation of every project handoff, shared-infrastructure collision clearance, restart persistence proof, parallel validation and explicit human authorization.