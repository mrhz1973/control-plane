# V4 Tailscale architecture private route remediation V1 — Retry 1

## Result

- `TASK_REF=V4_TAILSCALE_ARCHITECTURE_PRIVATE_ROUTE_REMEDIATION_V1_RETRY1`
- `Classification=PASS`
- `BASE_HEAD=bce647989c243515a9b23f80ff38ab397db94ff8`
- `BRANCH=main`
- `TAILSCALE_ARCHITECTURE_PRIVATE_ROUTE=PASS`
- `TAILSCALE_ARCHITECTURE_PATH=/architecture`
- `TAILSCALE_ARCHITECTURE_TARGET=http://127.0.0.1:18793/architecture`
- `TAILSCALE_ARCHITECTURE_SURFACE=LIVE`
- `TAILSCALE_FUNNEL=NO`
- `EXISTING_TAILSCALE_ROUTES_PRESERVED=YES`
- `ARCHITECTURE_STOP_WORK_PRESERVED=YES`

## Preflight and sanitized Serve snapshot

After `git fetch origin`, `main`, local HEAD, and `origin/main` all matched
`bce647989c243515a9b23f80ff38ab397db94ff8`. The worktree retained the
intentionally dirty architecture implementation from the earlier STOP. The
other previously observed untracked/runtime artifacts were left untouched and
were not staged. No merge, rebase, cherry-pick, or staged work was present.

Read-only `tailscale status` identified the device as `asusdesktop`. The
pre-mutation Serve snapshot showed HTTPS active as **tailnet only**, with no
Funnel. Existing sanitized handlers were:

```text
/                                  -> http://127.0.0.1:18789
/dashboard                         -> http://127.0.0.1:18793/dashboard
/v1/status                         -> http://127.0.0.1:18793/v1/status
/v1/resources                      -> http://127.0.0.1:18793/v1/resources
/v1/diagnostics                    -> http://127.0.0.1:18793/v1/diagnostics
/v4/authorization/status           -> http://127.0.0.1:18792/v4/authorization/status
/v4/local-dev/dispatch-tick       -> http://127.0.0.1:18793/v1/tick
/v4/execution/opencode-local      -> http://127.0.0.1:18791
/v4/authorization/register-pending -> http://127.0.0.1:18792/v4/authorization/register-pending
/v4/resource-status/local-readonly -> http://127.0.0.1:18790
```

`/architecture` was absent before the mutation.

## CLI authority and exact mutation

`tailscale version` reported `1.102.3`. The local `tailscale serve --help`
confirmed the supported additive path flag `--set-path` and background mode
`--bg`. The only mutation executed was:

```text
tailscale serve --bg --set-path=/architecture http://127.0.0.1:18793/architecture
```

No identity, hostname, ACL, DNS, Funnel, firewall, VPS, certificate,
dispatcher, or existing Serve handler was changed.

## Post snapshot and exact diff

The post-mutation snapshot remained HTTPS **tailnet only** and contained the
same existing handlers plus exactly:

```text
/architecture                      -> http://127.0.0.1:18793/architecture
```

Deterministic comparison of the pre-existing handler map returned:

```text
Missing: none
Changed: none
Extra: none
OnlyArchitectureDelta: true
```

## HTTP validation

The local and private responses both returned HTTP 200 and the same bounded
SHA-256/content length:

```text
LOCAL      /architecture  200  sha256=0438a30c43b581a2f3590375805ada7c2b7874690524b18edbd9486a349fadca  bytes=40598
TAILNET    /architecture  200  sha256=0438a30c43b581a2f3590375805ada7c2b7874690524b18edbd9486a349fadca  bytes=40598
```

The private regression GETs also returned HTTP 200:

```text
/dashboard       200
/v1/status       200
/v1/diagnostics  200
/v1/resources   200
```

The dispatcher remained identity-aligned and loopback-only at
`127.0.0.1:18793`; no recycle was performed.

## Architecture work preservation

Fingerprints were captured before and after the Serve mutation. All matched:

| Scope | SHA-256 |
|---|---|
| `tools/local-dev-dispatcher-dashboard-v1.html` | `27214b8fb5c192a98356fe2114e1379c93d7424675ac581f8a0010953befac39` |
| `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` | `2469d694ce16140cb7a079840a0d2a851941a0a5c1a5bdecfa14a1d8dbbf2296` |
| `tools/local-dev-dispatcher-architecture-map-v1.html` | `0438a30c43b581a2f3590375805ada7c2b7874690524b18edbd9486a349fadca` |
| `tests/local-dev-architecture-web-map-draft-v1/` | `c36ff15213b44ec0b2ba3f1d4fc104abff5ec0e42e488c8a1e9369e3d3b8fad8` |

The architecture implementation and test work was not modified, staged, or
included in this remediation commit. Previously observed untracked runtime
artifacts were neither staged nor removed.

## Safety and persistence

- `TAILSCALE_ARCHITECTURE_SURFACE=LIVE`
- `TAILSCALE_FUNNEL=NO`
- `PUBLIC_EXPOSURE=NO`
- `MANUAL_TICKS=0`
- `QUEUE_MUTATIONS=0`
- `MODEL_INFERENCE_CALLS=0`
- `ARCHITECTURE_STOP_WORK_PRESERVED=YES`

Only this report and the two canonical runtime documents were staged. No
Qwen, GLM, Codex, Cursor, Hermes browser, ChatGPT Web, n8n, VPS, or production
execution occurred.

`NEXT=V4_CONTROL_PLANE_ARCHITECTURE_WEB_MAP_DRAFT_V1_RETRY1`.
