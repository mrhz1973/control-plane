# V4 Cursor ACP ask_question exposure qualification V1

**TASK_REF:** `V4_CURSOR_ACP_ASK_QUESTION_EXPOSURE_QUALIFICATION_V1`
**Classification:** `QUALIFIED NEGATIVE — ASK_QUESTION_EXPOSURE_SUPPORTED=NO (installed official runtime; vendor-side gate)`
**Date (Europe/Rome):** 2026-09-12
**Repository:** `mrhz1973/control-plane`
**Branch:** `main`
**BASE_HEAD:** `726734d5e37057736be689ba51717626a3a18e0e`

## Markers

```text
ASK_QUESTION_EXPOSURE_SUPPORTED=NO
BLOCKER_CLASS=VENDOR_SERVER_SIDE_TOOL_GATE (model-facing AskQuestion tool not
  registered in ACP-surface sessions by the official runtime; no local
  enablement path exists in the installed official version)
INSTALLED_VERSION=2026.09.10-fd3934a (agent about: "up to date")
OFFICIAL_CURRENT_BEHAVIOR=unsupported (installed == latest official; behavior
  observed IS current official behavior)
VENDOR_RUNTIME_CHANGE_REQUIRED=YES
PRODUCTION_CHANGED=NO
ACP_SESSION_IDENTITY=PASS (real sessions, ids captured, sanitized)
ASK_QUESTION_EVENT=FAIL (never emitted server→client in any configuration tried)
```

## Evidence order followed

### 1. Local installed CLI help and bundle/runtime behavior

- `agent acp --help`: no options beyond `-h, --help`. No mode, flag, or
  capability switch exists on the ACP subcommand.
- Full `initialize` response captured (probe `tools/v4-acp-ask-question-capability-probe-v1.mjs`):
  `agentCapabilities = {loadSession:true, mcpCapabilities:{http:true,sse:true},
  promptCapabilities:{audio:false,embeddedContext:false,image:true},
  sessionCapabilities:{list:{}}}`. **No capability field negotiates ask/question
  behavior.** `authMethods=[cursor_login]`.
- Full `session/new` response captured: modes are exactly `agent` / `plan` /
  `ask`; config options are exactly `mode` and `model`. **No AskQuestion-related
  session parameter or config option exists.**
- `session/set_mode` cycled through `agent`, `plan`, `ask` (mode updates
  confirmed via `current_mode_update`); in each mode the agent, asked to list
  every available tool, returned no tool list containing any ask/question tool.
