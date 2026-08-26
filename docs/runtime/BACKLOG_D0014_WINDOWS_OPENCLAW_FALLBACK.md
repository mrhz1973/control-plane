# Backlog Item D-0014-W — Windows OpenClaw fallback

```yaml
id: D-0014-W
title: Activate Windows OpenClaw as private fallback broker
repository: mrhz1973/control-plane
objective: >
  Make the already-tested Windows OpenClaw installation operational as a PRIVATE
  fallback broker reachable from the VPS/control-plane over Tailscale/private transport,
  while keeping the VPS architecture canonical and issue #8 waiting on Z.AI Support.
scope:
  allowed_areas:
    - inspect existing Windows OpenClaw/Tailscale state first
    - start/restart the existing Windows OpenClaw gateway/process when required
    - apply the minimum non-destructive bind/listen configuration needed for Tailscale-private reachability
    - apply the minimum Windows Firewall/Tailscale-private rule needed only if required for the chosen private port
    - verify local Windows health and VPS-to-Windows private reachability
    - define and verify deterministic fallback health checks and rollback
    - sanitized persistence of evidence/checkpoints in GitHub
  forbidden_areas:
    - public exposure, NAT/port-forwarding, public reverse proxy or open Internet listener
    - credential extraction/exposure/rotation/deletion, Authorization logging or billing mutation
    - destructive actions or destructive Git
    - autonomous n8n workflow authoring by Cursor
    - VPS OpenClaw credential/provider mutation
    - PM-34/L5/endurance/permanent schedule activation
    - promotion of Windows from fallback to canonical primary
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
  - Windows OpenClaw fallback endpoint is running using the existing installation.
  - Endpoint is reachable only through local/private Tailscale path, never public Internet.
  - VPS can perform a deterministic private transport/health check to the Windows fallback endpoint.
  - Existing credentials remain undisclosed and unmodified unless a new explicit gate is reached.
  - No n8n workflow logic is authored by Cursor.
  - A deterministic rollback restores the pre-task Windows OpenClaw/network state.
  - Sanitized evidence and canonical Git verification are persisted.
human_gate_required_if:
  - credentials/auth/billing must change
  - required action would expose a public listener or port
  - destructive action is required
  - required n8n workflow logic is missing and must be authored
  - Windows must become canonical primary
  - provider/model validation would require a new Z.AI probe not already authorized
  - scope expansion beyond private fallback activation is required
context_refs:
  - docs/runtime/CURRENT_FRONTIER.md
  - docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md
  - docs/foundation/CURSOR_PROMPT_TEMPLATE.md
  - docs/contracts/execution-packet-v1.md
  - docs/contracts/planner-routing-policy-v1.md
  - GitHub issue #20
  - GitHub issue #8
status: OPERATOR_AUTHORIZED_FOR_BOUNDED_IMPLEMENTATION
notes:
  - Operator explicitly rejected docs-only on 2026-08-27 and authorized proceeding with FALLBACK 1.
  - Authorization evidence: issue #20 comment 5431799606.
  - Prefer transport/health validation; do not generate extra Z.AI probes merely to prove reachability.
```
