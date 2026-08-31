# WIKI-LLM LEAN METHOD — control-plane

**Status:** canonical method candidate on `docs/wiki-llm-lean-bootstrap`
**Purpose:** keep project state recoverable while minimizing context, duplicate authority and stale semantic sources.
**Runtime authority:** none.

## 1. Design target

A fresh AI session should understand **where the project is and what happens next** without loading project history.

Target boot cost:

```text
remote HEAD
+ README AI-BOOT
+ CURRENT_FRONTIER
+ one ACTIVE WORK pointer
```

Everything else is on-demand.

## 2. Source classes — one owner per kind of truth

| Class | Canonical owner | Meaning |
|---|---|---|
| `BOOTLOADER` | `README.md` AI-BOOT block | how to enter/navigate |
| `LIVE_STATE` | `docs/runtime/CURRENT_FRONTIER.md` | where we are now |
| `ACTIVE_WORK` | GitHub issue / Backlog Item / current packet | what is open now |
| `FOUNDATION` | `docs/foundation/PROJECT_VISION.md` | architecture + invariants |
| `METHOD` | task-specific foundation/method doc | how to perform a class of work |
| `CONTRACT` | `docs/contracts/**` | machine/human work interfaces |
| `EVIDENCE_PASS` | `docs/runtime/LAST_CURSOR_REPORT.md`, verify/session artifact, test result | latest completed bounded PASS evidence |
| `EVIDENCE_STOP` | `reports/runtime/cursor-stops/*.stop.json` | immutable bounded STOP event evidence |
| `HISTORY` | PM docs, old handoffs, sessions, runtime-packets, Git history | audit trail only |
| `RUNTIME_ASSET` | workflows/tools/scripts/data | executable/rebuild artifact |

A fact should have **one authoritative class owner**. Other files point to it; they do not restate it unless a bounded snapshot is explicitly required.

## 3. No-duplication rules

Do not duplicate in bootstrap/live docs:

- foundation diagrams;
- historical decisions;
- long PASS narratives;
- STOP event history;
- old gate chains;
- current HEAD;
- entire issue bodies;
- contract schemas;
- latest report content.

Use a pointer instead.

If two active-looking documents claim the same state, one must be reclassified, superseded or merged.

## 4. LIVE STATE budget

`CURRENT_FRONTIER.md` should normally contain only:

- foundation version;
- active workstream;
- active work pointer;
- current block/status;
- gate;
- NEXT;
- small set of hard runtime invariants;
- last verified-through evidence pointer;
- essential capability statuses needed for routing.

No chronology. No remote HEAD. No session recap.

Target: roughly **≤ 60 meaningful lines** unless a temporary incident requires more.

## 5. BOOTLOADER budget

README AI-BOOT owns:

- remote authority/fallback;
- CORE BOOT;
- source precedence;
- AUTO-VIA;
- `agg`;
- context/payload guard;
- on-demand routing table.

It does **not** own runtime state, provider status, current task or history.

## 6. AUTO-VIA

Proceed automatically when all are true:

1. next step is technically determined;
2. it is inside active work scope;
3. no human policy gate is crossed;
4. evidence needed to execute is available;
5. no source conflict exists.

AUTO-VIA stops on a real decision/gate, not on generic caution.

Docs-only persistence of evidence for a task already executed is recoverable bookkeeping and does not by itself open a new runtime gate.

