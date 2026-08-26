# D-0014-W — Current gate

Operator authorization for bounded FALLBACK 1 implementation was given 2026-08-27 and persisted in issue #20 comment `5431799606`.

Within this consumed gate, the implementer may:
- inspect current Windows OpenClaw/Tailscale state;
- start/restart the existing Windows OpenClaw gateway/process if required;
- apply the minimum non-destructive bind/listen change for Tailscale-private reachability;
- apply the minimum Windows Firewall/Tailscale-private rule required for that private endpoint;
- validate local Windows health and VPS-to-Windows private reachability;
- persist sanitized evidence and rollback instructions.

A NEW human gate is still required before:
- credential/auth/billing mutation or any secret exposure/extraction;
- public listener/port exposure, NAT/port-forwarding or public reverse proxy;
- destructive action;
- autonomous n8n workflow authoring by Cursor;
- VPS OpenClaw credential/provider mutation;
- PM-34/L5/endurance/permanent scheduling;
- promotion of Windows from fallback to canonical primary;
- extra Z.AI provider/model probes not needed for transport/health validation;
- any other scope expansion.

Current state: `IMPLEMENTATION_AUTHORIZED / EXECUTION_PACKET_REQUIRED / NOT_YET_EXECUTED`.
