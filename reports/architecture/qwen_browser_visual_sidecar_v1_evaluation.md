# QWEN_BROWSER_VISUAL_SIDECAR_V1_EVALUATION

**Issue:** #78 — Qwen browser visual sidecar (screenshot/OCR/VLM fallback for Hermes)
**Mode:** EVALUATION / ARCHITECTURE SELECTION ONLY — no live implementation
**Classification:** `PASS — SELECTED_ARCHITECTURE=B (OCR-first + VLM escalation); IMPLEMENTATION_AUTHORIZED=NO; VLM_LIVE_BENCHMARK=DEFERRED_RESOURCE_SAFETY`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `be0a2daea2456ef17d0fdc8cdbfb40a5a12b3849`

## A. Existing screenshot primitives in the Hermes/CDP runtime (QUALIFIED)

- **Hermes native `screenshot` command exists.** The installed Hermes
  (`C:\Users\mrhz\AppData\Local\hermes\hermes-agent\tools\browser_tool_session.py`)
  already dispatches an `agent-browser screenshot` primitive (lines ~438–469,
  ~608–612), including path recovery from non-JSON output and a
  Lightpanda→Chrome fallback for screenshots. The visual lane can therefore
  reuse the EXACT transport Hermes already uses (same session machinery, same
  scrubbed env, same CDP URL) — no new transport, no public CDP.
- **agent-browser 0.26.0 CLI** exposes `screenshot [path]` with
  `--screenshot-format png|jpeg`, `--screenshot-quality`, `--annotate`
  (numbered labels mapped to snapshot refs `@eN` with a legend), and
  `--screenshot-dir`. `--annotate` is directly aligned with the sidecar goal
  (label↔ref mapping bridges visual boxes to actionable refs).
- **Raw CDP `Page.captureScreenshot`** works on the dedicated loopback-only
  endpoint and was exercised in the benchmark (`30323-byte valid PNG,
  median 27 ms`). CDP remains verifier/trusted-component-only — never a
  model-visible tool.
- **Focus guard precedent:** the bridge already runs a bounded CDP page-level
  command (`Emulation.setFocusEmulationEnabled`) through the qualified HTTP
  endpoint — an architectural precedent for a bounded, single-command CDP
  screenshot helper that is NOT raw CDP exposure.

## B. Capture without forbidden side effects (QUALIFIED)

- No public CDP: benchmark proved loopback-only bind (T10, `127.0.0.1` only).
- No new browser profile needed for the future live path: Hermes'
  `screenshot` runs inside the existing task session (`_get_session_info`),
  identical to every native tool call. (The benchmark itself used a throwaway
  profile confined to `%TEMP%` — T11 — only because it also had to spawn an
  isolated evaluation Chrome; the live implementation will NOT need this.)
- No cookie/token persistence, no browser reset, no navigation required:
  capture is a single CDP command against the existing page.

## C. OCR/UI detection options on the workstation (EVALUATED)

- **Tesseract/WinRT OCR: NOT installed** (`tesseract` absent; Windows OCR
  contract not usable via the probed path; no `pytesseract`, no OpenCV).
- **Python 3.14.2** has Pillow 12.3.0 (imaging OK) but no OCR engines; the
  repo policy forbids silently installing heavy deps in this evaluation task.
- **Conclusion:** the OCR/UI-detector stage has NO ready engine today.
  Candidate engines for the implementation task (on-demand, no resident
  process): RapidOCR (ONNXRuntime, ~tens of MB, CPU), or the *annotation
  route* — `agent-browser screenshot --annotate` gives numbered labels +
  legend without any OCR at all, which may satisfy most "which control is
  where" questions structurally. The benchmark proved the stage CONTRACT
  (structured output, confidence gating, fail-closed) with a deterministic
  stand-in (T3/T3B/T6); engine selection is an implementation-task decision.

## D. Small local VLM compatibility with RTX 3060 12 GB (EVALUATED, deferred)

- Current live VRAM: **Qwen primary (27B, 50 GPU layers) leaves only
  ~370–520 MiB free**. `llama-server` holds ~11.3 GiB; a second resident
  vision model does NOT fit by construction.
