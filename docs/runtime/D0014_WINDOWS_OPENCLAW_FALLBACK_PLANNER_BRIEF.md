# D-0014-W — Planner Brief

Planner target: **Codex**. Fallback: GLM, then Qwen only under equivalent-or-gate policy.

Generate a schema-valid Cursor Execution Packet from `docs/runtime/BACKLOG_D0014_WINDOWS_OPENCLAW_FALLBACK.md`.

Operator authorization now covers **bounded implementation**, not docs-only discovery. Authorization evidence: issue #20 comment `5431799606`.

The packet must first inspect the current Windows OpenClaw/Tailscale state, then continue in the same bounded task with the minimum implementation required to make Windows OpenClaw a PRIVATE fallback endpoint reachable from the VPS through Tailscale/private transport.

Allowed implementation within the existing authorization:
- start/restart the existing Windows OpenClaw gateway/process if needed;
- minimally change bind/listen settings for Tailscale-private reachability;
- minimally change Windows Firewall/Tailscale-private access only if required for that private endpoint;
- validate local Windows health and VPS-to-Windows private transport/health;
- preserve/verify rollback to pre-task state;
- persist sanitized evidence/checkpoint/report.

Hard stops requiring a new real gate:
- credential/auth/billing mutation or secret exposure;
- public exposure/NAT/port-forward/reverse proxy;
- destructive action;
- autonomous n8n workflow authoring by Cursor;
- VPS OpenClaw credential/provider mutation;
- PM-34/L5/endurance/permanent scheduling;
- promotion of Windows to canonical primary;
- new Z.AI provider/model probe solely for validation when transport/health evidence is sufficient;
- any scope expansion needed to make the task pass.

Acceptance must deterministically prove: existing Windows OpenClaw running, private-only reachability, VPS private health reachability, no public listener, no secret mutation/exposure, rollback defined/testable, sanitized Git persistence.

Execution Packet must include all mandatory v3 fields, exact expected repo/branch/base HEAD read live at generation time, bounded loop, stop conditions, checkpoint policy and `cursor-standard-v3` final report contract.
