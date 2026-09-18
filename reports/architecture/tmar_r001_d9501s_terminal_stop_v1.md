# TMAR TTS R001 — D-9501-S terminal STOP

Status: **STOP — persisted / root cause proven**

Date: 2026-09-18

## Terminal evidence

Task: `LOCAL_DEV_B_D-9501-S`

Canonical local receipt observed:
- `state=STOP`
- `execution_started=true`
- `replayable=false`
- selector interpretation: `RECEIPT_STOP_BLOCKING`

Therefore the successor R001 execution is terminal and must not be automatically replayed.

## Target repository state after STOP

Target: `mrhz1973/tmar-tts`

HEAD remains:
`8f7ecaee18a7413b83a3062a5032dc0a74c1a448`

No R001 commit was produced.

Exactly the three R001-allowed tracked files are locally modified:
- `requirements.txt`
- `docs/current-state.md`
- `docs/commands.md`

The changes document the fresh-install sequence and mark R001 as being re-qualified; they do not claim PASS.

## Fresh-install evidence

Two isolated temporary venvs were created by the bounded R001 test:
- `TMAR_R001_FRESH_V1_20260918091404195`
- `TMAR_R001_FRESH_V1_20260918091916517`

Both prove:
- Python 3.11.9
- chatterbox-tts 0.1.7
- torch 2.6.0+cu126
- torchaudio 2.6.0+cu126
- CUDA available
- NVIDIA GeForce RTX 3060
- torch CUDA 12.6
- compute capability 8.6
- `check_gpu.py` exit 0

No newly generated R001 audio artifact was observed.

## Root cause — PROVEN

A bounded offline reproduction was then run in the newest R001 fresh venv with:
- Qwen 64K worker absent;
- RTX 3060 at ~769 MiB total usage;
- ~10.98 GiB free VRAM before Chatterbox load;
- `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`;
- no repository mutation and no audio-file persistence.

The reproduction failed immediately at the same model-construction call used by TMAR:

```python
ChatterboxMultilingualTTS.from_pretrained(device="cuda", t3_model="v3")
```

Exact observed error:

```text
TypeError: ChatterboxMultilingualTTS.from_pretrained() got an unexpected keyword argument 't3_model'
```

Therefore the R001 STOP is **not caused by GPU/VRAM contention**. The failure happens before model loading.

The concrete incompatibility is:
- TMAR code calls the multilingual loader with `t3_model="v3"`;
- TMAR `requirements.txt` pins released `chatterbox-tts==0.1.7`;
- the installed 0.1.7 API does not accept that keyword.

Upstream project evidence also records that `t3_model` was not accepted by the published API and caused this TypeError, while newer/unreleased source has changed again. TMAR must therefore bind its code to a dependency/API contract deliberately rather than assuming current upstream-master examples match PyPI 0.1.7.

## Separate resource-routing observation

During D-9501-S, Qwen 64K was observed resident while the target task was GPU-oriented. Avoiding two resident GPU models is still a valid architecture concern for future GPU-exclusive tasks, but it is **not the root cause of this R001 STOP** and must not be used to rewrite the historical diagnosis.

## Governance

- Do not delete, rewrite, or replay the D-9501-S receipt.
- Do not discard the three local TMAR modifications until repair disposition is decided.
- Do not promote R002.
- Repair must address the TMAR Chatterbox API/dependency mismatch first.
- Any GPU-exclusive routing enhancement belongs to a separate Control Plane slice after R001 is repaired or explicitly re-planned.
