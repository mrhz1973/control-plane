# LAST CURSOR REPORT

## Qwen browser visual sidecar V1 minimal implementation — latest

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_MINIMAL_IMPLEMENTATION`
**Classification:** `STOP — T5_FAILURE_PATH_PROBE_NOT_BOUNDED (operator interrupted; worktree preserved uncommitted)`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `57f6555c86affe5db3169925845ec04426899825`
**STOP report:** `reports/runtime/qwen-browser-visual-sidecar/STOP_MINIMAL_IMPLEMENTATION.md`
**STOP evidence:** `reports/runtime/qwen-browser-visual-sidecar/stop-evidence.json`

- **Blocker:** the vendor `agent-browser` daemon caches the first `--cdp`
  endpoint and ignores later ones; after a daemon kill a fresh `npx --yes`
  invocation can cold-hang without emitting any JSON envelope, outliving
  exec timeouts. Failure-path probes hung 22 min and ~4.7 h before being
  killed. T5 (`capture failure ⇒ UNAVAILABLE`) therefore cannot be proven
  bounded ⇒ STOP at the first real blocker, no live workaround.
- **Already proven before STOP (24/25 suite):** live annotated path works —
  `--annotate` returned `@e1,@e2,@e3` with boxes; screenshots ephemeral
  (own temp + CLI default dir cleaned); fail-closed envelopes for empty/
  malformed/ambiguous annotations; Qwen-unhealthy ⇒ blocked; Qwen primary
  READY (12–23 ms) throughout; no OCR, no VLM, no public CDP, no profile
  mutation; `VISUAL_INSPECTION` visible in the #79 lane with zero image
  data. Regressions inside the suite: #79 23/23, MCP gate 37/37,
  dispatcher 69/69.
- **Preserved uncommitted (operator order — do not discard):**
  `tools/qwen-browser-visual-sidecar-v1.mjs` (annotate-tier helper,
  `OCR_ENABLED=NO`, `VLM_ENABLED=NO`, observation-only), additive
  `VISUAL_INSPECTION` stage in `agent-activity-registry-v1.mjs`, and the
  `tests/qwen-browser-visual-sidecar-implementation/run.mjs` harness.
- **NEXT:** bounded failure-path remediation (project-owned process-tree
  timeout, pinned daemon endpoint, or daemon-caching off via env/config)
  BEFORE any retry. No OCR/VLM installation.


## Qwen browser visual sidecar V1 evaluation — latest

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_EVALUATION`
**Classification:** `PASS — SELECTED_ARCHITECTURE=B OCR_FIRST_WITH_VLM_ESCALATION_ON_DEMAND; VLM_LIVE_BENCHMARK=DEFERRED_RESOURCE_SAFETY; IMPLEMENTATION_AUTHORIZED=NO`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `be0a2daea2456ef17d0fdc8cdbfb40a5a12b3849`
**Report:** `reports/architecture/qwen_browser_visual_sidecar_v1_evaluation.md`
**Evidence:** `reports/runtime/qwen-browser-visual-sidecar/evaluation-evidence.json`
**Benchmark:** `tests/qwen-browser-visual-sidecar-evaluation/run.mjs` — 15/15 PASS (controlled local fixture, no ChatGPT Web)

- **Capture surface QUALIFIED:** installed Hermes already owns a native
  `screenshot` primitive (`browser_tool_session.py`, incl. Chrome fallback);
  agent-browser 0.26.0 `screenshot --annotate` maps numbered labels to
  snapshot refs (visual→actionable bridge without OCR); CDP
  `Page.captureScreenshot` verified (valid PNG, median 27 ms). No public
  CDP (loopback bind proof T10), no profile mutation (throwaway temp
  profile, real one never referenced — T11), no production route mutation
  (T12).
- **Measured:** DOM baseline median 13 ms / p95 14 ms (n=20, 4/4
  elements); capture median 27 ms; VRAM delta across benchmark 29 MiB;
  Qwen primary READY at every pressure checkpoint (10–41 ms) with
  byte-identical command line (T8); no orphan processes; temp artifacts
  removed (T9).
- **OCR stage:** no engine installed on workstation (no tesseract/OpenCV;
  Pillow only). Structured-result contract + confidence gating +
  fail-closed paths proven with a deterministic stand-in (T3/T3B/T6/T7).
  Implementation-task candidates: RapidOCR (ONNX CPU) or the annotate
  route (no OCR at all).
- **VLM tier:** DEFERRED_RESOURCE_SAFETY — live free VRAM ~0.4 GiB against
  the resident 27B Qwen primary; zero local vision models (no mmproj,
  empty clip_vision, no ollama vision tags); mtmd.dll present but
  co-residency impossible; on-demand load/unload (5–15 s cold start) or
  CPU-only are the only compatible modes.