**Sequencing boundary:** AUTO-VIA does not authorize GPT Web to emit a new Cursor TASK DELTA while the previous Cursor prompt is still awaiting its operator-returned `agg`. The canonical sequencing rule is `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

## 7. `agg`

After a Cursor pass:

```text
remote HEAD
→ CURRENT_FRONTIER
→ ACTIVE WORK
→ inspect only Git delta since previously observed HEAD
→ if matching new cursor-stops/*.stop.json: read that one STOP artifact only
→ else LAST_CURSOR_REPORT once if relevant
→ pointed evidence only if necessary
→ summarize the completed Cursor pass to the operator
→ only then derive/emit any next Cursor TASK DELTA via AUTO-VIA
```

Never reboot the full project for `agg`. Never scan the full STOP directory or load old STOP artifacts unless a concrete dependency names them.

### 7.1 Cursor completion persistence invariant

If the result of a Cursor pass is needed to determine the next gate/NEXT, that pass must persist outcome evidence on GitHub before the operator's `agg`.

**PASS minimum:**

- exact `task_ref`;
- completed PASS result;
- deterministic evidence relevant to acceptance;
- observed repo HEAD/workspace when pertinent;
- runtime mutations performed or explicitly zero;
- exact `NEXT_GATE_CLASSIFICATION` or next block;
- no secrets/tokens;
- compact rolling evidence in `docs/runtime/LAST_CURSOR_REPORT.md`;
- `CURRENT_FRONTIER.md` updated when LIVE STATE changes.

**STOP minimum:** create one immutable file only under:

```text
reports/runtime/cursor-stops/<UTC_TIMESTAMP>__<TASK_REF>.stop.json
```

The STOP artifact is deliberately separate from `LAST_CURSOR_REPORT.md` so the rolling PASS report stays lean and does not become an intermediate event log.

Canonical outcome split:

- **PASS** → persist full bounded evidence + update frontier when applicable + normal commit/push.
- **STOP** → preserve incomplete production/test changes dirty and uncommitted; do not change frontier; do not change `LAST_CURSOR_REPORT.md`; commit/push only one new small `.stop.json` artifact.

STOP artifacts must be bounded, machine-readable, secret-free and contain enough information for GPT Web/automation to classify the first blocker without loading logs/diffs. Canonical exact rule and minimum fields: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

After either outcome, the operator sends only `agg`; GPT Web reads GitHub and derives the next pass — no manual chat relay of Cursor summaries.

If `agg` finds neither a matching new STOP artifact nor matching PASS evidence, classify:

```text
EVIDENCE_NOT_PERSISTED
```

Do **not** infer that the task was not executed.

If the operator supplies complete missing evidence in the same message, GPT Web may persist a bounded operator-relayed evidence artifact, clearly marked not independently verified, and continue AUTO-VIA when safe. Otherwise issue a bounded verify/persist-only step.

### 7.2 Prompt sequencing gate

For consecutive Cursor passes, the mandatory order is:

```text
GPT Web prompt N
→ Cursor executes N
→ operator sends `agg`
→ GPT Web refreshes canonical repo/evidence
→ GPT Web summarizes outcome N
→ only then prompt N+1
```

A provider becoming available, a quota reset, an obvious fix, or generic `vai` / `procedi` / `next` does not bypass this order while prompt N is unresolved. Only an explicit operator override that clearly names this sequencing gate may bypass it.

Canonical detail: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

## 8. Automation equivalence

The automation must reuse the exact same evidence semantics rather than inventing a parallel protocol.

Human mode:

```text
Cursor → GitHub → operator `agg` → orchestrator
```

Automation mode:

```text
Cursor → GitHub push event → orchestrator
```

A pushed `reports/runtime/cursor-stops/*.stop.json` is a machine-readable `CURSOR_STOP` event. A completed PASS follows the ordinary rolling PASS evidence/frontier path. The orchestrator reads only the artifact(s) selected by the push delta/current task.

## 9. Handoff

Default handoff is a stable seed:

```text
BOOTSTRAP control-plane.
Repo: mrhz1973/control-plane
Esegui esclusivamente CORE BOOT dal README AI-BOOT e segui AUTO-VIA.
```

Extended handoff only for state that cannot yet be derived from repo live sources.

Old handoffs are history, not LIVE STATE.

## 10. Context budget guard

- progressive acquisition;
- no large preload;
- prefer exact path/range/diff/symbol;
- evidence read once where possible;
- summarize findings in dialogue rather than material read;
- do not copy repo content into chat when a pointer is enough;
- historical dependency must be named before history is loaded.

## 11. Repository reduction taxonomy

Every candidate is classified before removal/move:

| Class | Action |
|---|---|
| `KEEP_CANONICAL` | remains in main and may be read on-demand |
| `KEEP_RUNTIME` | executable/rebuild asset retained |
| `KEEP_EVIDENCE` | immutable evidence retained but never bootstrap |
| `MERGE_THEN_SUPERSEDE` | extract unique current rules into canonical doc, then mark old source historical |
| `ARCHIVE_CANDIDATE` | useful only for audit/history; can move out of active namespace or be retained only in Git history after gate |
| `DELETE_CANDIDATE` | duplicate/error/no unique evidence; removal only after reference and recovery check |
| `STALE_BRANCH_CANDIDATE` | merged/abandoned branch; delete only after merge/recovery verification |

## 12. Safe reduction sequence

1. build inventory and classify;
2. identify inbound references to each candidate;
3. preserve unique current rules/evidence;
4. update canonical pointers;
5. verify bootstrap from a fresh session;
6. only then move/delete candidates in a dedicated cleanup PR;
7. retain Git history as recovery path;
8. verify remote main after cleanup.

No bulk deletion merely because a file is old.

## 13. Semantic-danger priority

Clean first documents that are both:

- likely to be discovered/read by an AI; and
- stale while claiming `active`, `current`, `canonical`, `start here`, `handoff`, `frontier` or equivalent.

These are more dangerous than large historical evidence files in clearly historical paths.

## 14. Quality target — 9.5

The control-plane reaches the target when:

- fresh CORE BOOT loads only the bootloader + lean frontier + one active pointer;
- no active-looking stale document competes with frontier/foundation;
- `agg` needs no broad repo scan;
- every Cursor PASS needed by `agg` persists compact rolling PASS evidence;
- every Cursor STOP needed by `agg` persists exactly one bounded immutable STOP artifact without polluting the PASS report;
- every new Cursor prompt is emitted only after the prior pass has completed its `agg` + summary sequencing gate, unless explicitly overridden by the operator;
- stale/missing outcome evidence is classified as `EVIDENCE_NOT_PERSISTED`, not as proof of non-execution;
- an incomplete Cursor job resumes from packet/checkpoint/dirty-tree evidence, not chat;
- historical files are excluded by default and clearly classified;
- canonical docs do not repeat the same state;
- stale branches are removed after verification;
- cleanup does not weaken rebuild, evidence or auditability.
