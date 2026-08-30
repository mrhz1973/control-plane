# V4 — OpenCode steps=1 → MAXIMUM STEPS diagnosis (zero generation)

**Block ID:** `V4_OPENCODE_STEPS1_MAXIMUM_STEPS_DIAGNOSIS_ZERO_GENERATION`
**Starting HEAD / expected origin/main:** `ececdae516ff1d5c57d06abda16fb20d480d2d44`
**Status:** **PASS**
**Classification:** **`EXTERNAL_SINGLE_GENERATION_GUARD_REQUIRED`**
**Mutations:** none · **Generations:** 0 · **OpenCode run:** 0

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER NEXT = this diagnosis | PASS |
| REAUTH gate CLOSED · AUTH spent | PASS |
| last REAUTH accounting OpenCode=1 / Qwen=1 / retry=0 / fallback=0 | PASS |
| no `opencode run` / no inference / no process start-stop-kill | PASS |

## Installed OpenCode resolution

| Field | Value |
|---|---|
| `Get-Command opencode` | `C:\Users\mrhz\AppData\Roaming\npm\opencode.ps1` → `opencode-ai` bin |
| `opencode --version` | **1.18.25** |
| npm package | `opencode-ai@1.18.25` |
| npm root -g | `C:\Users\mrhz\AppData\Roaming\npm\node_modules` |
| bundled binary | `...\opencode-ai\bin\opencode.exe` (~180 MB Bun-compiled) |
| platform package | `opencode-windows-x64@1.18.25` (nested optional dep) |
| installed_source_resolved | **binary string/AST extract from `opencode.exe`** (no separate JS sources shipped) |

No install/upgrade performed.

## MAXIMUM STEPS literal

| Field | Value |
|---|---|
| maximum_steps_literal_resolved | **true** — exact template `CRITICAL - MAXIMUM STEPS REACHED` present in binary as const `P_` |
| location (binary offset) | ~`102829727` |

Template semantics (sanitized): instructs text-only summary when step cap hit; overrides other instructions; forbids tools.

Schema annotation also present:

> `steps`: “Maximum number of agentic iterations before forcing text-only response”  
> `maxSteps`: deprecated alias → normalized to `steps`

`maxStepsMessage` **absent** from 1.18.25 binary (later upstream PR only).

## Exact code path (from installed binary)

`SessionPrompt.run` loop (minified names `R` / `ee` / `L` / `oa`):

1. **Initialize:** `R = 0` at loop entry.
2. **Increment:** `R++` at the start of each agentic iteration **before** the model call.
3. **Bound:** `ee = Y.steps ?? Infinity` (`1/0` in minify).
4. **Compare:** `L = (R >= ee)`  (`isLastStep`).
5. **Inject when `L`:** append assistant-role message into the LLM request:
   - Prompt path: `messages:[..., ...L?[{role:"assistant",content:oa}]:[]]`
   - Alternate runner path: `...iH?[F$.assistant(P_)]:[]` with `toolChoice: iH ? "none" : void 0`

Therefore MAXIMUM STEPS text is **OpenCode-authored**, **injected into model context as an assistant prefill** on the capped iteration — not a free-form Qwen invention, and not a post-hoc string replace of a successful JSON answer.

### Resolved live-proof agent (debug only)

`opencode --pure debug agent live-proof` against `%TEMP%\opencode-v4-live-proof-reauth\opencode.json`:

| Field | Value |
|---|---|
| name | `live-proof` |
| steps | **1** |
| model | `qwen_local` / `qwen38-original-dflash2-8k` |
| mode | primary |
| tools/permissions | deny (as configured) |

## Why REAUTH saw MAXIMUM STEPS on the first generation

With **`steps = 1`**:

| Loop moment | `R` after `R++` | `ee` | `L = R>=ee` | Effect |
|---|---|---|---|---|
| first iteration | **1** | 1 | **true** | FIRST model call already receives MAX_STEPS assistant injection |

So `steps=1` does **not** mean “one normal answer then stop”.
It means “the sole allowed iteration **is** the forced text-only max-steps turn.”

That matches observed live events:

`step_start` → `text` (MAX_STEPS body) → `step_finish(reason=stop)`