- **Selection law:** DOM default → screenshot+OCR/UI on DOM insufficiency →
  small VLM on-demand only on measured ambiguity → fail-closed structured
  UNKNOWN (targets never invented). Sidecar observes only — no clicks/
  typing from the visual path, no second authority; future implementation
  maps to #79 observability as a read-only stage.
- **Hard walls:** evaluation only; no implementation/live activation; no
  new API/BYOK; no permanent VLM resident; screenshots ephemeral (T5).


## Local dev Hermes/Qwen activity observability V1 — latest

**TASK_REF:** `LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1`
**Classification:** `PASS — READ_ONLY_OBSERVABILITY_LIVE; DISPATCHER_IDLE_WITH_EXTERNAL_ACTIVE=PASS; PRODUCTION_CHANGED=NO`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `b325d72eff18d3c1058f2b3d7705b9593598d02c`
**Report:** `reports/architecture/local_dev_hermes_qwen_activity_observability_v1.md`
**Evidence:** `reports/runtime/local-dev/agent-activity-observability-evidence.json`

- **Pattern:** local JSON ephemeral registry (`agent-activity-registry-v1.mjs`,
  `%LOCALAPPDATA%\control-plane\agent-activity-registry-v1.json`, bounded 20,
  merge-on-upsert, atomic write) + GET-only `/v1/agent-activity` and additive
  `agent_activity` field in `/v1/diagnostics` served by the EXISTING dispatcher
  process. No new service.
- **Schema:** exactly the mission fields; states ACTIVE/WAITING/PASS/STOP/UNKNOWN/STALE;
  all 12 mission stages; freshness computed at read time (90 s threshold ⇒ STALE,
  missing ⇒ UNKNOWN, PASS/STOP never reinterpreted, zero heartbeat side effects).
- **Sanitization:** allow-list-only persistence (hostile payloads with cookies/
  tokens/credentials/session ids leave zero trace — T8/T9); `auth_state` boolean-
  sanitized; no raw session identity.
- **Dashboard:** distinct `AGENT` section (agentops, canonical order resources →
  ops → agentops → queue) labelled "Fuori dal ciclo di selezione/claim"; proves
  DISPATCHER=IDLE_CLEAN concurrently with an ACTIVE Hermes/Qwen browser operation
  (T2); WAITING+HUMAN_GATE visible (T3) without any Telegram polling.
- **Writer integration:** `hermes-allowlist-live-send-v1.mjs` publishes the full
  stage lifecycle + STOP reasons, best-effort (publish failure can never affect
  gates/budgets/send path). Synthetic lifecycle + STOP proven; NO real send.
- **Authority law:** module exports no tick/claim/authorize/execute surface;
  endpoint acquires no tick lock; task/receipt/queue untouched (T10–T12).
- **Tests:** observability fixture 23/23 PASS; dispatcher suite 69/69 PASS
  (S71 updated to the new 4-section canonical layout — additive); MCP gate suite
  37/37 PASS (operator-wait law untouched); runtime docs UTF-8 integrity
  re-verified (BOM=false, U+FFFD=0).


## Cursor ACP MCP human gate persistent operator wait V1 — latest

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_PERSISTENT_OPERATOR_WAIT_V1`
**Classification:** `PASS — OPERATOR_WAIT_LONG_LIVED=PASS; UTF8_INTEGRITY_RESTORED; REAL_TELEGRAM_SENDS=0`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `76920a352adbeffe2dba8da0f4b9ee73f513f40a`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_persistent_operator_wait_v1.md`

- **PART 1 (UTF-8):** `CURRENT_FRONTIER.md` restored from the pristine parent
  blob (`2dc213f`) + RETRY4 semantic delta re-applied via Node (native UTF-8,
  LF, no BOM). Verified: mojibake=0, replacement chars=0, exactly one row
  differs from parent (row 23, the RETRY4 append). First repair attempt
  (latin-1 roundtrip) degraded CP1252 bytes → discarded before commit.
- **PART 2 (lifetime law):** new `lifetime_mode` on every decision.
  `operator_wait` (new default): `expires_at=null`, `ttl_ms=null` — NO
  auto-expiry; a valid human callback is admittable at +15m/+1h/+2h/+8h and
  beyond. `bounded_ttl` (legacy, explicit): unchanged law, EXPIRED fence kept
  (old fixtures valid). `markNoAnswer` forbidden on operator_wait.
  Explicit persisted terminal events added: CANCELLED (with by/reason,
  auditable history) and SUPERSEDED (canonical supersession via new
  generation; callback on superseded rejected; new generation admits).
