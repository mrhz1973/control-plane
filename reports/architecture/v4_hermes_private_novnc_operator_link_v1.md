# V4 Hermes private noVNC operator link V1

## Result

- `TASK_REF=V4_HERMES_PRIVATE_NOVNC_OPERATOR_LINK_V1`
- `RESULT=PASS`
- `BASE_HEAD=c839a8d49d2b34db92a57b22e90391d6485f7df0`
- `BRANCH=main`
- `DISPATCHER_RUNTIME_REVISION=ALIGNED`

## VPS read-only qualification

The private SSH alias `ionos-n8n-new` was observed without changing the VPS:

- `hermes-xvfb=active`
- `hermes-chromium=active`
- `hermes-x11vnc=active`
- `hermes-novnc=active`
- loopback `http://127.0.0.1:6080/vnc.html` returned HTTP `200`
- CDP loopback `127.0.0.1:9222` returned HTTP `200`
- listener bindings for `9222`, `5900`, and `6080` were loopback-only
- bounded public TCP probes to `31.70.139.73:{9222,5900,6080}` were not reachable

The collector persists only bounded states, HTTP status, fixed private topology,
and sanitized service-state codes. It does not persist response bodies, listener
addresses, cookies, tokens, OAuth data, credentials, or browser storage.

## Private operator topology

```text
browser/operator localhost:16080
  -> SSH private tunnel
  -> VPS localhost:6080 (noVNC)
  -> Hermes Chrome display
```

Canonical client URL: `http://127.0.0.1:16080/vnc.html`.

Reference command shown to the operator only:

`ssh -N -L 16080:127.0.0.1:6080 ionos-n8n-new`

No automatic tunnel, Scheduled Task, service, launcher, login, or browser
automation was created. The local bounded GET probe classified the current
client tunnel as `INACTIVE`; VPS noVNC availability does not imply a client
localhost tunnel. The Tailscale dashboard being reachable does not imply a
localhost tunnel on a remote browser device.

## Dashboard delta

The Hermes card in `Chi sta facendo cosa` preserves `HERMES = ORCHESTRATORE /
BRIDGE` and distinguishes:

- `Chrome Hermes`: `Disponibile`
- `noVNC VPS`: `Disponibile`
- `Tunnel noVNC`: `Non attivo`
- `🖥 Apri Chrome Hermes`: opens only the canonical client-local URL in a new tab
- private access details: VPS/local endpoints, SSH transport, manual command,
  and `Nessuna esposizione pubblica`

The dashboard remains read-only, retains `CHAIN_OF_THOUGHT_DISPLAY=NO`, exposes
no raw CDP, and adds no send/submit capability.

## Runtime smoke

After the exact identity check, only `ControlPlane-V4-LocalDevDispatcher` was
recycled. GET smoke results:

- local `/dashboard`, `/v1/status`, `/v1/diagnostics`, `/v1/resources`: HTTP `200`
- private Tailscale `/dashboard`: HTTP `200`
- local and Tailscale dashboard SHA-256: identical
- `HERMES_NOVNC_OPERATOR_LINK=PASS`
- `HERMES_NOVNC_VPS=AVAILABLE`
- `HERMES_NOVNC_PRIVATE_URL=http://127.0.0.1:16080/vnc.html`
- `HERMES_NOVNC_TUNNEL_STATE=INACTIVE`
- `HERMES_NOVNC_PUBLIC_EXPOSURE=NO`
- `HERMES_NOVNC_AUTO_TUNNEL=NO`
- `TAILSCALE_DASHBOARD_SURFACE=LIVE`

## Validation

- focused noVNC operator-link test: `FOCUSED_NOVNC_TESTS=PASS`
- Hermes/OpenCode operator visibility: `FOCUSED_TESTS=PASS`
- Italian labels and quota/reset regressions: `FOCUSED_TESTS=PASS`
- dispatcher service: `69 passed, 0 failed`
- resource observability integrity: `7/7 focused checks passed`
- registry-v2: `76/76`
- `git diff --check`: PASS
- `MANUAL_TICKS=0`
- `QUEUE_MUTATIONS=0`
- `MODEL_INFERENCE_CALLS=0`

No `/v1/tick`, queue/receipt, n8n, VPS, firewall, systemd, Tailscale Serve,
Funnel, production, Qwen, GLM, Codex, ChatGPT Web, or credential mutation
occurred.