with **one** reconciled model generation.

### Token accounting (`input≈495`, `output=1`, long MAX_STEPS text)

- OpenCode injects the long MAX_STEPS assistant prefill into the request (`content:oa` / `P_`).
- Provider usage reported **output=1** (almost no new completion tokens).
- Event `text` structurally matched the OpenCode template, not the required proof JSON.

Conclusion: observed assistant text is the **injected constraint surface** (prefill/template path), while accounting still records **one** model invocation with negligible new tokens — consistent with prefill-dominated last-step behavior, not a successful free JSON completion.

## One-generation semantics (source-derived, no live call)

| Config | Max model generations (upper bound from loop) | Usable first free response? | MAX_STEPS injection? |
|---|---|---|---|
| `steps` omitted | **unbounded** (`Infinity`) until natural exit / interrupt / other breakers | yes (no forced last-step inject) | only if some other path hits a finite cap (not by default) |
| `steps = 1` | **1** | **no** — first call is already last-step | **yes on generation #1** |
| `steps = 2` | **2** | **yes** on generation #1 | **yes on generation #2** |

### Related controls

| Control | Effect |
|---|---|
| tools disabled / permissions deny | does **not** disable the steps counter or last-step injection |
| `finish_reason=stop` | exits loop after that iteration when finish ∉ {`tool-calls`,`unknown`} and no unresolved local tools — **does not prevent** last-step injection when `R>=steps` already true **before** the call |
| `experimental.continue_loop_on_deny` | when not `true`, deny sets `shouldBreak` — can end after a denied tool turn; **still does not make `steps=1` usable** |

**Do not use `steps=2` as the live-proof fix:** it can restore a usable first response but **raises the hard upper bound to 2 generations**, which violates the one-shot AUTH budget.

## Diagnosis classification

### **`EXTERNAL_SINGLE_GENERATION_GUARD_REQUIRED`**

Stock OpenCode 1.18.25 config cannot simultaneously prove:

1. a **usable** first model response (no MAX_STEPS contamination), and  
2. a **hard upper bound of exactly one** model generation,

without either accepting `steps=1` contamination or allowing `steps≥2` (two generations possible).

`steps` omitted + tools deny may *often* stop after one turn when the model returns `stop` or denied tools break the loop, but source also admits additional loop continuations (e.g. compaction/overflow paths, `finish` in {`tool-calls`,`unknown`}). That is **not** a proven hard single-generation bound.

`maxStepsMessage=false` (upstream later) is **not** in 1.18.25.

| Field | Value |
|---|---|
| diagnosis_classification | **EXTERNAL_SINGLE_GENERATION_GUARD_REQUIRED** |
| safe_config_delta | **none proven** for simultaneous usable-first + max-1 |
| external_guard_required | **true** |
| opencode_patch_required | **false** for this classification (guard preferred over patch/upgrade in-scope) |

### Minimum offline guard contract (specify only — do not implement here)

Deterministic wrapper around a future authorized live proof:

1. Invoke OpenCode noninteractive once under tools-deny config **without relying on `steps=1` for the generation ceiling**.
2. Enforce **hard stop after the first model completion** (`step_finish` / first provider chat completion), preventing any second LLM call.
3. Fail closed if a second generation is attempted.
4. Keep tools denied; no GLM/Codex/LiteLLM; no repo mutation by OpenCode.
5. Do **not** set `steps=2` as the generation bound.

## Counters (this pass)

| Counter | Value |
|---|---|
| opencode_execution_count | **0** |
| qwen_generation_calls | **0** |
| process_start_calls | **0** |
| process_kill_calls | **0** |
| process_stop_calls | **0** |
| runtime_restart_calls | **0** |
| secret_exposure | **false** |

## NEXT

**`V4_OPENCODE_SINGLE_GENERATION_GUARD_OFFLINE`** — deterministic offline implementation of the external single-generation guard. No runtime AUTH. No live OpenCode/Qwen call in that block until a later fresh human gate.

---

## Output line

`PASS — OPENCODE STEPS=1 DIAGNOSIS / EXTERNAL_SINGLE_GENERATION_GUARD_REQUIRED / GENERATIONS=0`