- Background waiter now re-arms bounded transport waits (default 10m, cap 1h;
  1s gap — no busy loop) and NEVER terminates on wall-clock time; terminal
  only on ANSWERED, explicit CANCELLED/SUPERSEDED, or fatal transport class
  (CONFLICT/AUTH — decision stays PENDING, fail-closed). Status poll slice
  unchanged (8s default, 20s cap ≪ 45s watchdog budget); elapsed time alone
  always reports PENDING.
- Crash/restart: PENDING survives in the persistent store; waiter resumes at
  first re-arm; no session/load on the live path; never falsely "actively
  polled" when no server is alive (documented limit, fail-closed).
- Tests: persistent-wait fixture **25/25 PASS** (injected clock: 15m/1h/2h/8h,
  A/B/C callbacks at +2h, explicit terminals, fences post-long-wait, no busy
  polling, persistence across reload, legacy compat); MCP suite **37/37**;
  watchdog fixture 13/13 (W7 updated to the new law); guards PASS;
  prompt-timeout 19/19; soak 0 failures; leaks 0.
- `REAL_TELEGRAM_SENDS=0`, `PRODUCTION_CHANGED=NO`. NEXT: deterministic
  evidence suffices for the ≥2h requirement (RETRY4 remains semantically
  valid for the rest of the chain); an optional live long-wait proof would be
  `ONE_LONG_WAIT_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION` (operator
  decision required, not executed).

---

## Cursor ACP MCP human gate Telegram E2E final real proof RETRY4 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1_FINAL_REAL_PROOF_RETRY4`
**Classification:** `PASS — REAL E2E PROVEN END-TO-END (watchdog-safe two-step contract)`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `2dc213ffa6876f0119706074664c7992c4d727fc`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_telegram_e2e_final_real_proof_retry4_v1.md`

- One real Telegram E2E executed with the qualified watchdog-safe Pattern B
  contract: `human_gate` → PENDING (~0.3s tool call) → model declared
  WAITING_FOR_OPERATOR and waited with NO pending tool call → real operator
  tap (option A, first attempt, admitted) → canonical VERIFIED→RETURNED →
  `human_gate_status` (1 call, <1s) recovered the canonical option → exact
  consumption `GATE_CONSUMPTION_JSON option=A APPROVE_AND_CONTINUE` in the
  SAME session (`session_sha e224dd9722a4`, 0 session/new, no session/load).
- Budgets held: REAL_TELEGRAM_SENDS=1 · ACTIVE_GATE_MESSAGES=1 ·
  HUMAN_GATE_CREATIONS=1 · MAX_TOOL_CALL_DURATION_MS≈300 (≪45s safe budget vs
  ~60s vendor watchdog) · human wait fully OUTSIDE tool calls.
- Live negative fences (post-callback, no extra sends): duplicate, unknown
  decision, wrong session, wrong generation, invalid option — all rejected.
- Terminal cleanup: keyboard deactivated (registry active=null), issuance
  quiesce→restore VERIFIED, process leaks 0, PRODUCTION_CHANGED=NO.
- Driver updated pre-run to the two-step prompt contract (PENDING is NOT a
  decision; bounded polling only via human_gate_status).
- E2E task `V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1=PASS` — the bounded
  human-gate chain is proven live end-to-end. NEXT: operator-driven; no
  further retry owed.

---

## Cursor ACP MCP human gate 60s watchdog remediation V1 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1`
**Classification:** `PASS — VENDOR_60S_WATCHDOG_CAUSE=CONFIRMED; LONG_BLOCKING_MCP_CALL_REMOVED=PASS; REAL_TELEGRAM_SENDS=0`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `1f4def31ac5bfab38ab7e045f3c74ad954a0f85d`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_60s_watchdog_remediation_v1.md`

- Root cause (RETRY3): vendor Cursor Agent ACP runtime errors a single blocking
  MCP tool call at ~60.1s; the model got a tool error and closed the turn with
  `GATE_FAILED` before the real operator callback was admitted.
- Primitive qualification: vendor async-MCP primitive NOT supported (A/C
  excluded without assumption); **Pattern B selected (project-owned PENDING +
  bounded status/poll contract, same ACP session)**; Pattern D not needed.
- `human_gate` now returns `status=PENDING` immediately (no operator wait
  inside any tool call); a background waiter INSIDE the MCP server (single
  getUpdates consumer) performs canonical admission VERIFIED→RETURNED;
  new `human_gate_status` performs read-only bounded poll slices (default 8s,
  cap 20s ≪ 45s safe budget vs 60s observed watchdog), never authorizes,
  never invents, never sends, never creates gates; PENDING is not a decision.
- REAL ACP harmless qualification (null transport, zero Telegram): gate tool
  call 3.0s ≪ 45s budget; real 70s human delay with NO pending tool call;
  canonical recovery RETURNED option B exact-consumed in the SAME session
  (`session_sha 2173bc362554`, 0 session/new, no session/load).
  Evidence: `reports/runtime/cursor-acp/watchdog-remediation-acp-qualification.json`.
- Deterministic tests: adapter suite **35/35 PASS** (updated to the watchdog-
  safe contract); new watchdog fixture **13/13 PASS** (fast PENDING, budget,
  >60s synthetic delay, post-delay canonical recovery, exact A/B/C, no
  default, fences, single gate/send); soak 0 failures; final-proof guards PASS;
  process leaks 0.
- Repaired pre-existing exit hang (project-owned):
  `v4-cursor-acp-session-wiring-probe-v1.mjs` now tree-kills the ACP wrapper
  (taskkill /T /F) and exits explicitly on win32.
- `READY_FOR_FINAL_REAL_E2E=true`; **NEXT =
  `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION`** (the E2E prompt
  must instruct the two-step PENDING→status consumption contract).

---

## Cursor ACP MCP final E2E prompt timeout cleanup repair V1 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_FINAL_E2E_PROMPT_TIMEOUT_CLEANUP_REPAIR_V1`
**Classification:** `PASS — UNHANDLED_PROMPT_TIMEOUT_BYPASS=ELIMINATED; REAL_E2E=NOT_RUN`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `0b04ecefb46a0b206631d9314edb6c67d4d00353`
**Report:** `reports/architecture/v4_cursor_acp_mcp_final_e2e_prompt_timeout_cleanup_repair_v1.md`

