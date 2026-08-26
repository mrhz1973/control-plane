# D-0014-W — Current gate

Operator authorization for bounded FALLBACK 1 implementation was given 2026-08-27 and persisted in issue #20 comment `5431799606`.

Implementation completed 2026-08-27:

- Windows OpenClaw gateway running on loopback `127.0.0.1:18789`.
- Tailscale Serve enabled (tailnet-only) at `https://asusdesktop.tailc01234.ts.net/` proxying to the loopback gateway.
- VPS (`ubuntu` / `100.114.7.53`) validated private HTTPS and WebSocket transport reachability.
- No Tailscale Funnel, no public/LAN OpenClaw listener, no credential/auth/billing mutation, no VPS OpenClaw provider mutation, no extra Z.AI provider/model probe.

A NEW human gate is still required before:

- credential/auth/billing mutation or any secret exposure/extraction;
- public listener/port exposure, NAT/port-forwarding or public reverse proxy;
- destructive action;
- autonomous n8n workflow authoring by Cursor;
- VPS OpenClaw credential/provider mutation;
- PM-34/L5/endurance/permanent scheduling;
- promotion of Windows from fallback to canonical primary;
- extra Z.AI provider/model probes not needed for transport/health validation;
- installing Windows gateway as a persistent OS service if desired beyond the current foreground runtime;
- any other scope expansion.

Current state: `IMPLEMENTATION_PASS / WINDOWS_PRIVATE_FALLBACK_OPERATIONAL / NEXT_REAL_GATE_FOR_PRODUCTION_WIRING_OR_SERVICE_HARDENING`.
