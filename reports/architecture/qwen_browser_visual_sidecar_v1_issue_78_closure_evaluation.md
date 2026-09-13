# QWEN_BROWSER_VISUAL_SIDECAR_V1_ISSUE_78_CLOSURE_EVALUATION

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_ISSUE_78_CLOSURE_EVALUATION`
**Mode:** CLOSURE EVALUATION ONLY — no implementation, no issue mutation
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `c4ad487bc5cc7bb0bea7f0ec2922a71e7ea3d3e2`

## DECISION

```
ISSUE_78_CLOSURE_ELIGIBLE=YES
MINIMUM_CAPABILITY_COMPLETE=YES
OCR_ESCALATION_REQUIRED_NOW=NO
VLM_ESCALATION_REQUIRED_NOW=NO
```

Recommendation: close issue #78 as **minimum capability complete**, with the
explicit note that OCR and local-VLM remain **future enhancements,
evidence-gated** (activate only if real evidence shows `--annotate` is
insufficient). The issue's "preferred layered design" is a preference, not an
obligation to install every tier: tier 2 (UI detection) is covered in an
equivalent-or-stronger way by the annotate/ref-mapping route, and tier 3
(VLM) stays resource-gated exactly as the issue itself requires.

## Verification matrix — issue #78 acceptance vs. real state

Evidence sources: `qwen_browser_visual_sidecar_v1_evaluation.md` (benchmark
15/15), `qwen_browser_visual_sidecar_v1_failure_path_bounding_repair.md`
(suite 28/28), `qwen_browser_visual_sidecar_v1_runtime_wiring.md` (real-path
wiring 23/23). All runs on this exact tree/HEAD.

| # | Issue acceptance | State | Evidence |
|---|---|---|---|
| 1 | DOM/accessibility remains default + fully functional | **SATISFIED** | Adapter DOM gate is step 1; rich page ⇒ `SUFFICIENT, sidecar_calls=0, visual=null` (wiring T1). DOM ~13 ms baseline measured. |
| 2 | Visual observation is opt-in/fallback, not mandatory | **SATISFIED** | `observeVisually()` fires ONLY on deterministic `INSUFFICIENT`; nothing else invokes it (wiring T1/T2; implementation T1). |
| 3 | Real screenshot path present | **SATISFIED** | Live annotated capture via the SAME agent-browser transport Hermes uses (pinned vendor exe, daemon-law `connect` flow) — implementation T2B/T3 28/28. |
| 4 | UI/element detection available (annotate/ref mapping) | **SATISFIED** | `annotations[]` (number/ref/role/box) → `elements/candidate_targets/refs` with `@e1..@e3` proven live on the real caller (wiring T3B/T4). See OCR/VLM analysis below. |
| 5 | Structured result returns to QWEN_LOCAL | **SATISFIED** | `hermes-visual-observation-wiring-v1` envelope at the controller-facing layer with elements/refs/confidence/ambiguity/resource_pressure/latency (wiring T3B). |
| 6 | Qwen stays controller | **SATISFIED** | Observation-only surface; no action authority (T11); Qwen health gate precedes any visual work; visual result is advisory data, never authority. |
| 7 | Hermes stays bridge | **SATISFIED** | The wired path goes THROUGH the real Hermes bridge (`exec-tool browser_snapshot`, Barrier-2 allowlisted) and Hermes' own agent-browser transport; no second browser stack. |
| 8 | No regression in QWEN_LOCAL→HERMES→Chrome/CDP | **SATISFIED** | MCP gate 37/37, dispatcher 69/69, #79 lane 23/23, sidecar 28/28, wiring 23/23; Hermes config untouched (ephemeral `HERMES_HOME`, config never mutated). |
| 9 | No credentials/cookies/session material persisted | **SATISFIED** | Screenshots ephemeral (temp + CLI dir = 0 pngs, T6); no persistence surface in helper/adapter (T14); telemetry sanitized, zero image data (T16B). |
| 10 | No public CDP exposure | **SATISFIED** | Loopback-only bind proofs (T12 in all suites); vendor daemon used only as Hermes' own transport. |
| 11 | No production dispatch / authorization expansion | **SATISFIED** | No task/claim/receipt/selector surface touched; only `browser_snapshot` (already allowlisted) — no 5th model-visible tool; OCR/VLM never installed. |
| 12 | Deterministic fail-closed (ambiguity/resource/failure) | **SATISFIED** | `EMPTY_ANNOTATIONS` (canvas-only, zero targets), `AMBIGUOUS`, `UNAVAILABLE` (bounded tree-kill, 10.5 s via real caller), `BLOCKED_QWEN_UNHEALTHY` — all proven with zero invented targets. |
| 13 | Workstation resource compatibility (RTX 3060 12 GB + resident Qwen) | **SATISFIED** | Zero-GPU design: annotate is Chrome-side raster + CPU parsing; VRAM delta noise only (~29–94 MiB, evaluation benchmark); Qwen READY at every checkpoint (10–42 ms); no resident process. |
| 14 | Autovia compatibility without authority expansion | **SATISFIED** | `AUTOVIA_CAN_USE_REAL_BROWSER_OBSERVATION_PATH=YES` demonstrated on the qualified runner path (wiring T_AUTOVIA); read-only; no selector/claim/policy change; no autonomous task activated. |

Issue benchmark-plan items (median/tail latency, element-ID rate, round
trips, VRAM/RAM, primary readiness, sidecar-unavailable recovery): all
measured — DOM 13 ms / annotated ~330 ms (cold connect ~20 s bounded),
`@eN` identification live, 0 extra Qwen/Hermes round trips, VRAM ~0 delta,
Qwen READY throughout, recovery = fail-closed structured envelope.

## OCR/VLM explicit evaluation

**Does `screenshot --annotate` satisfy the MINIMUM UI-detection capability?**
YES. For the surface that matters to a DOM-first controller — which control
is where, with a trustworthy identity and geometry — the annotate route
delivers the same answer OCR would, from a MORE reliable source: element
identity comes from the accessibility tree (the same source as the DOM
snapshot), not from pixel pattern recognition. The evaluation report already
anticipated this ("may satisfy most 'which control is where' questions
structurally"), and the implementation phase's open decision
("RapidOCR vs annotate-route") was resolved in favor of annotate, then proven
live and wired.

What OCR adds only: text existing solely as pixels (canvas text, bitmapped
images). The issue routes that class of page to the VLM tier (tier 3) — and
the minimum-capability law covers it correctly today with a deterministic
fail-closed `EMPTY_ANNOTATIONS` (zero invented targets, proven on the
canvas-only fixture) instead of a best-effort guess.

**OCR_ESCALATION_REQUIRED_NOW=NO** — no current capability gap requires it;
future trigger: repeated real failures where pixel-only text is the blocking
element and DOM cannot see it.
**VLM_ESCALATION_REQUIRED_NOW=NO** — remains resource-gated by design
(resident Qwen leaves ~370–520 MiB free; on-demand load/unload or CPU-only,
5–15 s cold-start, tail risk); the issue itself demands fail-closed under
resource pressure, which the current design honors by NOT loading models.

## Hard walls respected

Evaluation only; no issue mutation; no OCR install; no VLM install; no
production dispatch; no route activation; no browser action/send; no
unrelated changes; REAL_CHATGPT_WEB_SENDS=0.

## NEXT

`bounded issue #78 closure persistence only` — the closure comment/note for
the issue (OCR/VLM = future enhancements, evidence-gated) is left to the
operator-authorized closure step; this task did not mutate the issue.
