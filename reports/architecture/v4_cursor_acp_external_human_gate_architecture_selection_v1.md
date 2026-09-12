# V4 Cursor ACP external human-gate architecture selection V1

**TASK_REF:** `V4_CURSOR_ACP_EXTERNAL_HUMAN_GATE_ARCHITECTURE_SELECTION_V1`
**Classification:** `PASS — ARCHITECTURE_SELECTED (selection only; no implementation in this task)`
**Date (Europe/Rome):** 2026-09-12
**Repository:** `mrhz1973/control-plane`
**Branch:** `main`
**BASE_HEAD:** `a3fc8a5025e0c88c8ebc2e7c3c785f126e38d702`

---

## 0. Mission and inputs

Select the minimal robust architecture for:

```text
ACP task/session
→ dynamic human-decision request
→ canonical Control Plane gate
→ Telegram
→ verified callback
→ SAME ACP session resumes
→ operator answer consumed
```

without depending on model-facing `cursor/ask_question`.

Canonical inputs: the V2 STOP evidence
(`v4_cursor_agent_acp_telegram_same_session_human_gate_v2.md`), the exposure
qualification (`v4_cursor_acp_ask_question_exposure_qualification_v1.md`), the
independent vendor-limit review
(`v4_cursor_acp_ask_question_vendor_limit_independent_review_v1.md` —
`CONFIRMED_NEGATIVE_REFINED`, causal attribution NOT_PROVEN), the bounded V2
driver (`tools/v4-cursor-acp-telegram-same-session-gate-v1.mjs`), the Telegram
gate credential path (issuance config user-local, previously verified healthy
sanitized), the We/wf46 inactive template (deprecated Plan-B webhook path —
rejected as authority), and the checkpoint/continuation contracts.

## 1. Candidates evaluated

- **A — Project-owned MCP human-gate tool.** The ACP driver declares one local
  MCP server exposing a single tool `human_gate`. The model invokes it as a
  normal tool; the tool delegates to the Control Plane gate adapter.
- **B — Structured turn-boundary gate.** The model emits a strict
  `HUMAN_GATE_REQUEST` envelope in its final message; the driver intercepts
  `end_turn`, runs the gate, then continues with a new `session/prompt`.
- **C — Existing canonical mechanisms.** Examined: n8n Wd/We/wf46 decision
  packet path (inbound inactive; deprecated Plan B; would add webhook
  activation and a second inbound surface — rejected); Telegram issuance
  service route-approval path (production-authorization-scoped, route-pinned,
  not a generic A/B/C task gate — reusing it would blur authorities);
  execution-checkpoint contract (persistence artifact, not a runtime gate);
  `cursor/ask_question` client bridge (kept as passive compatibility surface
  but unusable as primary while the model-facing tool is not emitted).
  None is materially simpler while preserving the guarantees. Rejected.

## 2. Comparison matrix

| Dimension | A (MCP tool) | B (turn-boundary) | C (existing) |
|---|---|---|---|
| Dynamic gate capability | real tool call with typed args; question can be generated per decision | depends on model discipline emitting the envelope exactly | n/a (no dynamic runtime gate) |
| Exact same-session semantics | tool call executes mid-turn inside the live session; session id unchanged | session id unchanged, but continuation is a new prompt turn (still same session) | n/a |
| Callback binding | task/session/generation stamped by driver at tool invocation | stamped by driver at interception | n/a |
| Stale/duplicate rejection | gate-store fences (same law as V2) | same | partial (We template guards) |
| Fail-closed | no answer → tool returns gate_pending/error; no default | no envelope → no gate; risk of silent continue if envelope is hallucinated/missed | n/a |
| Model hallucination surface | LOW — tool presence is machine-truth; malformed args validated by schema; tool result is authoritative | HIGH — envelope is free text; model may hallucinate, alter, or omit it; no schema enforcement at emission | n/a |
| Process-lifetime dependency | MCP server process tied to driver lifetime (same process tree as ACP child) | none beyond driver | n/a |
| Crash/restart recovery | gate decision persisted user-local; session/load recovery possible (logical) | envelope lost unless persisted; weaker | checkpoint only |
| session/load implications | compatible: logical same-session recovery re-enters with gate state from store | compatible but envelope not durable | n/a |
| Telegram reuse | full (canonical credential path, unchanged) | full | partial |
| New authority | none — adapter only | none | would add inbound surface or blur route authority |
| Complexity | moderate (one stdio MCP server + schema) | low-medium (parser + protocol discipline) | low but inadequate |
| Testability | high (tool contract is typed; negative fences directly testable) | medium (text-protocol conformance tests) | low |
| Vendor dependency | none (MCP is documented, stable, session-scoped) | none | none |
| Secret exposure risk | none (token stays in driver memory; MCP surface is localhost stdio) | none | n/a |

