# V4 Qwen 96K endurance / stability — 3-cycle V2

Date: 2026-09-07 (Europe/Rome)

## Scope

Manual workstation validation of the known out-of-Control-Plane-scope profile:

- profile/model: `qwen38-opus-q3-blender-96k`
- route: `:18080` model-manager -> `:61978` worker
- declared context: `n_ctx=98304`
- hardware observed: NVIDIA GeForce RTX 3060 12 GiB, driver 591.86, CUDA 13.1
- test shape: 3 distinct long-context cycles, ~67K–70K prompt tokens each, 300 s cooldown between cycles, 1800 s timeout per cycle
- low-cache stress: required; all cycles observed `CACHED_TOKENS=0`

This evidence does **not** admit the 96K profile into Control Plane routing. `qwen38-opus-q3-blender-96k` remains a workstation-local profile explicitly OUT OF CONTROL PLANE SCOPE under the current Qwen routing policy.

## V1 disposition

The preceding V1 attempt is classified:

`INVALID_TEST_OVERSIZE`

because the generated prompt measured 109818 tokens against `n_ctx=98304`. That run is not evidence of a model/runtime failure.

## V2 observed result

Harness final classification:

`QWEN_96K_ENDURANCE_STABILITY_3CYCLE_V2=PASS`

Local log path reported by the operator:

`C:\Users\mrhz\Desktop\QWEN_96K_ENDURANCE_STABILITY_3CYCLE_V2.log`

### Cycle results

| Cycle | Project | Prompt tokens | Completion tokens | Total tokens | Cached tokens | HTTP | Semantic | Elapsed s | Finish reason | Manager health after | Worker health after | PID stable | Harness PASS |
|---|---|---:|---:|---:|---:|---:|---|---:|---|---:|---:|---|---|
| 1 | ORION | 67107 | 1200 | 68307 | 0 | 200 | True | 1605.9 | `length` | 200 | 200 | True | True |
| 2 | VEGA | 69417 | 990 | 70407 | 0 | 200 | True | 1312.5 | `stop` | 200 | 200 | True | True |
| 3 | ATLAS | 70147 | 1066 | 71213 | 0 | 200 | True | 1470.9 | `stop` | 200 | 200 | True | True |

Total inference elapsed reported by harness: `4389.3 s` (~73.16 min), excluding the two explicit 300 s cooldown intervals.

All three semantic checks selected the authoritative `LIVE_STATE` over deliberately stale/superseded historical/chat material and returned the expected host/IP/RAM/owner/gate/NEXT fields.

Cycle 1 ended by the configured completion-length boundary, but still returned HTTP 200, `SEMANTIC_PASS=True`, healthy manager/worker endpoints, stable PIDs, and `CYCLE_1_PASS=True`; it is therefore not classified as a runtime failure by this harness.

## Process continuity / health evidence

Model-manager process remained the same end-to-end:

- port `18080`
- PID `16468`
- start time `2026-09-06T19:50:37.9584268+02:00`
- health start/end `200/200`

Worker process remained the same end-to-end:

- port `61978`
- PID `25228`
- start time `2026-09-06T23:58:03.5110974+02:00`
- health start/end `200/200`

Harness end-state:

- `LOW_CACHE_STRESS_ALL_CYCLES=True`
- `PROCESS_STABLE_END_TO_END=True`
- no worker/model-manager restart observed during the three cycles

## Resource observations

GPU VRAM remained effectively saturated but stable:

- start: `12014 MiB / 12288 MiB`
- after cycle 1: `12036 MiB`
- after cycle 2: `12081 MiB`
- after cycle 3: `12022 MiB`
- end: `12029 MiB`
- peak observed in this log: `12081 MiB`

GPU temperature rose from 45 C before cycle 1 to a maximum observed 69 C after cycle 3, with no health failure or worker restart.

Worker memory/process counters show a noteworthy trend that the PASS harness itself does not adjudicate:

- working set: `13,621,649,408` -> `10,471,706,624` bytes (about -2.93 GiB, -23.1%)
- private bytes: `18,031,448,064` -> `21,541,257,216` bytes (about +3.27 GiB, +19.5%)
- handles: `254` -> `273` (+19)

The private-byte/handle increase is **not sufficient by itself to prove a leak**, because allocator/KV/runtime retention and Windows process accounting can persist across requests. Conversely, this 3-cycle test is also **not sufficient to claim leak-free reclamation**. A bounded post-endurance restart/reload persistence check would be the appropriate follow-up if memory-reclamation behavior needs to be qualified.

## Classification

- V1 oversized test: `INVALID_TEST_OVERSIZE`
- V2 long-context request validity: `PASS`
- 3/3 HTTP request completion: `PASS`
- 3/3 semantic precedence retrieval: `PASS`
- zero-cache stress across all cycles: `PASS`
- manager/worker health persistence: `PASS`
- same-PID endurance across all cycles: `PASS`
- GPU stability under the observed run: `PASS`
- absence of memory leak: `NOT_PROVEN`
- restart/reload persistence after endurance: `NOT_TESTED`
- Control Plane automatic-routing eligibility change: `NO`

## Operational conclusion

The corrected ~70K-token V2 harness closes the open long-context endurance question at the level it was designed to test: three distinct ~67K–70K zero-cache cycles completed successfully against the 96K workstation profile with correct semantic retrieval, HTTP 200, persistent health, and no process restart.

This is materially different from V1, whose 109818-token prompt exceeded the configured 98304-token context and therefore never constituted a valid model/runtime endurance failure.

No production/WF40/D-0025 authorization or routing state is changed by this evidence. The profile remains workstation-local and out of Control Plane automatic routing scope.