- Build support exists: `llama.cpp-dflash2/build-cuda/bin/mtmd.dll` is
  present (multimodal capable, `LLAMA_BUILD_MTMD:BOOL=OFF` for the main lib
  but the standalone mtmd component ships), and `llama-server` supports
  `--mmproj` for vision models.
- **No vision model is present locally**: no `*mmproj*` anywhere on `D:\AI`,
  `clip_vision` empty, no ollama vision tags (all text models).
- A 2–4B-class VLM (Qwen3-VL-2B/4B, SmolVLM, Moondream-class) at Q4 is
  1.5–3 GB — it CANNOT be co-resident with the Qwen primary (VRAM law), so
  only on-demand load/unload or CPU inference is compatible. CPU inference
  on a 2B VLM is seconds-per-image (tail risk), while GPU load/unload cycles
  add 5–15 s cold-start and risk fragmentation pressure against the primary.
- **Decision: `VLM_LIVE_BENCHMARK=DEFERRED_RESOURCE_SAFETY`.** Loading any
  model on the same GPU as the busy primary for a benchmark would directly
  risk `CANDIDATE=REJECTED_RESOURCE_PRESSURE` behavior against a production
  runtime. The law below makes the VLM a strictly optional escalation tier.

## E. Routing/fallback law (SELECTED: candidate B — OCR-first + VLM escalation)

```
DOM/accessibility (default, ~0 VRAM, ~13 ms)
   ↓ insufficient (visual ambiguity, canvas, image-only UI, no refs)
screenshot (ephemeral) + OCR/UI detector + --annotate ref mapping
   ↓ insufficient (low confidence OR ambiguity != NONE)
small local VLM, ON-DEMAND ONLY (load → infer → unload; never resident)
   ↓ still ambiguous
FAIL-CLOSED structured UNKNOWN/AMBIGUOUS (no invented targets)
```

- Qwen stays controller; Hermes stays bridge; DOM stays primary observation.
- VRAM law: sidecar never holds GPU memory across calls; VLM tier skipped
  automatically when `vram_free < threshold` (measured in the same pressure
  helper the benchmark used).
- Latency law: DOM ~13 ms ≪ OCR ~30 ms+ ≪ VLM (seconds) — escalate only on
  measured ambiguity, never speculatively.
- Every escalation must be observable: a future implementation publishes an
  `#79` activity stage (e.g. `stage=VISUAL_INSPECTION`) read-only — mapping
  documented, no #79 code changed in this task.

## F. Bounded project-owned tool surface (feasible, NOT implemented here)

`browser.capture_screenshot` / `browser.inspect_visual` /
`browser.find_visual_element` are feasible as bridge-internal operations
following the **chain-send precedent** (internal primitive, NOT added to the
model-visible `EXACT_ALLOWLIST` of 4): executed via Hermes' own screenshot
transport, returning only the structured envelope (OUTPUT CONTRACT below).
This preserves single execution authority: the sidecar observes; it never
acts on the page (no clicks/typing from the visual path in this design).

## OUTPUT CONTRACT (proven by T3B envelope)

```json
{ "observation_id": "vsc-…", "mode": "SCREENSHOT_PLUS_OCR_UI",
  "screenshot_ephemeral": true, "viewport": {"w":1280,"h":900,"dpr":1},
  "elements": [], "text_blocks": [], "candidate_targets": [],
  "confidence": 0.92, "ambiguity": "NONE|LOW_CONFIDENCE_ELEMENT|EMPTY_OBSERVATION|CAPTURE_UNAVAILABLE",
  "resource_pressure": { "vram_free_mib": 389, "ram_free_mb": 5927, "qwen": "READY" },
  "latency_ms": 40 }
```

No raw screenshots in canonical evidence (fixture PNG stayed in `%TEMP%` and
was deleted — T5/T9B).

## Measured evidence (bounded benchmark, tests/qwen-browser-visual-sidecar-evaluation/run.mjs — 15/15 PASS)

