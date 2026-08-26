# D-0014-W — Planner Brief

Planner target: **Codex**. Fallback: GLM, then Qwen only under equivalent-or-gate policy.

Generate a schema-valid Cursor Execution Packet from `docs/runtime/BACKLOG_D0014_WINDOWS_OPENCLAW_FALLBACK.md`.

The first packet must be **read-only discovery + fallback design only**. It must not start or install the OpenClaw gateway/service, change Tailscale/network/firewall, modify n8n, mutate auth/config/credentials/billing, or issue provider/model requests.

Required discovery targets on Windows:
- verify repository/branch preflight per `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`;
- identify current Windows OpenClaw binary/version/install paths and Node/runtime dependencies;
- inventory current provider/profile/model metadata without exposing or deriving secrets;
- verify gateway/service/process/listening-port state read-only;
- verify Tailscale installation/status/private address/peer reachability prerequisites read-only;
- identify the minimum private interface/bind/port architecture needed for future `n8n VPS -> Tailscale -> Windows OpenClaw` fallback;
- define deterministic health checks, failover trigger, rollback, and explicit future human gates;
- persist sanitized evidence only.

Execution Packet must include all mandatory v3 fields, bounded loop, acceptance criteria, checkpoint policy, stop conditions, and `cursor-standard-v3` final report contract.

Do not reinterpret Windows as canonical primary. The VPS remains primary target; this task prepares a fallback while issue #8 awaits Z.AI Support.
