# TMAR TTS R001 — repair and fresh-install qualification PASS

Status: **PASS — persisted / sequencing released**

Date: 2026-09-18

## Scope

Target repository: `mrhz1973/tmar-tts`

Original verified base:
`8f7ecaee18a7413b83a3062a5032dc0a74c1a448`

Final verified target commit:
`ed5968a249b37934670804f99a22a79ad583ea0a`

Commit message:
`fix Chatterbox V3 dependency contract and requalify R001`

## Repair

The published `chatterbox-tts==0.1.7` package did not accept the already-used
`t3_model="v3"` loader argument. TMAR now pins Chatterbox to the immutable
upstream commit:

`5de7a54aa4e5e2baadb0182dde554908b48b85c2`

The direct-reference provenance is the authoritative install identity even
though upstream's package metadata at that commit still declares version 0.1.7.

## Fresh qualification evidence

A new isolated Python 3.11 environment was used:
`%TEMP%\TMAR_R001_REPAIR_20260918125152`

Verified:
- Python 3.11.9
- torch 2.6.0+cu126
- torchaudio 2.6.0+cu126
- CUDA available = true
- NVIDIA GeForce RTX 3060, 12 GB, compute capability 8.6
- `check_gpu.py` exit 0
- no `qwen38-opus-q3-opencode-64k` worker resident before generation
- one real Italian CLI generation exit 0
- WAV output non-zero: 20,687,120 bytes
- MP3 output non-zero: 4,311,404 bytes
- `pip freeze` resolves Chatterbox to the exact immutable upstream commit

## Repository persistence

Exactly the three authorized tracked paths changed:
- `requirements.txt`
- `docs/current-state.md`
- `docs/commands.md`

Push completed normally, no force. Target remote main is verified at
`ed5968a249b37934670804f99a22a79ad583ea0a`.

## Historical receipts

`D-9501-R` and `D-9501-S` remain historical and untouched. Their prior
EXECUTING/STOP receipt states are not rewritten. The repair PASS is represented
by the final target commit and this closure artifact.

## Sequencing

R001 is complete. The R002 dependency gate is technically released, but the
open LOCAL_DEV dispatcher incident #93 remains the next Control Plane
infrastructure cleanup gate before starting additional TMAR engineering work.