- Repaired the RETRY2 STOP finding: `session/prompt` now carries an explicit
  human-wait-compatible timeout DERIVED from the gate lifecycle
  (`registration 120s + TTL 900s + resolution 60s + terminal 60s`), not the
  generic 30s RPC default (other RPCs keep 30s).
- New pure helper `tools/v4-cursor-acp-prompt-lifecycle-v1.mjs`:
  `derivePromptTimeoutMs` (bounded, lifecycle-derived, input-validated),
  `createPromptTracker` (IMMEDIATE rejection ownership; observable
  PENDING/FULFILLED/REJECTED), `installUnhandledRejectionGuard` (safety net
  that records sanitized reasons and never kills the process outside the
  lifecycle).
- Both bounded polling loops (registration wait; operator wait) observe
  prompt failure and the guard → controlled STOP fail-closed without burning
  the TTL; the final prompt await wraps rejection into
  `stop("PROMPT_FAILED")` through main try/finally; terminal finally flips
  non-PASS to STOP when the guard fired.
- Focused qualification **19/19 PASS** (timeout derivation, ownership,
  early/during/timeout/ACP-exit rejections → controlled STOP with finally
  reached, keyboard deactivation attempted iff currentGate, no-gate cleanup
  idempotent, restore always attempted + verified fail-closed, no semantic
  regression).
- Regressions: MCP gate suite **32/32 PASS**; soak 319 iters
  (`VALID_CALLBACK_LOST=0`, `PROCESS_LEAKS=0`); final-proof guards PASS;
  0 orphan MCP servers; 1 canonical issuance instance.
- `REAL_TELEGRAM_SENDS=0`, `ACTIVE_GATE_MESSAGES=0`, `PRODUCTION_CHANGED=NO`.
- `READY_FOR_FINAL_REAL_E2E=true`; **NEXT =
  `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION`.**

---

## Cursor ACP MCP final E2E driver precondition repair V1 — previous

**TASK_REF:** `V4_CURSOR_ACP_MCP_FINAL_E2E_DRIVER_PRECONDITION_REPAIR_V1`
**Classification:** `PASS — FINAL_DRIVER_PRECONDITIONS_QUALIFIED; TELEGRAM_E2E=NOT_CLAIMED`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `371d94be15f855a54701e9163542094b0b0e1c02`
**Report:** `reports/architecture/v4_cursor_acp_mcp_final_e2e_driver_precondition_repair_v1.md`

- Final E2E driver now shares the qualified official `agent.ps1` PowerShell
  launcher (`shell:false`) and its startup, premature-exit, and RPC failures
  fail closed.
- Every terminal path delegates the current keyboard only to canonical
  `deactivateCurrentKeyboard`; a cleanup failure stops the run but issuance
  restore remains verified.
