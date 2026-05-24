# Control Plane — Project Vision (foundation v2.0)

**Version:** 2.0 (active)

Private-first control plane: orchestration docs and gated runtime on **Ryzen (casa)** and **VPS**, with **no** public exposure by default.

## Principles

- n8n on loopback (`127.0.0.1`) unless an explicit gate says otherwise.
- Workflow **40** ACTIVE / **41** BACKUP OFF — do not edit without a gate packet.
- PM-34 real worker, Codex, and OpenClaw remain **separate** explicit gates.
- Secrets never committed.

## Connectivity (foundation layer)

Private admin path: **Tailscale mesh** VPS - Ryzen — see [session PASS](../sessions/2026-05-23-control-plane-tailscale-vps-ryzen-private-mesh-pass.md) and [FOUNDATION_STATUS](FOUNDATION_STATUS.md).
