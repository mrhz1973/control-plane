# Cursor ACP AskQuestion vendor-limit independent review V1

TASK_REF: `V4_CURSOR_ACP_ASK_QUESTION_VENDOR_LIMIT_INDEPENDENT_REVIEW_V1`

Execution surface: Codex desktop. Date: 2026-09-12 (UTC).
Repository: `mrhz1973/control-plane`, branch `main`.
BASE_HEAD: `b556109c467fce0d8b11d0b8ad4c0b4236bf1ded`.
Precheck: fetched origin; HEAD = origin/main = expected base; tracked worktree clean.

## Result and limits

**CONFIRMED_NEGATIVE_REFINED**: no supported, successful local enablement was
found. A fresh, bounded Plan-mode test on the current official Windows build
and selected Composer 2.5 Fast model emitted no `cursor/ask_question` request.
The previous categorical attribution to a vendor server-side tool gate is
**not independently established**. Neither a mandatory binary update nor a
mandatory backend change follows from the available evidence.

The negative is operational and bounded to the inspected build, documented
configuration surface, and tested account/model. It is not proof of absence
across all accounts, all 38 advertised models, or future backend rollouts.
The requested YES/NO value for `VENDOR_RUNTIME_CHANGE_REQUIRED` cannot be
assigned honestly: failure to find a supported path establishes neither that
a vendor runtime change is necessary nor that it is unnecessary.

```text
RESULT=CONFIRMED_NEGATIVE_REFINED
INDEPENDENT_REVIEW=CONFIRMED
ASK_QUESTION_EXPOSURE_SUPPORTED=NO
SUPPORTED_ENABLEMENT_PATH=NOT_FOUND
ASK_QUESTION_EVENT=FAIL_NOT_EMITTED
ACP_SESSION_IDENTITY=PASS
BLOCKER_CLASS=ACP_ASK_QUESTION_NOT_EMITTED_SUPPORTED_ENABLEMENT_UNPROVEN
VENDOR_SERVER_SIDE_TOOL_GATE=NOT_PROVEN
VENDOR_RUNTIME_CHANGE_REQUIRED=NOT_PROVEN
PRODUCTION_CHANGED=NO
NEXT=V4_CURSOR_ACP_EXTERNAL_HUMAN_GATE_ARCHITECTURE_SELECTION_V1
```

`INDEPENDENT_REVIEW=CONFIRMED` confirms the bounded negative above, not the
unqualified server-side causal explanation in the predecessor report.
No OVERTURNED or Telegram E2E result is claimed.

## Four distinct propositions

| Proposition | Independent evidence | Conclusion |
|---|---|---|
| Client-facing handler exists | Official ACP docs and shipped interaction handler; forwards an incoming interaction query to the extension method | YES |
| Model-facing AskQuestion is registered | No authoritative model tool roster exposed by discovery; one real prompt produced no event and reported unavailability | NOT_PROVEN; not observed in this test |
| Supported local enablement exists | CLI help, ACP/session configuration, bundle options, official references, and Plan-mode candidate tested | None found that makes the primitive work |
| Vendor server-side gate causes the absence | ACP request middleware identifies its surface, but neither backend registration logic nor a gate decision was observed | Plausible hypothesis, NOT_PROVEN |

## Independent discovery

- Local `agent --version`, `agent --help`, `agent acp --help`, and sanitized
  `agent about --format json` were checked. Observed version and latest official
  version both equal `2026.09.10-fd3934a`; latest status is `up_to_date`.
  Authentication was available. No update, login, or credential copying occurred.
- A direct child process used the official bundled `node.exe` and `index.js acp`,
  as the installed launcher does. Metadata-only discovery created one empty
  project session and accepted `session/set_mode` for plan, ask, and agent.
  It sent zero prompts and received zero server requests.
- `initialize` returned protocol 1, loadSession=true, MCP HTTP/SSE support,
  prompt audio=false/embeddedContext=false/image=true, session list support,
  and `cursor_login`. No AskQuestion negotiation was advertised.
- `session/new` returned modes agent/plan/ask, config IDs mode/model, and 38
  available models. Shipped configuration code also supports model parameters
  when the client requests `_meta.parameterizedModelPicker`; therefore mode/model
  is the observed default list, not an exhaustive list for every client.
- The shipped ACP config store retains `selectedModelVariantId`. The generic
  CLI config reference documents model, permissions, display, network, and
  related preferences, without an AskQuestion enablement setting.
- Supported root launch options include mode/model/plan and generic headers.
  Permission approval, MCP registration, custom headers, or impersonating
  another client surface do not constitute a documented AskQuestion enablement
  contract. No such substitution was attempted.

Metadata-only session identity SHA256:
`8f97eb37d38c9db1d04c02d8f1aaf4d7721653e45f010772944100406814e5de`.

## Adversarial findings against the previous evidence

### The prior tool-list probe drops the actual streamed answer

`tools/v4-acp-ask-question-capability-probe-v1.mjs:39` retains only
`current_mode_update`. Line 59 extracts text from `session/prompt.result.messages`.
ACP assistant text arrives as `session/update` / `agent_message_chunk`; the
prompt result supplies the stop reason. This was independently observed live.
Consequently an empty TOOLS output from that script cannot establish an empty
or AskQuestion-free tool roster in any mode.

A deterministic, synthetic parser counterexample delivered streamed text
`AskQuestion` and result `{stopReason:"end_turn"}`. The existing extraction
returned an empty string. This is a test of the probe's interpretation only;
it is explicitly not an actual AskQuestion event. The probe also does not
respond to incoming server requests or implement a wall-clock timeout. It was
reviewed, not rerun or modified.