- Focused final guards PASS; real ACP wiring PASS; MCP suite **32/32 PASS**.
  `PROCESS_LEAKS=0`, `REAL_TELEGRAM_SENDS=0`, `PRODUCTION_CHANGED=NO`.
- `READY_FOR_FINAL_REAL_E2E=true`; **NEXT =
  `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION`.**

---

## Cursor Agent runtime resource recovery and wiring requalification V1 — latest

**TASK_REF:** `V4_CURSOR_AGENT_RUNTIME_RESOURCE_RECOVERY_AND_WIRING_REQUALIFICATION_V1`
**Classification:** `PASS — ACP_MCP_WIRING_REQUALIFIED; TELEGRAM_E2E=NOT_CLAIMED`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `4b3f798a2b7bcd015c4034e25b7e50b26fbf3246`
**Report:** `reports/architecture/v4_cursor_agent_runtime_resource_recovery_and_wiring_requalification_v1.md`

- Operator resource relief reduced commit use to 40,625/67,498 MB; no
  project-owned stale ACP/MCP process was found or terminated.
- Official CLI startup, real ACP initialize, real `session/new` with the
  project MCP server, and three consecutive wiring probes all passed.
- Full MCP gate suite **32/32 PASS**; final-proof guard regressions PASS;
  `PROCESS_LEAKS=0`, `REAL_TELEGRAM_SENDS=0`, `PRODUCTION_CHANGED=NO`.
- `READY_FOR_FINAL_REAL_E2E=true`; no Telegram E2E, real callback, or live
  post-gate same-session claim was made.
- **NEXT = `ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_OPERATOR_DECISION`.**

---

