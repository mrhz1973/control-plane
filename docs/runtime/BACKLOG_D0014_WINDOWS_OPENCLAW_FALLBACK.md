# Backlog Item D-0014-W — Windows OpenClaw fallback

```yaml
id: D-0014-W
title: Prepare Windows OpenClaw as private fallback broker
repository: mrhz1973/control-plane
objective: >
  Prepare the already-tested Windows OpenClaw installation as a private fallback
  broker for the control-plane while the canonical VPS IONOS Z.AI path remains
  blocked awaiting provider response, without changing the canonical primary
  architecture and without enabling production/runtime wiring in this backlog step.
scope:
  allowed_areas:
    - read-only discovery of the existing Windows OpenClaw installation and current state
    - read-only verification of Windows Tailscale presence/state and private reachability prerequisites
    - read-only verification of OpenClaw version, provider/profile/model metadata, gateway/service state, listening ports and local paths
    - architecture/design for n8n VPS -> Tailscale -> Windows OpenClaw fallback transport
    - definition of minimal future activation steps, rollback, health checks and failover boundaries
    - sanitized persistence of evidence and plan in GitHub
  forbidden_areas:
    - API key or Authorization value exposure, extraction, copying, hashing or secret-derived metadata
    - credential/auth/billing mutation
    - starting, installing or modifying OpenClaw gateway/service/daemon
    - Tailscale configuration changes, exit-node changes, ACL changes or route advertisement
    - Windows Firewall changes, port-forwarding, reverse proxy or public exposure
    - n8n workflow creation/modification or runtime wiring
    - VPS OpenClaw mutation
    - provider/model requests not separately authorized
    - PM-34/L5/runtime/endurance/permanent schedule activation
risk_hint: medium
complexity_hint: medium
planner:
  preferred: codex
  fallback:
    - glm
    - qwen
  fallback_policy: equivalent_or_gate
execution:
  target: cursor
  loop_allowed: true
acceptance:
  - Existing Windows OpenClaw state is inventoried read-only with no secret exposure.
  - Tailscale/private-network prerequisites are identified without mutation.
  - A concrete private fallback topology is documented: n8n VPS -> Tailscale -> Windows OpenClaw.
  - Exact future activation mutations are separated from discovery and marked as requiring a new human gate.
  - Rollback and health-check criteria are deterministic.
  - No provider/model call, auth/config/runtime/network mutation, public exposure or n8n workflow authoring occurs in the discovery step.
  - GitHub evidence is sanitized and references current canonical frontier.
human_gate_required_if:
  - any credential/auth/billing action
  - any OpenClaw gateway/service start or install
  - any Tailscale/ACL/route/network/firewall mutation
  - any n8n workflow/runtime wiring
  - any public exposure
  - any provider/model request beyond already-persisted evidence
  - any scope expansion or destructive action
context_refs:
  - docs/runtime/CURRENT_FRONTIER.md
  - docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md
  - docs/foundation/CURSOR_PROMPT_TEMPLATE.md
  - docs/contracts/execution-packet-v1.md
  - docs/contracts/planner-routing-policy-v1.md
  - GitHub issue #8
status: BACKLOG_READY_FOR_PLANNER
notes:
  - Canonical primary remains OpenClaw on VPS; Windows is fallback, not silent promotion to primary.
  - Z.AI support escalation remains independently open and awaiting provider response.
  - Existing evidence indicates Windows OpenClaw + Coding Plan Global + glm-5.1 previously succeeded.
```
