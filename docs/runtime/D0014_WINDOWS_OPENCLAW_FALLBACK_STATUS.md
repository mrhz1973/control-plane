# D-0014-W — Windows OpenClaw fallback status

Status: `IMPLEMENTATION_PASS`

- Backlog: `docs/runtime/BACKLOG_D0014_WINDOWS_OPENCLAW_FALLBACK.md`
- Execution packet: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_EXECUTION_PACKET.yaml`
- Operator gate: issue **#20**, comment `5431799606`
- Topology: loopback bind + Tailscale Serve (tailnet-only)
- Windows OpenClaw: `2026.5.20` · gateway running · `127.0.0.1:18789`
- Private endpoint: `https://asusdesktop.tailc01234.ts.net/` → `127.0.0.1:18789`
- VPS private reachability: PASS (HTTPS 200, WSS connect ok from `ubuntu` / `100.114.7.53`)
- Public/Funnel exposure: none observed
- Canonical primary: VPS OpenClaw unchanged
- Parallel blocker: issue #8 awaiting Z.AI Support

Rollback (local only, not in Git):

1. Stop the Windows gateway process (`openclaw gateway stop`).
2. Restore `%USERPROFILE%\.openclaw\openclaw.json` from `%USERPROFILE%\.openclaw\openclaw.json.rollback-d0014-w`.
3. If Tailscale Serve remains mapped, run `tailscale serve reset` or restart gateway with prior settings.