### Shipped development overrides exist, but are not supported enablement

The entire installed top-level JavaScript bundle set was searched, including
all files containing AskQuestion-related strings. Contrary to a narrow search
of `CURSOR_AGENT_*`, the distribution contains `--statsig-overrides` and
`CURSOR_STATSIG_OVERRIDES` in `index.js`.

The option description explicitly labels it Dev-only and hides it from help.
Tracing the startup function's import shows `S` is `./src/constants.ts`;
startup passes `S.Cu` to the override enablement setter. In this build `Cu`
exports `s`, initialized to false. The override module clears overrides when
disabled. This is positive code evidence against treating the hidden option
as a supported user switch. No override or development header was applied.

The two flag names `ask_question_all_modes` and
`ask_question_durable_delivery` each occur once, in defaults in `index.js`.
The ACP adapter forwards AskQuestion interaction queries and implements the
permission fallback, while `agentClient.run` delegates the conversation run
through the backend client. These observations establish transport/plumbing,
not the actual backend tool roster. Absence of a local tool-name literal or
local flag consumer cannot by itself establish a server-side gate.

## One real attempt to falsify the negative

The official CLI describes Plan mode as supporting clarifying questions, and
the official ACP documentation supports this mode. This supplied a concrete
candidate for a bounded proof despite the predecessor's defective tool-list
capture. It was not presumed successful before execution.

- Created a second fresh session for the primitive proof in an empty temporary
  workspace. Used the existing selected model `composer-2.5[fast=true]`.
- Called `session/set_mode` with plan. This changes only that session's mode;
  no global configuration was edited and no model switch was performed.
- Sent exactly one prompt asking for the native AskQuestion tool, one question
  ID `review_choice`, and options `alpha` / `beta`. It prohibited filesystem,
  shell, browser, MCP, plan-file, and alternate-tool actions. If unavailable,
  it required the exact terminal marker `ASK_QUESTION_UNAVAILABLE`.
- The client was prepared to answer only a validated real `cursor/ask_question`
  request with the fixed synthetic choice alpha. Other permissions were denied;
  unknown requests were rejected. No response was synthesized in the absence
  of a server request. Client RPC response IDs were handled separately from
  incoming request methods. Thought text was ignored and not persisted.
- A 90-second watchdog bounded the attempt. It completed normally in about
  ten seconds, returning `stopReason=end_turn` and assistant text
  `ASK_QUESTION_UNAVAILABLE`.

```text
session_id_sha256=d5d4a56081592bd441a705e335a4b735fcfc996ee3b7997ff5fbd8a95c550ab9
mode=plan
current_model_id=composer-2.5[fast=true]
session_prompt_calls=1
cursor_ask_question_requests=0
synthetic_answers_sent=0
other_server_requests=0
all_session_update_ids_matched=YES
stop_reason=end_turn
assistant_text=ASK_QUESTION_UNAVAILABLE
temporary_workspace_files_at_end=0
```

No retry, tool-list inference campaign, or alternate model campaign followed.
The child process was terminated. This result independently reproduces the
symptom; the model's unavailability statement is not a registry dump or an
authoritative account of the vendor's gating logic.

## Artifact integrity and official references

Installed distribution directory:
`%LOCALAPPDATA%/cursor-agent/versions/2026.09.10-fd3934a/`.
SHA256 values matched before and after the live probe:

| File | SHA256 |
|---|---|
| index.js | d8e5310ef9998954e2d59839ee0eea088cc95c4de7db0b6dc0a16d93d4d80cee |
| 8412.index.js | 77adbc3c54c334a389b8b36b322325ffc2a58e102be7060347704bbc3a23c292 |
| 8096.index.js | c552e0e942f5650dc7e4267f6265923aebe1176f195ec95eed18934de80c7003 |

Useful shipped module anchors: `src/acp/cursor-acp-agent.ts`,
`src/acp/agent-session.ts`, `src/acp/interaction-handlers/ask-question-handler.ts`,
`src/acp/config-store.ts`, `src/statsig-overrides.ts`, `src/constants.ts`.
These are embedded module identifiers, not a claim of public vendor source.

Official references checked on 2026-09-12:

- [ACP](https://cursor.com/docs/cli/acp): extension request/response and session contracts.
- [CLI overview](https://cursor.com/docs/cli/overview): Plan-mode candidate.
- [Configuration](https://cursor.com/docs/cli/reference/configuration): documented settings.
- [Parameters](https://cursor.com/docs/cli/reference/parameters): supported launch controls.
- [CLI changelog](https://cursor.com/docs/cli/changelog): no supported AskQuestion exposure switch found.

Forum results were treated as leads, not authoritative proof of ACP support
or a universal vendor restriction. No third-party workaround was applied.

## Persistence and next

This is a completed independent review with a bounded negative capability
result and an unresolved causal attribution, not a failed implementation.
Follow the existing Codex review convention (`codex-audit:`), with this report
as the sole staged file. Preserve predecessor reports as historical evidence;
do not rewrite their observations or advance Cursor's rolling report.

Next is the requested external-human-gate architecture-selection task. It must
consider this narrower finding and must not assume a mandatory vendor code
change has been proven. No architecture selection is made by this review.

No vendor patch, monkey patch, replacement tool, local UI substitution,
Telegram/n8n/VPS change, OpenClaw activation, production routing change, secret
persistence, or dashboard work occurred. Validation: parser counterexample,
fresh ACP discovery, one primitive attempt, unchanged inspected vendor hashes,
and Git whitespace/scope checks.
