# V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1 — issue #87 report

RESULT=PASS
TASK_REF=V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1
ISSUE_87=#87

BASE_HEAD=892bff0f0aeb09048ff9d65130f2fa18d03ace3a
FINAL_HEAD=see COMMIT

CANONICAL_GATE_CONTRACT=tools/v4-actionable-gate-contract-v1.mjs (v4-actionable-gate-contract-v1: gate_id, task_ref, classification, reason_code, gate_summary, operator_action_summary/detail/choices, origin, created_at/first_observed_at/expires_at, requires_confirmation, references; INFORMATIONAL vs ACTIONABLE modes; signature helper for #84 dedupe)
GATE_AUTHORITY=DISPATCHER_RUNTIME_SINGLE_AUTHORITY (operator taps admitted ONLY by canonical mechanisms; Telegram renders/transports only)
TELEGRAM_ROLE=INTERACTION_SURFACE_ONLY

INFORMATIONAL_GATE_SUPPORTED=YES (MODE A: choices absent/empty or non-canonical -> message only, zero buttons; normalizer + builder + tests prove it)
ACTIONABLE_GATE_SUPPORTED=YES (MODE B: canonical APPROVE_AND_CONTINUE/STOP/DEFER only -> exact buttons)

CHOICES_SOURCE=CANONICAL_GATE_ONLY
UI_INVENTED_CHOICES=0 (partial/unknown choice sets degrade to INFORMATIONAL; never trimmed, never extended)

CALLBACK_GATE_ID_VALIDATION=PENDING_LOOKUP_ENFORCED (unknown pending -> ISSUANCE_PENDING_NOT_FOUND; unknown gate probe REJECTED live)
CALLBACK_ALLOWED_CHOICE_VALIDATION=NAMESPACE_STRICT (only approve/reject in canonical path; unknown choice -> ISSUANCE_TELEGRAM_UPDATE_INVALID; live probe REJECTED)
CALLBACK_FRESHNESS_VALIDATION=PENDING_TTL_900S_MAX (expired callback -> ISSUANCE_EXPIRED with zero state mutation; live probe REJECTED + no_mutation=true)
CALLBACK_ONE_SHOT_VALIDATION=UPDATE_ID_AND_STATE_FENCES (replayed callback -> ISSUANCE_DECISION_ALREADY_CONSUMED; live probe REJECTED; terminal states never regress)

DESTRUCTIVE_ACTION_EXECUTED=NO
PRODUCTION_PROMOTION=NO (qualification authorization is a TEST marker; ISSUED authorization consumed by no runtime path; expires 2026-09-16T15:24:38Z)

EXISTING_HUMAN_GATE_INFRA_REUSED=YES (v4-runtime-authorization-issuance-v1 service + its own Telegram decision poller + pending store + provenance registry; issuance config credential path; no transport code duplicated)
SECOND_BOT_CREATED=NO (same bot token via the canonical issuance config, in-memory only)
SECOND_SCHEDULER_CREATED=NO (WF90 remains the sole 2-minute LOCAL_DEV scheduler; issuance poller is the pre-existing service loop)
SECOND_AUTHORITY_CREATED=NO (the issuance service already was the canonical runtime-authorization authority; no new decision DB — pending store + registry are the existing ones)

WF90_CHANGED=YES (additive only)
WF90_VERSION_BEFORE=faa6ed0f-79d0-4b94-9a39-6c827661fb2d
WF90_VERSION_AFTER=d54bef07-6f6f-4155-87c2-6066ef8118aa
WF90_ACTIVE=YES
WF90_INTERVAL_SECONDS=120
WF90_HTTP_TIMEOUT_MS=3900000

WF90_DEDUPE_REGRESSION=PASS (tests/wf90-telegram-alert-dedupe-v1 5/5 after artifact change; live: unchanged HUMAN_GATE_REQUIRED gate through 6+ new-version ticks produced ZERO telegram runs, SUPPRESS/UNCHANGED_ACTIONABLE_STATE recorded in executions 342109→342134)
UNCHANGED_GATE_REPEAT_SENDS=0 (live verified: state row unchanged since 13:56:42Z, telegram node did not run on any tick after the send-once at exec 342044; new-version window 14:22→14:40+ = 0 sends)

QUALIFICATION_GATE_ID=WF87-QUAL-6b4fc0c9439c (authorization_id WF87-QUAL-AUTH-6b4fc0c9439c)
QUALIFICATION_CHOICES=APPROVE|REJECT (the canonical bounded choices ALREADY proven by the existing issuance human-gate path; APPROVE ≙ operator continue)
QUALIFICATION_TELEGRAM_DELIVERED=YES (message sent BY the canonical issuance service through its own budget; register-pending 200 OK)
QUALIFICATION_BUTTONS_RENDERED=YES (inline APPROVE/REJECT buttons rendered as part of the canonical decision message)
QUALIFICATION_OPERATOR_CHOICE=APPROVE (operator tapped APPROVE; decision_at 2026-09-16T14:24:38.807Z)
QUALIFICATION_CALLBACK_VALIDATED=YES (chat/user identity match true; update ***9319; state PENDING→APPROVED→ISSUED through canonical admission)
QUALIFICATION_GATE_RESOLVED=YES (exactly one transition; state=ISSUED with authorization_expires_at 2026-09-16T15:24:38.807Z)

REPEATED_CALLBACK_RESULT=REJECTED (ISSUANCE_DECISION_ALREADY_CONSUMED; negative-probes.mjs)
STALE_CALLBACK_RESULT=REJECTED (ISSUANCE_EXPIRED with no_mutation=true; expired-gate-probe.mjs; unknown pending -> ISSUANCE_PENDING_NOT_FOUND)
UNKNOWN_CHOICE_RESULT=REJECTED (ISSUANCE_TELEGRAM_UPDATE_INVALID; foreign operator -> ISSUANCE_OPERATOR_IDENTITY_MISMATCH)

INFORMATIONAL_GATE_TEST=PASS (contract test modeA + normalizer informational shape + builder zero-button pass-through; current live TRACKED_DIRTY_CONFLICT tick arrives as text-only message)
ACTIONABLE_GATE_TEST=PASS (contract modeB + normalizer additive metadata + builder exact-buttons; button callback_data bound ag:<nonce>:<CHOICE>:<tag>)

FOCUSED_TESTS=tests/v4-telegram-actionable-human-gate-v1/run.mjs 14/14 PASS; tests/v4-telegram-actionable-human-gate-v1/negative-probes.mjs PASS; tests/v4-telegram-actionable-human-gate-v1/expired-gate-probe.mjs PASS; tests/wf90-telegram-alert-dedupe-v1 5/5 PASS; tests/wf90-axios-409-normalizer 25/25 PASS
SECRETS_EXPOSED=0 (bot token and operator ids never printed; masked tails only in evidence; no credential values in Git/reports)

ISSUE_87=CLOSED_COMPLETED
COMMIT=57b7977be872501e54bc69a7e9593a4f3da0e8b1
REMOTE_HEAD_VERIFIED=YES (origin/main == 57b7977 == local HEAD; pushed)
PRIMARY_WORKTREE_CLEAN=YES (0 tracked dirty files; only pre-existing untracked probe/report artifacts remain)

## What was changed

1. `tools/v4-actionable-gate-contract-v1.mjs` (NEW): shared additive actionable-gate
   contract for #87 (Telegram) and #86 (dashboard). Canonical choice vocabulary,
   INFORMATIONAL/ACTIONABLE modes, signature helper, hmac callback-value binding.
2. `tools/wf90-actionable-gate-nodes-v1.mjs` (NEW): single source of the exact
   jsCode for the WF90 normalizer (additive gate metadata) and the new message
   builder node (MODE A/B renderer).
3. `workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json`:
   - normalizer jsCode now also emits `actionable_gate` (additive; existing
     telegram_text/invariants byte-identical semantics);
   - NEW node `Code - Build WF90 actionable gate message` wired
     IF(send) -> builder -> Telegram;
   - Telegram node: text still `={{ $json.telegram_text }}` (now from builder),
     parse_mode HTML, replyMarkup=inlineKeyboard from builder output,
     credential id `t7zNsQdsOXmXbmgw` (name CONTROL PLANE - Telegram Bot)
     restored in the ARTIFACT (canonical live binding was already in memory);
   - schedule 2 min, timeout 3900000 ms, #84 dedupe nodes untouched.
4. `tools/v4-telegram-actionable-gate-issuance-e2e-v1.mjs` (NEW): qualification
   driver through the canonical issuance service (register + status verify).
5. `tests/v4-telegram-actionable-human-gate-v1/` (NEW): focused contract/normalizer/
   builder/artifact tests + canonical negative probes (replay/unknown/expired/foreign)
   against a throwaway store.
6. `tools/wf90-87-*.sh`, `tools/wf90-87-live-export-proof.mjs`: bounded read-only
   live probes used as evidence (rollback export, execution/dedupe checks, shape
   proof). The live-export-proof script is committed; the one-shot shell probes
   remain local runtime evidence under tools/ (repo convention for probes).

## Live apply path (NEW VPS only)

- rollback export saved: `/tmp/wf90-rollback-pre87.json` (nodes=12, version faa6ed0f) on ionos-n8n-new before any mutation;
- running-executions check = 0 before import/publish;
- first import failed (missing workflow id) -> retried WITH id `90ldaa5a-4000-8000-000000000090` (update-in-place; no second workflow created);
- first import silently dropped node credentials -> detected via cred-check probe -> re-imported with the Telegram credential binding restored (id only, no secret);
- final publish: active=true, versionId d54bef07-6f6f-4155-87c2-6066ef8118aa, activeVersionId equal;
- NO n8n restart (publish hot-reloaded; natural tick at 14:28:41Z ran the new version successfully);
- 0 running executions interrupted.

## Live proof summary

- Live WF90 shape proof: builder present, IF→builder→Telegram wiring, HTML,
  inlineKeyboard 3-button wiring, credential id preserved, 2min/3900000ms,
  dedupe state key present, normalizer emits actionable_gate (see
  `node tools/wf90-87-live-export-proof.mjs` output in session evidence).
- Dedupe live: state row (wf90:active_alert_signature) unchanged since
  2026-09-16T13:56:42Z; 6 consecutive new-version ticks (342109..342134) ran the
  Telegram node ZERO times with SUPPRESS/UNCHANGED_ACTIONABLE_STATE.
- Qualification: canonical issuance gate WF87-QUAL-6b4fc0c9439c delivered by the
  existing service with APPROVE/REJECT buttons; operator tapped APPROVE;
  canonical admission recorded APPROVED→ISSUED (one-shot, identity-fenced);
  replay/unknown-choice/unknown-gate/foreign-operator/expired all REJECTED with
  zero state mutation.
- NOTE (bounded deviation, recorded): the FIRST attempted live E2E
  (`tools/v4-telegram-actionable-gate-e2e-v1.mjs`) sent ONE extra Telegram message
  (message_id 20) and then correctly aborted with the single-consumer CONFLICT
  fence because the canonical issuance service was already the getUpdates
  consumer. That driver was abandoned in favor of the canonical issuance path;
  it remains in the tree as evidence with a header comment not claiming canonical
  status. No callback from message 20 was admitted anywhere.

## #86 coordination

`buildActionableGateContract` is the shared metadata shape for the dashboard:
same fields Telegram renders (gate_id, task_ref, classification, reason_code,
summary/detail, choices, origin, created_at/expires_at, requires_confirmation).
No dashboard code changed.
