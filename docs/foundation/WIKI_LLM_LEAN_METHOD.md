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
| `EVIDENCE` | `LAST_CURSOR_REPORT`, verify/session artifact, test result | what was observed/proved |
| `HISTORY` | PM docs, old handoffs, sessions, runtime-packets, Git history | audit trail only |
| `RUNTIME_ASSET` | workflows/tools/scripts/data | executable/rebuild artifact |

A fact should have **one authoritative class owner**. Other files point to it; they do not restate it unless a bounded snapshot is explicitly required.

## 3. No-duplication rules

Do not duplicate in bootstrap/live docs:

- foundation diagrams;
- historical decisions;
- long PASS narratives;
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

## 7. `agg`

After a Cursor pass:

```text
remote HEAD
→ CURRENT_FRONTIER
→ ACTIVE WORK
→ LAST_CURSOR_REPORT once if relevant
→ pointed evidence only if necessary
→ AUTO-VIA
```

Never reboot the full project for `agg`.

## 8. Handoff

Default handoff is a stable seed:

```text
BOOTSTRAP control-plane.
Repo: mrhz1973/control-plane
Esegui esclusivamente CORE BOOT dal README AI-BOOT e segui AUTO-VIA.
```

Extended handoff only for state that cannot yet be derived from repo live sources.

Old handoffs are history, not LIVE STATE.

## 9. Context budget guard

- progressive acquisition;
- no large preload;
- prefer exact path/range/diff/symbol;
- evidence read once where possible;
- summarize findings in dialogue rather than material read;
- do not copy repo content into chat when a pointer is enough;
- historical dependency must be named before history is loaded.

## 10. Repository reduction taxonomy

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

## 11. Safe reduction sequence

1. build inventory and classify;
2. identify inbound references to each candidate;
3. preserve unique current rules/evidence;
4. update canonical pointers;
5. verify bootstrap from a fresh session;
6. only then move/delete candidates in a dedicated cleanup PR;
7. retain Git history as recovery path;
8. verify remote main after cleanup.

No bulk deletion merely because a file is old.

## 12. Semantic-danger priority

Clean first documents that are both:

- likely to be discovered/read by an AI; and
- stale while claiming `active`, `current`, `canonical`, `start here`, `handoff`, `frontier` or equivalent.

These are more dangerous than large historical evidence files in clearly historical paths.

## 13. Quality target — 9.5

The control-plane reaches the target when:

- fresh CORE BOOT loads only the bootloader + lean frontier + one active pointer;
- no active-looking stale document competes with frontier/foundation;
- `agg` needs no broad repo scan;
- an incomplete Cursor job resumes from packet/checkpoint, not chat;
- historical files are excluded by default and clearly classified;
- canonical docs do not repeat the same state;
- stale branches are removed after verification;
- cleanup does not weaken rebuild, evidence or auditability.
