# L5 Permanent Scope and Endurance Plan — control-plane

**Repository:** `mrhz1973/control-plane`
**Documento:** `docs/runtime/L5_PERMANENT_SCOPE_AND_ENDURANCE_PLAN.md`
**Created:** 2026-07-19 — D-0080-W / D-0079-E option `"3"`
**Lingua:** English (operational fields) / Italian notes where inherited

```yaml
document_status: DRAFT_SCOPE_APPROVED_FOR_PLANNING_ONLY
runtime_authorized_by_document: false
endurance_runtime_authorized: false
permanent_l5_authorized: false
permanent_schedule_authorized: false
L5_PASS: NOT_CLAIMED
```

---

## 1. Purpose and status

This document defines the planning scope for a future permanent L5 claim and the endurance evidence package required before any such claim.

D-0079-E option `"3"` authorizes **planning and documentation only**. It does **not** authorize endurance runtime, permanent Schedule, permanent L5 activation, or L5_PASS.

Related retained evidence: D-0074-E / D-0077-W `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L5_BOUNDED_OPERATIONAL_PILOT` remains valid **only** within its original bounded one-shot scope. That authorization is **consumed**.

---

## 2. Difference between bounded pilot and permanent L5

| Dimension | Bounded pilot (D-0074-E) | Permanent L5 (future) |
|---|---|---|
| Authorization | one-shot Decision Packet | separate permanent claim Decision Packet |
| Duration | ≤5 minutes | enduring supervised operation |
| Executions | ≤5 wf47 polls | ongoing within permanent policy |
| Schedule | temporary, torn down | only if separately authorized |
| `enable_wg48_handoff` | temporary true → teardown false | policy-defined; not auto-true |
| Claim | scope-limited operator-attested PASS | `L5_PASS` only after evidence review |
| Current state | consumed; not currently authorized | `NOT_CLAIMED` / deferred |

---

## 3. Included assets

Planning scope may include:

- **wf47** as supervised scheduled polling component;
- **wf48** as triggerless callable-only inspection/close dependency;
- **control_plane_decisions_test** Data Table;
- operator Telegram response path;
- n8n execution history and operator-visible diagnostics;
- manual kill switch and teardown procedure.

---

## 4. Excluded assets

Explicitly exclude unless separately authorized later:

- wf49;
- autonomous wf48;
- Telegram Trigger;
- public webhook;
- permanent Schedule activation (by this document);
- PM-34 execution or unlock;
- production worker execution;
- provider AI APIs;
- `n8n_ready=true`;
- unsupervised autonomous operation.

---

## 5. Operator supervision model

- Human operator remains **mandatory**.
- Operator can immediately unpublish/deactivate wf47.
- Operator can disable Schedule.
- Operator can revert `enable_wg48_handoff=false`.
- No automatic recovery may silently expand authorization.
- Unexpected Telegram, duplicate close, repeated errors, or wrong decision correlation require **fail-closed stop**.

GPT-B owns n8n workflow authoring and supervised UI instructions. Cursor does not operate n8n or invent workflow changes from this planning document.

---

## 6. Runtime authorization model

```yaml
endurance_runtime_authorized: false
permanent_l5_authorized: false
l5_activation_authorized: false
l5_runtime_authorized: false
permanent_schedule_authorized: false
```

Any endurance execution requires a **later explicit Decision Packet** that sets bounded duration, maximum execution count, and teardown obligations.

Permanent activation requires a **later dedicated decision after evidence review**.

---

## 7. Permanent Schedule separation

Permanent Schedule authorization is a **separate gate** from:

1. Scope Document approval;
2. endurance evidence package authorization;
3. endurance evidence execution/review;
4. permanent L5 claim decision.

This document does **not** authorize permanent Schedule. Current invariant: `permanent_schedule_count: 0` · `permanent_schedule_authorized: false`.

---

## 8. Observability requirements

The operator must be able to determine:

- current workflow publication/activity state;
- Schedule state;
- current handoff flag (`enable_wg48_handoff`);
- execution success/failure;
- handled update ID;
- open decision count;
- block reason;
- whether teardown completed.

Insufficient observability is a FAIL / STOP condition for future endurance evidence.

---

## 9. Kill-switch requirements

Operator must be able to:

- stop new polls;
- prevent further wf48 handoff;
- leave no permanent Schedule;
- preserve decision-store consistency;
- return to manual supervision.