| Dimension | DOM_ONLY | SCREENSHOT_PLUS_OCR_UI | SCREENSHOT_PLUS_SMALL_VLM |
|---|---|---|---|
| median latency | **13 ms** (n=20) | **~40 ms** (capture 27 ms median + OCR-stage stand-in ~0 ms; real engine adds 100–500 ms CPU est.) | seconds (est., not measured) |
| tail latency | 14 ms (p95) | 30 ms capture p95 + OCR tail | high + cold-start 5–15 s if load/unload |
| element identification | 4/4 structural | 4/4 stand-in (contract only) | not measured |
| Qwen/Hermes round trips | 0 extra | 0 extra (sidecar tool call) | 0 extra |
| VRAM usage | 0 | ~0 (capture is Chrome-side; delta 29–94 MiB noise) | +1.5–3 GB on-demand or CPU-only |
| RAM usage | — | +~30 MB Chrome-side | VLM-dependent |
| cold-start penalty | none | none | 5–15 s (load/unload) |
| Qwen readiness impact | none (READY ≤ 41 ms throughout) | none (READY ≤ 20 ms) | RISK (unmeasured) |
| fallback behavior | — | fail-closed UNKNOWN on low conf/empty/malformed (T6/T6B/T7) | fail-closed on ambiguity |
| error modes | none observed | PNG truncation caught; empty→UNKNOWN; tiny-raster→low conf | unknown (deferred) |

Resource pressure measured before/after every phase: VRAM free 418→389 MiB
(delta 29 MiB — Chrome raster side, no model loaded), recovered to 469 MiB
after cleanup; RAM stable ±300 MB; **Qwen READY at every checkpoint
(10–41 ms), command line byte-identical before/after (T8)**.

## FAIL-CLOSED LAW (proven)

`confidence < threshold` ⇒ zero `candidate_targets` + `ambiguity=LOW_CONFIDENCE_ELEMENT` (T6B);
empty observation ⇒ `EMPTY_OBSERVATION`, zero targets (T6); capture failure ⇒
`CAPTURE_UNAVAILABLE` envelope (T3B path); malformed/truncated PNG rejected by
signature+IEND gate (T7). Coordinates/targets are never invented: the stand-in
maps measured geometry only; unknown stages/labels are dropped, not guessed.

## Safety / hard-wall proof

T5 screenshots ephemeral (temp-only, deleted); T8 Qwen stable + cmdline
unchanged; T9 no orphan processes (CDP unresponsive after taskkill, temp
removed); T10 CDP loopback-only (`127.0.0.1` bind proof); T11 throwaway
profile in temp, real Chrome profile never referenced; T12 dispatch/executor/
selector files untouched; VLM benchmark deferred rather than forced.

## Acceptance

```
CURRENT_BROWSER_CAPTURE_SURFACE=QUALIFIED
DOM_BASELINE=MEASURED
OCR_UI_PATH=EVALUATED
LOCAL_VLM_PATH=EVALUATED_OR_SAFELY_DEFERRED   (DEFERRED_RESOURCE_SAFETY)
RESOURCE_PRESSURE=MEASURED
QWEN_PRIMARY_STABILITY=PASS
SANITIZATION=PASS
EPHEMERAL_SCREENSHOT_LAW=PASS
FAIL_CLOSED_VISUAL_AMBIGUITY=PASS
NO_PUBLIC_CDP=PASS
NO_BROWSER_PROFILE_MUTATION=PASS
NO_PRODUCTION_ROUTE_MUTATION=PASS
SELECTED_ARCHITECTURE=B — OCR_FIRST_WITH_VLM_ESCALATION_ON_DEMAND
IMPLEMENTATION_AUTHORIZED=NO
```

## NEXT

`QWEN_BROWSER_VISUAL_SIDECAR_V1_MINIMAL_IMPLEMENTATION` — candidate B only,
NOT executed in this task. Implementation decisions it must take: OCR engine
(RapidOCR vs annotate-route), VLM tier feasibility re-check at that time
(still gated by live VRAM), tool surface wiring as bridge-internal ops.
