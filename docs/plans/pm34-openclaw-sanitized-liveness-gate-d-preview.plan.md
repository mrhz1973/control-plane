# PM-34 — OpenClaw sanitized liveness Gate D / PM21 preview

Project: control-plane
Repository: mrhz1973/control-plane
Branch: main
Mode: preview-only
Route: cursor-control-plane
Risk: low
Approval required: no
Worker: mock-worker
Action: preview only, no Codex execution

## Purpose

Trigger workflow 40 preview processing using sanitized OpenClaw liveness evidence.

This is not a real-worker activation.
This does not unblock PM-34.
This does not set n8n_ready=true.
This does not set strict_pass_candidate=true.

## Evidence source

Session doc:

- docs/sessions/2026-05-23-control-plane-openclaw-step2-sanitized-liveness-pass.md

Commit:

- d0b1206 docs: record OpenClaw sanitized liveness pass

## Sanitized evidence summary

- workspace_clean: true
- openclaw_gateway_port_18789_listen: true
- openclaw_browser_port_18791_listen: true
- openclaw_health_ok: true
- openclaw_health_status: live
- n8n_5678_http_status: 200
- classification: liveness_pass
- strict_pass_candidate: false
- n8n_ready: false
- pm34_unblocked: false
- real_worker_enabled: false
- codex_invoked: false
- workflow_40_41_modified: false
- secrets_captured: false

## Required preview interpretation

Workflow 40 may detect this plan and send the normal preview notification path.

Expected interpretation:

- CONTROL PLANE plan_detected
- Gate D plan file
- PM-21 bridge decision
- Risk: low
- Route: cursor-control-plane
- Approval required: no
- Bridge result: dryrunpass or equivalent preview-only result
- Worker: mock-worker
- Action: preview only, no Codex execution

## Hard boundaries

- Do not modify workflow 40.
- Do not modify workflow 41.
- Do not import or export n8n workflows.
- Do not invoke Codex.
- Do not enable a real worker.
- Do not claim strict pass.
- Do not unblock PM-34.
- Do not create docs/artifacts/openclaw.
- Do not record raw OpenClaw logs.
- Do not capture secrets, tokens, cookies, PATs, OAuth values, Telegram tokens, or bearer values.

## Expected next step after preview notification

Record the preview result and final OpenClaw boundary, then close the local OpenClaw gateway.
