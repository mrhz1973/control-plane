# QVAL3 cold-state gate evidence

Campaign: `V4_QWEN_INDEPENDENT_3RUN_QUALIFICATION_CAMPAIGN_V1`
Task to release: `D-9405-C`

## Preconditions

- D-9405-A executor-pass: `0fdf3fc1d37b5e328e7c4d72933605dd06006852`
- D-9405-B executor-pass: `e0fdc51ca18bf7c128440f5d58201bc760a7a98f`
- no Cursor / GLM / Codex / Hermes model assistance used to create the cold state
- no manual `/v1/tick`

## Operator-observed cold-state preparation

The operator performed an identity-gated Windows process action against the exact local Qwen 64K worker while preserving the canonical router.

Observed evidence:

```text
ROUTER_PID=21204
ROUTER_IDENTITY=PASS
QWEN64K_WORKER_PID=53156
STOPPING_EXACT_64K_WORKER=PASS
ROUTER_STILL_ALIVE=PASS
QWEN64K_STATUS=unloaded
COLD_STATE=PASS
```

Process identity before stop:

- router: `python.exe` with command line matching `qwen_runtime_router.py`
- exact 64K worker: `llama-server.exe`, descendant of the canonical router tree, command line matching `qwen38-opus-q3-opencode-64k`
- only the exact 64K worker PID was stopped
- the router remained alive after the stop

Post-stop `/v1/models` evidence reported the exact profile:

```text
id=qwen38-opus-q3-opencode-64k
status.value=unloaded
```

## Gate result

```text
QVAL3_COLD_STATE_PREP=PASS
QWEN64K_PROFILE=qwen38-opus-q3-opencode-64k
QWEN64K_COLD_STATUS=unloaded
ROUTER_PRESERVED=YES
D9405C_RELEASE_AUTHORIZED=YES
```

This evidence releases only the pre-existing `D-9405-C` qualification task. It does not itself qualify Qwen. Qualification still requires natural WF90 autorecovery, D-9405-C executor-pass, and the required post-C clean natural ticks.