**Selection: A.** B is retained only as documented fallback shape if MCP roster
injection were ever unavailable; it is NOT selected because its trust anchor is
model-generated text (the same weakness class this chain is escaping). C is
rejected as authority-blurring or inactive.

## 3. IMPORTANT MCP QUESTION — resolved

Can ACP session MCP support expose one project-owned, localhost/private
`human_gate` tool without changing production routing or creating a second
decision authority? **YES, by design:**

- ACP `initialize` advertises `mcpCapabilities:{http:true,sse:true}` and
  `session/new` accepts `mcpServers` (verified live; independent review
  §discovery concurs). The shipped agent session forwards client-declared
  MCP servers into the conversation run — this is the vendor-supported,
  documented injection point for client-side tools, and it is
  **session-scoped** (no global CLI MCP enablement, no production routing
  touch, no project `.cursor/mcp.json` mutation required for the proof).
- Authority law: the MCP tool is **ONLY an adapter**. It holds no decision
  logic, no Telegram credential, no store write access of its own beyond
  calling the adapter API. The canonical Control Plane gate (gate store +
  fences + Telegram issuance-credential path, exactly the V2 law) remains the
  single decision authority. The tool cannot self-authorize and cannot
  default an answer: absent a verified callback it returns
  `status:"no_answer"` and the driver STOPs fail-closed.

## 4. Architecture decision

```text
SELECTED_OPTION=A_PROJECT_OWNED_MCP_HUMAN_GATE_TOOL
```

**WHY_SELECTED:** only candidate whose trust anchor is machine-truth (a typed
tool in the roster) rather than model-authored text; vendor-supported exposure
path (session-scoped MCP over the ACP client contract); exact same-session
semantics (the gate executes as a tool call inside the live session); full
reuse of the V2 gate law (store, fences, Telegram path) with zero new
authority; best testability and fail-closed shape.

**REJECTED_OPTIONS:** B_TURN_BOUNDARY_GATE (hallucination-surface trust
anchor; retained as documented emergency fallback shape only);
C_EXISTING_CANONICAL (We/wf46 inbound inactive + second surface; issuance
service is production-route-scoped authority; checkpoint is persistence, not
gate); vendor ask_question dependency (excluded by mission; causal mechanism
NOT_PROVEN per independent review).

**TRUST_BOUNDARIES:**
1. Model ↔ MCP tool: untrusted input; schema-validated (question id, prompt,
   options A/B/C, task_ref, run_id), size-capped, one active gate per tool
   call; tool result is the only authoritative answer channel.
2. MCP tool ↔ Control Plane gate adapter: localhost in-process call (no
   network); adapter is the sole writer of gate state.
3. Gate adapter ↔ Telegram: canonical issuance credential path, in-memory
   token, operator chat/user binding enforced on callback.
4. Driver ↔ ACP session: stdio JSON-RPC; driver never fabricates answers;
   `session/request_permission` auto-denied during bounded proofs.

