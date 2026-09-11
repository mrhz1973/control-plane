# V4 Control Plane interactive infographic V1

## Result

- `TASK_REF=V4_CONTROL_PLANE_ARCHITECTURE_INTERACTIVE_INFOGRAPHIC_V1`
- `Classification=PASS`
- `BASE_HEAD=65d451ccdebb3a4efadd7d928dacd52c1aaae248`
- `ARCHITECTURE_ROUTE=/architecture`
- `COMPONENT_INSPECTOR=PASS`
- `ROLE_FILTER=PASS`
- `ROUTE_EXPLORER=PASS`
- `CURRENT_STATE_OVERLAY=PASS`
- `TASK_FLOW_INTERACTION=PASS`
- `HERMES_PRESENT=YES`
- `HERMES_ROLE=ORCHESTRATORE_BRIDGE`
- `AVAILABLE_ACTIVE_SEMANTICS=PRESERVED`
- `ARCHITECTURE_READ_ONLY=YES`
- `CHAIN_OF_THOUGHT_DISPLAY=NO`
- `TAILSCALE_ARCHITECTURE_SURFACE=LIVE`

## Scope and preservation

The existing `/architecture` page was evolved in-place from the “CITTÀ
CONTROL PLANE” map into a vanilla-JavaScript interactive infographic. The
Control Plane remains the visual centre, Hermes remains explicitly
`ORCHESTRATORE / BRIDGE`, and the dashboard remains the operational console.
No external framework, dependency, second architecture page, route change, or
runtime policy change was introduced.

## Interactive surfaces

- The component inspector opens from the city landmarks and component dock.
  It presents the bounded role and seven evidence fields: `FUNZIONE`,
  `COMPONENTE REALE`, `PROGRAMMA / SERVIZIO`, `DOVE GIRA`, `MODELLO /
  HARNESS`, `AUTHORITY`, and `STATO ATTUALE`.
- Role filters cover MODELLO, HARNESS, CONTROLLER / LANE, ORCHESTRATORE, TOOL,
  INFRASTRUTTURA, AUTHORITY, HUMAN GATE, and OSSERVABILITÀ. Non-selected
  components are attenuated without changing the city layout.
- The route explorer highlights the bounded conceptual paths for Cursor,
  Qwen/OpenCode, Codex subscription, Hermes/ChatGPT Web, and n8n/private
  infrastructure. Route status remains separate from active execution.
- The current-state overlay reads only existing GET endpoints
  `/v1/status`, `/v1/diagnostics`, and `/v1/resources`. It renders bounded
  values and uses `NON OSSERVATO` when evidence is absent; it never displays
  raw state or an execution control.
- The 01–10 task flow is keyboard-addressable and clickable. The reset action
  clears filter, route, inspector, state overlay, and flow selection.
- The interaction layer is responsive, focus-visible, and usable without
  browser/profile mutation. No chain of thought, prompt, response, cookie,
  token, credential, or public browser surface is present.

## Validation

Focused and regression suites:

- interactive infographic: `6/6`;
- preserved architecture web map: `8/8`;
- dispatcher service: `69/69`;
- registry v2: `76/76`;
- `git diff --check`: `PASS`.

Runtime side-effect counters remained bounded:

```text
MANUAL_TICKS=0
QUEUE_MUTATIONS=0
MODEL_INFERENCE_CALLS=0
CANDIDATE_EXECUTED=NO
PRODUCTION_DISPATCH=NO
```

No `/v1/tick`, queue execution, model inference, Qwen/GLM/Codex/Cursor
execution, Hermes browser interaction, ChatGPT Web send, VPS mutation, n8n
mutation, Tailscale mutation, noVNC activation, or public exposure occurred.

## Live surfaces

The exact canonical Scheduled Task `ControlPlane-V4-LocalDevDispatcher` was
identity-checked as the only matching task and bounded-recycled after the
focused tests. The resulting dispatcher process was PID `36080`, with one
listener on `127.0.0.1:18793` and the exact repository entrypoint.

Local GET smoke returned HTTP 200 for `/dashboard`, `/architecture`,
`/v1/status`, `/v1/diagnostics`, and `/v1/resources`. The existing private
Tailscale route returned HTTP 200 for the same five paths. Local and private
`/architecture` both returned `68770` bytes with SHA-256:

```text
bbbeab8a8a2f038988c6b43c8cca2a7ae02c1370bc459efcab4b83152d3bd01f
```

`tailscale serve status` remained tailnet-only with Funnel NO. The Serve
configuration was observed read-only and was not changed in this task.

## Persistence

The implementation, focused test, evidence, and canonical runtime documents
are staged explicitly for the PASS commit. Unrelated pre-existing untracked
runtime artifacts remain unstaged. The next real frontier is:

`V4_HERMES_CONTROLLER_OVERHEAD_DIRECT_VS_WEB_BENCHMARK_V1`.