## ACP MCP human-gate minimal slice implementation V1 — latest

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_MINIMAL_SLICE_IMPLEMENTATION_V1`
**Classification:** `PASS — MINIMAL_SLICE_IMPLEMENTED_AND_PROVEN (synthetic transport only; TELEGRAM_E2E=NOT_CLAIMED)`
**Date (Europe/Rome):** 2026-09-12
**BASE_HEAD:** `b1c15165d4768f1d33e1f61d1941461e89ee1f86`
**Report:** `reports/architecture/v4_cursor_acp_mcp_human_gate_minimal_slice_implementation_v1.md`

- Implemented the selected minimal slice: canonical gate-core extracted from
  the proven V2 law (`tools/v4-cursor-acp-gate-core-v1.mjs` — single decision
  authority, REGISTERED→NOTIFIED→VERIFIED→RETURNED→CONSUMED, EXPIRED/NO_ANSWER
  terminal, decision_id binding task/run/session-sha/generation, bounded TTL);
  adapter-only MCP stdio server with exactly one `human_gate` tool (schema
  A/B/C enforced, fail-closed, no default answer, no credentials in the
  adapter); ACP wiring probe (driver writes the trusted session binding;
  agent-side `session/new` guard = 0).
- Vendor MCP contract discovered read-only and applied: per-session stdio
  server shape `{name, command, args[], env:[{name,value}]}`; a real
  `agent acp` `session/new` accepted the project server
  (`ACP_MCP_WIRING=PASS`).
- Deterministic suite 32/32 PASS (`tests/v4-cursor-acp-mcp-gate/`, synthetic
  transports only): all negative fences (stale/duplicate/wrong
  task/session/generation/invalid option/unknown decision), fences never
  mutate a healthy decision, NO_DEFAULT_ANSWER, adapter-cannot-self-authorize
  (missing binding fails closed), synthetic valid callback returned the
  option through the MCP tool result, unknown tool rejected.
- Not claimed: `TELEGRAM_E2E`, `REAL_OPERATOR_CALLBACK`, live same-session
  continuation — next task.
- No walls touched. `PRODUCTION_CHANGED=NO`.
- **NEXT = `V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1`**: real Telegram
  transport (canonical credential path, unchanged) + real operator callback +
  live same-session ACP continuation with the full marker set.

---

## ACP external human-gate architecture selection V1 — latest

**TASK_REF:** `V4_CURSOR_ACP_EXTERNAL_HUMAN_GATE_ARCHITECTURE_SELECTION_V1`
**Classification:** `PASS — ARCHITECTURE_SELECTED (A_PROJECT_OWNED_MCP_HUMAN_GATE_TOOL; selection only, no implementation)`
**Date (Europe/Rome):** 2026-09-12
**BASE_HEAD:** `a3fc8a5025e0c88c8ebc2e7c3c785f126e38d702`
**Report:** `reports/architecture/v4_cursor_acp_external_human_gate_architecture_selection_v1.md`

- Evaluated A (project-owned MCP human-gate tool), B (structured
  turn-boundary envelope), C (existing canonical mechanisms) against the full
  criteria set (dynamic gate, same-session semantics, callback binding,
  fences, fail-closed, hallucination surface, lifetime, crash recovery,
  session/load, Telegram reuse, authority, complexity, testability, vendor
  dependency, secret exposure).
- **Selected A**: session-scoped MCP is the vendor-supported tool-injection
  surface (verified live: `initialize` `mcpCapabilities` + `session/new`
  `mcpServers`); the MCP tool is an adapter only — the canonical Control Plane
  gate remains the sole decision authority; no self-authorization, no default
  answer, fail-closed `no_answer`.
- SAME-SESSION LAW defined: exact ACP `sessionId` across the gate over one
  uninterrupted stdio connection; `session/new` after gate = FAIL;
  `session/load` = `LOGICAL_RECOVERY` only (crash path, labeled, never silent
  substitution).
- MCP question resolved YES: one project-owned localhost `human_gate` tool can
  be exposed per-session without production-routing change or second
  authority.
- Rejected: B (trust anchor = model-authored envelope; documented emergency
  fallback shape only), C (We/wf46 inactive + second inbound surface; Telegram
  issuance service is production-route-scoped authority; checkpoint is
  persistence).
- Decision includes TRUST_BOUNDARIES, STATE_MACHINE, CALLBACK_BINDING,
  SESSION_IDENTITY_RULE, FAIL_CLOSED_RULE, CRASH_RECOVERY_RULE,
  MINIMAL_IMPLEMENTATION_SLICE, MINIMAL_E2E_PROOF.
- No implementation performed. No walls touched. `PRODUCTION_CHANGED=NO`.
- **NEXT = one bounded implementation task for the selected minimal slice
  (MCP `human_gate` adapter + driver wiring + V2-law fences), then the
  minimal E2E proof.**

---

## Cursor Agent CLI accessibility remediation V1 — latest

**TASK_REF:** `V4_CURSOR_AGENT_CLI_ACCESSIBILITY_REMEDIATION_V1`
**Classification:** `PASS — CURSOR_ACP_NOT_PROJECT_ACCESSIBLE=RESOLVED`
**Date (Europe/Rome):** 2026-09-12
**BASE_HEAD:** `d2bd6b4110531622d487aac742db7103aa1081fc`
**Report:** `reports/architecture/v4_cursor_agent_cli_accessibility_remediation_v1.md`

- Official native-Windows Cursor Agent CLI installation completed; `agent`
  command available, version `2026.09.10-fd3934a` observed.
- Authentication was directly confirmed by the operator through `agent status`;
  account identity, login URL, challenge, tokens, and credential material were
  not persisted.
- Local help plus official ACP documentation prove the project-accessible ACP
  command/stdin-stdout protocol, `session/new`, `session/load`, and blocking
  `cursor/ask_question` support.
- No Agent model/provider request, ACP session, Telegram integration,
  browser/runtime/VPS/n8n action, or production mutation was performed.
- **NEXT = `V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2`**: prove
  an actual bounded same-session Telegram gate and its callback fences.

---

## Hermes Phase F bounded production activation — latest

**TASK_REF:** `V4_HERMES_PHASE_F_BOUNDED_PRODUCTION_ACTIVATION_V1`
**Classification:** `PASS — BOUNDED_PRODUCTION_ACTIVATION_COMPLETE · LIVE_CANARY=PASS · LIVE_DISPATCH_COUNT=1 · ISSUE_73=CLOSED_COMPLETED`
**Date (UTC):** 2026-09-12
**BASE_HEAD:** `8323b2f91b91ba120a8fc142fe0313e7b8c31db8`
**Commit:** `68691b0` (pushed + remote-verified, origin/main = 68691b0)
**Report:** `reports/architecture/v4_hermes_phase_f_bounded_production_activation_v1.md`
**Evidence:** `reports/runtime/phase-f/phase-f-bounded-production-activation-evidence.json`
**Packet:** `docs/decision-packets/v4-hermes-phase-f-promotion-gate-v1.md` (final activation update appended)

- Decision **A — ACTIVATE the qualified route under bounded production authorization** recorded and executed for the exact route `qwen_local -> hermes -> chatgpt_web` ONLY.
- Exact-route authorization delta: 3 repo allow-list pins (provenance registry validator, appended-entry pin, issuance ALLOWED_ROUTES + pending-store validator) + user-local issuance config; allow-list = EXACTLY two canonical routes (`opencode+qwen_local`, `hermes+chatgpt_web`); I05 regression asserts the two-route law (anti-broadening intent preserved).
- Route control `DISABLED -> CANDIDATE_ENABLED` for the canary window (candidate ≠ authorization; adapter dual gate still required ACTIVE route-pinned authorization), then restored **DISABLED** post-canary (restoration `SHADOW_ONLY`, `disable_history` recorded; adapter re-check `BLOCKED / ROUTE_CONTROL_DISABLED`).
- Canonical Telegram issuance gate (operator APPROVE in-band): `AUTH-PROMO-ACT-4c15532ece9fcce4` route-pinned ACTIVE (1h TTL), scope-digest bound, ledger-first spend + ACTIVE→SPENT BEFORE transport.
- ONE bounded live canary PASS: RUN_ID `108690b6ad15430eb2f55c885b1eca9e` — RT25 admission via canonical producer (`QWEN_READY_IDLE`), Phase E shadow selection live, dual-gate eligibility `READY_FOR_AUTHORIZED_DISPATCH`, 2 Qwen controller generations, EXACTLY 1 ChatGPT Web send via the qualified chain-send transport (snapshot→fill→press Enter, ONE agent-browser connection) routed through `executePromotedRoute` (`EXECUTED_CONFIRMED`), independent DOM verifier `REAL_USER_TURN_DOM_CONFIRMED=PASS` (1 user turn with canary payload + 1 assistant reply, composer empty).
- Bounded repairs in-session (per `bounded-repair-continuation-policy-v1`, same task/objective/scope/authority): (1) S1 executes through the adapter-routed chain-send batch — agent-browser refs are connection-scoped, a standalone exec-tool type can never resolve them; (2) admission clock captured AFTER the producer (composer future-dated law); (3) producer recognizes the documented router-owned Qwen topology; (4) runtime doc FAST_AGENT mapping aligned to operator-selected `qwen38-opus-q3-agent-24k`; (5) expired-pending re-issuance through the same canonical gate.
- Regressions all green: activation 13/13, promotion-implementation 24/24, issuance 60/60, spend-ledger 13/13, Phase E 10/10, readiness 30/30, local-runtime producer 57/57, T04 8/8, T09 5/5.
- `SILENT_FALLBACK=NO`, `AUTHORIZATION_BYPASS=NO`, `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`, `LIVE_DISPATCH_COUNT_TOTAL=1`, D-0025 `enabled=false` untouched, no OLD/OpenClaw/public-surface mutation.
- **Issue #73 CLOSED (completed)** — umbrella acceptance A–F fully satisfied after activation.
- **NEXT = none outstanding for this track; any further production enablement requires a NEW human promotion gate.**

---

## Hermes Phase D context rollover + stale-generation fence V2 — previous

**TASK_REF:** `V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2`
**Classification:** `PASS — ISSUE_73_PHASE_D=PASS · SAME_CANONICAL_NEXT=YES · CHATGPT_WEB_SENDS=2 · NEXT=PHASE_E`
**Date (UTC):** 2026-09-12
**BASE_HEAD (predecessor PASS artifact):** `0090e29a7a43a4f4491fb0f69b7a1f0959cc1d8e`
**Report:** `reports/architecture/v4_hermes_phase_d_context_rollover_stale_generation_fence_v2.md`

- Full Phase D rollover proven live: fresh Chat N (`chat_n_7a0c14befaaa`) sent one bounded
  harmless Phase D request through the qualified multi-turn wrapper; identity-stamped
  continuation envelope returned; bounded integrity-hashed context delta extracted; fresh
  Chat N+1 (`chat_np1_1c521d35d156`, DISTINCT) received CORE BOOT (canonical static
  requirements + bounded delta ONLY) and reproduced the SAME canonical NEXT
  (`V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1`) exactly.
- `STALE_GENERATION_FENCE=PASS` (deterministic rejection of wrong base/run/chat/nonce, old
  and superseded generations, all pre-dispatch with `HERMES_HANDLER_INVOKED=NO`);
  `CONTEXT_DELTA_FENCE=PASS` (stale/wrong-base/wrong-run/tampered/oversize/unexpected-field
  deltas rejected); send classification exclusively via independent structural DOM verifier
  (`PRESS_SUCCESS is not SEND_SUCCESS`); controller/browser/verifier loss all fail-closed;
  `IMPLICIT_FALLBACK=NO`.
- User-authorized inline repairs (root causes fixed inside the qualified wrapper/driver):
  (1) connection-scoped `agent-browser` refs → bounded `chain-send` single-connection batch;
  (2) backgrounded-window Enter drop → CDP focus-emulation delivery guard (fail-closed
  `FOCUS_GUARD_UNAVAILABLE`); (3) press-only refocus via deterministic click inside the
  press batch; (4) driver poller double-stringify bug fixed; (5) generation truncation on
  large payloads → bounded maxTokens raise + `EMPTY_TYPE_ARGUMENTS` fail-closed guard;
  (6) backgrounded-tab SSE stall → verifier `focus-tab` delivery mode + bounded reload
  fallback (read-only re-fetch of the same conversation, never a send, never a route
  switch).
- `CHATGPT_WEB_SENDS=2` (budget exactly 2); `QWEN_GENERATIONS_LIVE=6` (≤6);
  `OFFLINE_QWEN_GENERATIONS=0`; `GLM_CALLS=0`, `CODEX_CALLS=0`, `OPENAI_API_CALLS=0`;
  no `/v1/tick`; `PRODUCTION_DISPATCH=NO`; `CANDIDATE_EXECUTED=NO`.
- `RAW_CDP_CONTROLLER_EXPOSURE=NO`; model-visible tools remain exactly
  `browser_navigate/browser_snapshot/browser_type/browser_press`;
  `HERMES_GLOBAL_CONFIG_UNCHANGED=YES`; `PREFILL_ONLY_ADAPTER_UNCHANGED=YES`.
- Focused Phase D suite 43/43 PASS; regressions PASS (predecessor wrapper 73/73, governed
  CDP adapter PASS, controller profile tool emission 30/30, registry-v2 76/76);
  `git diff --check` clean. `ISSUE_73_PHASE_C=PASS` preserved; #73 CLOSED with PHASE_D=PASS.
- Report: `reports/architecture/v4_hermes_phase_d_context_rollover_stale_generation_fence_v2.md`.
- **NEXT = `V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1`** (separate task; no Phase F;
  no promotion; no production activation).

---

## Hermes multi-turn allowlist chain send V1 — previous

**TASK_REF:** `V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1`
**Classification:** `PASS — HERMES_AGENT24K_NATIVE_BROWSER_SEND=QUALIFIED · CHATGPT_WEB_SENDS=1 · PHASE_D=OPEN`
**Date (UTC):** 2026-09-11
**BASE_HEAD:** `8a730bde03075061eeb7bbff4503da951d8e83dd`
**Report:** `reports/architecture/v4_hermes_multi_turn_allowlist_chain_send_v1.md`

- Control Plane per-invocation wrapper (dual barrier) qualified: exactly 4 model-visible
  Hermes schemas (`browser_navigate`, `browser_snapshot`, `browser_type`, `browser_press`);
  exact-name execution allowlist; `browser_cdp`/`browser_console`/`browser_exec` never
  model-visible, never dispatchable, never executed; `RAW_CDP_CONTROLLER_EXPOSURE=NO`.
- Multi-turn controller chain PASS with wrapper-owned state machine: GEN1 `browser_snapshot`
  → GEN2 `browser_type` (exact composer ref + exact payload identity) → GEN3 `browser_press`
  Enter; no fourth generation; controller history preserved across generations with exact
  `tool_call_id` association and bounded sanitized tool results only.
- Independent read-only DOM verifier confirmed the new user turn containing
  `task_ref`/`RUN_ID`/`NONCE`/`base_head`: `REAL_USER_TURN_DOM_CONFIRMED=PASS`,
  `CHATGPT_WEB_SENDS=1` (single harmless shadow payload, `production_dispatch=false`). No
  response wait.
- `HERMES_GLOBAL_CONFIG_UNCHANGED=YES` (hash before/after), `HERMES_INSTALL_UNCHANGED=YES`,
  `PREFILL_ONLY_ADAPTER_UNCHANGED=YES`.
- Focused suite 73/73 (37 inherited + 36 multi-turn state-machine checks); regressions PASS
  (`hermes-governed-cdp-adapter-v1`, `qwen-hermes-controller-profile-tool-emission-v1`,
  `registry-v2` 76/76, `git diff --check` clean).
- `OFFLINE_QWEN_GENERATIONS=0`; `QWEN_GENERATIONS_LIVE=3` for the qualified attempt;
  earlier in-task diagnostic attempts were operator-authorized bounded determinism fixes
  with zero send side effects (fully disclosed in the report).
- `GLM_CALLS=0`, `CODEX_CALLS=0`, `OPENAI_API_CALLS=0`, `PRODUCTION_DISPATCH=NO`,
  `CANDIDATE_EXECUTED=NO`.
- `ISSUE_73_PHASE_C=PASS` and `PHASE_D=OPEN` remained unchanged at that time.
- `NEXT=V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2`.