Kill-switch failure is a FAIL / STOP condition.

---

## 10. Restart behavior requirements

Future endurance evidence must validate behavior after controlled restart of the relevant n8n/VPS component:

- offset/state continuity;
- no duplicate close;
- safe manual fallback if state is ambiguous.

---

## 11. Duplicate-handling requirements

Validate against:

- repeated Telegram update or repeated parseable response;
- already-closed decision;
- stale update;

and verify **no second mutation**.

---

## 12. Failure-mode requirements

At minimum inject/observe:

- wf48 unavailable or handoff failure;
- Data Table read/write failure;
- malformed Telegram response;
- no parseable response;
- missing allowed-chat configuration;
- operator timeout;
- unexpected execution error.

All must **fail closed** without unauthorized expansion of automation.

---

## 13. Endurance evidence package

One bounded evidence package (authorized only by a later Decision Packet) containing:

### A. Multi-cycle endurance
- multiple decision cycles rather than one;
- bounded duration and maximum execution count set by that later Decision Packet;
- no permanent activation during testing.

### B. Restart behavior
- controlled restart of relevant n8n/VPS component;
- offset/state continuity;
- no duplicate close;
- safe manual fallback.

### C. Duplicate handling
- repeated update/response;
- already-closed decision;
- stale update;
- no second mutation.

### D. Failure-mode injection
- scenarios listed in §12.

### E. Observability validation
- requirements in §8.

### F. Kill-switch validation
- requirements in §9.

### G. Teardown validation
Expected final state after evidence package:

```yaml
wf47_active: false
wf47_published: false
wf47_schedule_enabled: false
enable_wg48_handoff: false
wf48_autonomous_trigger_present: false
permanent_schedule_count: 0
open_count: 0
```

---

## 14. PASS/FAIL criteria

### PASS (future evidence package)
May pass only if:

- all authorized scenarios remain within explicit runtime bounds;
- no unauthorized trigger appears;
- no public webhook appears;
- no autonomous wf48 appears;
- no duplicate decision mutation occurs;
- restart does not create duplicate or stale side effects;
- failure scenarios fail closed;
- operator observability is sufficient;
- kill switch and teardown complete;
- final decision-store state is consistent.

### FAIL / STOP conditions
- unexpected Telegram output;
- unauthorized workflow activation;
- execution beyond authorized count or duration;
- duplicate close;
- incorrect decision correlation;
- Data Table inconsistency;
- inability to determine current runtime state;
- kill switch failure;
- teardown failure;
- wf48 autonomous trigger;
- public webhook or Telegram Trigger;
- PM-34 involvement.

---

## 15. Teardown and deactivation plan

Every authorized evidence window must end with immediate teardown to the safe state in §13.G. Permanent activation is never the default end state of an evidence package.

---

## 16. Hard invariants

```yaml
Gate_E_full: PASS
Gate_E_status: CLOSED
L5_PASS: NOT_CLAIMED
l5_activation_authorized: false
l5_runtime_authorized: false
endurance_runtime_authorized: false
permanent_schedule_authorized: false
PM_34: BLOCKED
pm34_unblocked: false
n8n_ready: false
enable_wg48_handoff: false
permanent_schedule_count: 0
public_webhook_count: 0
telegram_trigger_count: 0
wf40_active: true
wf41_active: false
wf42_active: true
wf47_active: false
wf47_published: false
wf47_schedule_enabled: false
wf48_publication_mode: triggerless_callable_only
wf48_autonomous_trigger_present: false
wf49_included: false
```

---

## 17. Required future gates

These gates remain **separate**:

1. approval of this L5 Scope Document;
2. authorization of the bounded endurance evidence package;
3. execution and review of endurance evidence;
4. permanent L5 claim decision;
5. permanent Schedule authorization;
6. eventual deactivation or rollback gate.

**D-0079-E option `"3"` authorizes planning and documentation only. It does not authorize gates 2–6.**

---

## 18. Claim boundaries

**Claimed by this document:**

- permanent L5 is deferred pending endurance evidence;
- planning scope and evidence requirements are defined;
- bounded pilot PASS is retained within original scope;
- no runtime is authorized by this document.

**Not claimed:**

- `L5_PASS`;
- endurance runtime authorization;
- permanent Schedule;
- autonomous wf48;
- PM-34 unlock;
- `n8n_ready=true`;
- independent third-party runtime verification.

---

**Fine documento.**
