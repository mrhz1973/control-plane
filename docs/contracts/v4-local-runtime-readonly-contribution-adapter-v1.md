# V4 local runtime read-only contribution adapter v1

**Repository:** `mrhz1973/control-plane`
**Version:** `v4-local-runtime-readonly-contribution-adapter-v1`
**Runtime authorized by this document:** one bounded READ-ONLY diagnostic only

## 0. Purpose

First real producer of `v4-resource-status-contribution-v1` observations for the
local execution pair `qwen_local` + `opencode`. The producer only gathers
read-only local evidence and emits one contribution. It never composes
RESOURCE_STATUS; `compose-v4-resource-status-control-plane-v1.mjs` remains a
separate downstream consumer.

Tool: `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`

## 1. Hard runtime boundary

The producer MUST NEVER:

- start/restart/stop/kill llama-server, Ollama, Blender, Cursor, OpenCode;
- run `opencode --version`, `opencode run --help`, `opencode run`;
- call Qwen `/v1/responses`, `/v1/chat/completions`, or any inference endpoint;
- call `ensureQwenLocalReady` or `collectQwenLocalResourceStatus`;
- invoke `tools/probe-opencode-local-v1.mjs` (it spawns OpenCode);
- perform readiness restoration or launcher invocation.

Mandatory result properties: `launch_performed=false`, `generation_calls=0`.

## 2. Read-only evidence

Qwen host/port/server identity come from `configs/resources/qwen-local-runtime.json`
(canonically `127.0.0.1:8080`, `llama-server`). No alternate endpoint is hardcoded.

Live diagnostics use exactly ONE PowerShell process containing two fixed
read-only samples separated by a bounded delay (~1.2s). Allowed cmdlets:
`Get-Process`, `Get-NetTCPConnection` only. Process `CommandLine`, WMI command
lines, environment blocks, credential stores, browser storage, OpenCode
auth/config and Qwen secret files are forbidden. PIDs are resolved to process
names inside PowerShell and never leave it. Raw snapshots are ephemeral; only
bounded classifications are persisted.

## 3. Occupancy classifier

`classifyQwenSharedRuntime(snapshotA, snapshotB, runtimeConfig)` is pure and
returns exactly one of:

- `QWEN_READY_IDLE` — canonical listener exists in both samples; exactly one;
  owner resolves to the configured llama-server identity; no established
  non-server client on the configured port in either sample; no conflicting
  additional inference runtime; unambiguous ownership.
- `QWEN_BUSY_SHARED_RUNTIME` — canonical listener exists and an ESTABLISHED
  client connection to the configured port is observed from a process other
  than the listener owner in either sample. Client identity (Blender, Cursor,
  OpenCode, MCP, benchmark) does not need to be resolved.
- `QWEN_NOT_RUNNING_SAFE_TO_START` — no canonical listener, no llama-server
  process, no conflicting local inference runner, diagnostics complete.
  Informational only: still emits `available=false`; authorizes nothing.
- `QWEN_OCCUPANCY_UNCERTAIN` — every ambiguous state: diagnostics incomplete,
  multiple listeners, unresolved/unexpected owner, contradictory samples,
  llama-server without listener, conflicting inference runtime present, or
  insufficient evidence. Never upgraded to READY.

Process-name correlation recognizes `llama-server`, `ollama*`, `blender`,
`cursor`, `node`, `python*`, `powershell`. Blender/Cursor/node/python presence
alone never implies BUSY; they matter only when correlated with the canonical
Qwen socket or another deterministic inference-runtime signal.

## 4. Qwen mapping

`QWEN_READY_IDLE`:

```json
{"available": true, "quota_remaining": {"value": null, "unit": "unlimited"},
 "reset_at": null, "cost_mode": "free", "location": "local",
 "evidence": {"kind": "qwen_occupancy", "classification": "QWEN_READY_IDLE",
              "launch_performed": false, "generation_calls": 0}}
```

BUSY / UNCERTAIN / NOT_RUNNING: `available=false`, `quota_remaining
{"value":null,"unit":"unknown"}`, same evidence shape with the exact
classification.

## 5. OpenCode static evidence

No OpenCode process is spawned. Filesystem metadata only:

- `%APPDATA%\npm\opencode.cmd` shim existence;
- `opencode-ai/package.json` presence and `version`;
- package `bin` entrypoint existence.

`available=true` only when all static evidence is consistent AND version is in
the already-proven 1.18.x family → `OPENCODE_STATIC_DISPATCH_READY`.

Otherwise fail-closed with bounded classifications:
`OPENCODE_STATIC_INSTALL_UNAVAILABLE`, `OPENCODE_STATIC_VERSION_UNVERIFIED`,
`OPENCODE_STATIC_EVIDENCE_UNCERTAIN`. Ambiguity is never resolved by launching
the CLI.

## 6. Contribution envelope

Exactly `qwen_local` + `opencode`; `source=local_probe`;
`producer_id=v4-local-runtime-readonly-v1`; `produced_at` = evaluation time;
stable non-empty `contribution_id`. No `reserve_floor`, no process list, no
socket list, no PIDs, no executable paths, no raw PowerShell output, no secrets.

## 7. Injection seams

`classifyQwenSharedRuntime`, `inspectOpenCodeStatic`,
`buildLocalRuntimeContribution` are pure. Diagnostic gathering is injectable;
tests use synthetic evidence and never invoke PowerShell. Test-only CLI
injection flags (`--diagnostics-b64`, `--opencode-fs-b64`) replace live
gathering; they emit data only and authorize nothing.

## 8. Next

`V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_AUTHORING` (GPT-Web-owned).