- Bundle analysis (read-only, installed at
  `%LOCALAPPDATA%\cursor-agent\versions\2026.09.10-fd3934a\`):
  - `8096.index.js` (ACP adapter): server→client extension surface is
    `cursor/ask_question`, `cursor/create_plan`, `cursor/update_todos`,
    `cursor/task`, `cursor/generate_image` (constants in `src/acp/types.ts`);
    `extMethod` is a generic pass-through; no client-side enablement knob.
  - `8412.index.js` (`src/acp/agent-session.ts` +
    `src/acp/interaction-handlers/ask-question-handler.ts`): when the model DOES
    produce an AskQuestion interaction query, the handler forwards it to the
    client via `cursor/ask_question` and falls back to
    `session/request_permission` on `-32601`/Unimplemented. Both paths are
    implemented by our driver. The bundle contains **handling** code only — no
    **registration** of a model-facing AskQuestion tool.
  - `index.js`: the model-facing tool name (any casing of ask_question /
    AskQuestion as a `name:` literal) is absent; only proto types
    (`agent.v1.AskQuestionAsync`, `AskQuestionInteractionQuery`,
    `AskQuestionCompletionAction`, conversation-state plumbing
    `completedAskQuestionToolCallIds`) and a statsig defaults blob exist.
  - Statsig flag `ask_question_all_modes:!0` exists ONLY inside the local
    defaults blob (`src/statsig.ts` feed); **no consumer reads it anywhere in
    the shipped bundles** — the gating decision is server-side (per-request
    tool roster delivered by Cursor's backend), not a locally flippable flag.
  - `CURSOR_AGENT_*` environment variables enumerated (17): none related to
    ask/question/feature enablement.
  - The ACP surface is set at launch (`surface:"acp"===i[0]?"acp":"cli"`) and
    propagated as `x-cursor-client-type: acp` request header + optional
    host-client metadata. No local code path adds the tool based on it.
- Prior E2E (V2 task, 3 attempts) already showed the model explicitly reporting
  "The AskQuestion tool is not among them / not available in this environment"
  in default mode, and again after an explicit single bounded repair nudge.

### 2. Official Cursor documentation

- `https://cursor.com/docs/cli/acp` (fetched in full): `cursor/ask_question` is
  a **blocking client-bound extension method** — "The agent waits for a
  response before continuing. Your client must reply with a JSON-RPC response."
  Request/response schemas match the driver implementation exactly
  (`{toolCallId,title?,questions[{id,prompt,options[{id,label}],allowMultiple?}]}` →
  `{outcome: answered|skipped|cancelled}`). The docs describe ONLY the client
  obligation (implement the handler); **they document no client capability,
  initialization parameter, mode, or configuration that causes the agent/model
  to emit the question.** Request flow in docs: initialize → authenticate →
  session/new → session/prompt → handle updates → handle
  `session/request_permission` → optional cancel — no ask-enablement step.
- `agent about`: installed version `2026.09.10-fd3934a` is the latest official
  ("up to date"), so docs and installed behavior are the same generation.

### 3. Official Cursor source/artifacts

- No public source repository for the agent CLI was found; the installed
  minified bundles (read-only inspection above) are the authoritative shipped
  artifacts and were used instead. Changelog (cursor.com/changelog, fetched in
  full, through 2026-09-10) contains no mention of ask_question exposure,
  ACP question tools, or related enablement.
- npm registry check: `@cursor/cli@1.0.3` / `@cursor/agent@1.0.0` exist but are
  unrelated legacy name-squatters (v1.x from 2023, not the official CLI, whose
  distribution channel is the installer used here). No official newer artifact.

### 4. Community workarounds

Not used (per task law). Third-party pages found (Zed agent page, integration
guides) only restate the same client-handler contract; one discussion notes
generic ACP interactive-question limitations in clients. None claims a
supported enablement path. Marked non-authoritative and not followed.

## Why negative (precise classification)

The AskQuestion **server→client bridge** exists and is officially documented;
the AskQuestion **model-facing tool** is not registered in sessions served over
the ACP surface by the installed official runtime. The registration decision is
not locally flippable: no CLI flag, env var, mode, session parameter,
capability bit, or shipped-bundle consumer of the relevant statsig flag exists.
All observed behavior matches the latest official version, so this is current
official behavior, not a stale-install artifact.

## What this qualification does NOT claim

- It does not claim the bridge is broken: with a cooperating client the
  handler contract is implementable (our driver implements request + permission
  fallback).
- It does not claim the tool is unavailable on other surfaces: the Cursor
  desktop app and cloud agents are out of scope and were not tested.
- It does not authorize any workaround: vendor binary patching, monkey-patching,
  alternate tool invention, and local-UI substitution are all forbidden and
  none was attempted.

## Hard walls respected

No Telegram changes, no production dispatch, no n8n/VPS mutation, no OpenClaw,
no public exposure, no secret persistence, no vendor binary modification, no
hidden fallback, no new gate authority, no dashboard work. Read-only bundle
inspection + bounded live ACP sessions only (each killed cleanly; no files
touched by agents; one harmless list-tools prompt per mode).

## Consequence for the mission chain

`V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2`'s blocker is now
canonically classified: **VENDOR_SERVER_SIDE_TOOL_GATE** — resolving it
requires a Cursor runtime change (or an architecture selection that does not
depend on the model-facing AskQuestion tool), which must be decided in a
separate task; it must not be improvised here. Per contract, STOP cleanly with
this negative capability result persisted.

## Files

- `tools/v4-acp-ask-question-capability-probe-v1.mjs` — bounded read-only
  capability probe (initialize/session-new capture + per-mode tool listing)

**End of negative qualification evidence.**
