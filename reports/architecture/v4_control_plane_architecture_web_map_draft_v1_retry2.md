# V4 Control Plane architecture web map draft V1 — Retry 2

## Result

- `TASK_REF=V4_CONTROL_PLANE_ARCHITECTURE_WEB_MAP_DRAFT_V1_RETRY2`
- `Classification=PASS`
- `BASE_HEAD=a05d51d2ebadda910985034887293fdc5d53b4c4`
- `CONTROL_PLANE_ARCHITECTURE_WEB_MAP_DRAFT=PASS`
- `CONTROL_PLANE_ARCHITECTURE_ROUTE=/architecture`
- `HERMES_ARCHITECTURE_MAP_PRESENT=YES`
- `HERMES_ROLE=ORCHESTRATORE_BRIDGE`
- `MODEL_HARNESS_CONTROLLER_TAXONOMY=EXPLICIT`
- `DASHBOARD_ARCHITECTURE_LINK=PASS`
- `TAILSCALE_ARCHITECTURE_SURFACE=LIVE`
- `ARCHITECTURE_PRIVATE_ROUTE=PASS`
- `DISPATCHER_RUNTIME_REVISION=ALIGNED`

## Scope and authority

This retry resumed the already implemented static architecture map after the
private Tailscale route had been qualified. The four preserved architecture
scopes matched their persisted fingerprints before testing. No HTML/CSS or
dispatcher correction was needed. The map remains a read-only explanatory
surface; the dashboard remains the operational console and GitHub remains the
repository authority.

## Visual and taxonomy validation

The existing page at `GET /architecture` preserves the “CITTÀ CONTROL PLANE”
concept with the Control Plane as the visual centre. It distinguishes:

- Control Plane as governance, routing, priority, and state;
- GitHub as SOURCE OF TRUTH / AUTHORITY;
- Operatore as decision and Human Gate;
- Cursor as IDE / HARNESS / AGENT SURFACE, not a model;
- Codex subscription as CONTROLLER / SUBSCRIPTION LANE, distinct from ChatGPT
  App / Web;
- Qwen as MODELLO LOCALE and GLM as governed commercial model/lane;
- OpenCode as HARNESS / ESECUTORE LOCALE;
- Hermes as the primary ORCHESTRATORE / BRIDGE;
- ChatGPT App / Web as cognitive/operator surface, not a resource quota card;
- VPS, local machine, Tailscale, n8n, and dispatcher as their distinct
  infrastructure, transport, workflow, and observability roles.

The page includes the complete 01–10 task flow, PASS/STOP/RETRY/Human Gate
branches, the required category legend, bounded details cards with the seven
component fields, and responsive desktop/mobile layout rules. The Hermes route
is explicitly conceptual/qualified rather than an assertion that every
combination is production-active. noVNC remains a small private-access status
note: VPS available, client tunnel not active, public exposure NO.

## Focused and regression validation

The preserved focused suite passed `8/8`. Required regressions passed:

- dispatcher service: `69/69`;
- Hermes/OpenCode operator visibility: `PASS`;
- private noVNC operator link: `PASS`;
- Italian dashboard labels: `PASS`;
- resource observability integrity: `7/7`;
- registry v2: `76/76`;
- `git diff --check`: `PASS`.

No `/v1/tick`, queue mutation, model inference, Qwen/GLM/Codex/Cursor model
execution, Hermes browser interaction, ChatGPT Web send, or external
production mutation occurred.

## Runtime and private surface

After an exact identity check, only `ControlPlane-V4-LocalDevDispatcher` was
bounded-recycled. The new process was PID `12996`, with the dispatcher still
bound only to `127.0.0.1:18793`.

Local GET smoke returned HTTP 200 for `/dashboard`, `/architecture`,
`/v1/status`, and `/v1/resources`. The private Tailscale GETs returned HTTP
200 for `/architecture`, `/dashboard`, `/v1/status`, `/v1/diagnostics`, and
`/v1/resources`.

Local and private `/architecture` both returned 40598 bytes with the same
SHA-256:

```text
0438a30c43b581a2f3590375805ada7c2b7874690524b18edbd9486a349fadca
```

The private route was not modified in this task; it was read-only verified as
already live. Funnel remains NO and the private surface remains tailnet-only.

## Persistence

The architecture implementation scopes were explicitly staged together with
this report and the two canonical runtime documents. No unrelated untracked
runtime artifact was staged. The next frontier is:

`V4_CONTROL_PLANE_ARCHITECTURE_INTERACTIVE_INFOGRAPHIC_V1`.