**STATE_MACHINE (gate decision):**
```text
REGISTERED → NOTIFIED → [operator callback] → VERIFIED → RETURNED → CONSUMED
     ↘ EXPIRED (TTL)            ↘ any fence fail → REJECTED (terminal)
     ↘ TTL or process end without answer → NO_ANSWER (fail-closed STOP)
```

**CALLBACK_BINDING:** `decision_id = fn(task_ref, run_id, session_id_sha,
generation)`; callback must carry `acp:<decision_id>:<A|B|C>`; admission
requires exact match of task_ref + session_id_sha + generation +
unconsumed update_id + operator chat/user + unexpired TTL (V2 `admitGateCallback`
law reused verbatim).

**SESSION_IDENTITY_RULE (SAME-SESSION LAW):** SAME SESSION means the **exact
ACP `sessionId` before and after the gate**, observed by the driver over one
uninterrupted stdio connection to one `agent acp` child. A `session/new` after
the gate is FAIL (silent-substitution test must assert zero extra
`session/new` calls). `session/load` is **logical recovery only**: permitted
exclusively after driver crash/restart, must reload the SAME sessionId, must
re-verify gate state from the persisted store, and must be labeled
`LOGICAL_RECOVERY` — it is never counted as live same-session continuation
and never silently substituted.

**FAIL_CLOSED_RULE:** no callback within TTL → `no_answer`; unknown/duplicate/
stale/wrong-binding/invalid-option callback → rejected (idempotent receipt),
gate never transitions on rejects; no default answer exists at any layer
(model cannot invent one: the tool is the only answer channel; driver cannot
invent one: STOP on no_answer).

**CRASH_RECOVERY_RULE:** driver persists decision state user-local before
Telegram send (V2 store law). On restart: reload store; PENDING+unexpired
decisions may complete if the operator callback arrives within TTL and the
SAME sessionId is reloaded via `session/load` (logical recovery path, labeled);
otherwise STOP with evidence. No retry-send beyond the single bounded V2-style
budget; the MCP child dies with the driver (no orphans).

**MINIMAL_IMPLEMENTATION_SLICE:** one stdio MCP server module exposing
`human_gate` (schema: task_ref, run_id, question {prompt, options[3]},
generation; result: {status: answered|no_answer|error, option?, decision_id});
driver wiring: `session/new` with `mcpServers:[humanGate]`; gate adapter =
extracted V2 logic (register → notify → poll → fence → return); negative
fence unit tests reusing the V2 store law.

**MINIMAL_E2E_PROOF:** one bounded ACP session: prompt instructing exactly one
`human_gate` invocation with the A/B/C proof question; real Telegram send;
real operator callback; driver asserts: tool call observed in-session, gate
VERIFIED, SAME sessionId pre/post (zero `session/new` after gate), answer
returned through the tool result, post-gate continuation text reflects the
operator option, negative replays (duplicate/stale/wrong-binding) rejected.
No production dispatch; no route change; Telegram credential path unchanged.

## 5. Hard walls

No production dispatch, no n8n/VPS mutation, no Telegram credential change, no
public endpoint/Funnel, no OpenClaw, no vendor binary patching, no hidden
fallback, no second decision authority, no secret persistence, no dashboard
work. This task performed selection only — no implementation.

## 6. Markers

```text
SELECTED_OPTION=A_PROJECT_OWNED_MCP_HUMAN_GATE_TOOL
MCP_SESSION_SUPPORT=DOCUMENTED_AND_VERIFIED (initialize mcpCapabilities + session/new mcpServers, live)
CONTROL_PLANE_AUTHORITY_PRESERVED=YES (adapter-only law)
SAME_SESSION_RULE=EXACT_SESSION_IDENTITY (session/load = LOGICAL_RECOVERY only, labeled)
VENDOR_DEPENDENCY=NONE
PRODUCTION_CHANGED=NO
NEXT=ONE_IMPLEMENTATION_TASK_FOR_SELECTED_MINIMAL_SLICE
```

**End of selection.**
