# PM-48 Codex runner v3 — strict marker FAIL

Date: 2026-05-23
Status: FAIL / NO STRICT MARKERS

## Scope

This session records one controlled PM-48 one-shot Codex runner v3 probe.

## Preconditions

Operator output confirmed:

- branch `main`;
- workspace clean before and after;
- HEAD `5900863` (`docs: reflect PM-34 preview smoke pass`);
- `codex.cmd` available at `C:\Users\mrhz\AppData\Roaming\npm\codex.cmd`;
- `codex-cli 0.133.0`;
- no n8n import;
- no workflow edit;
- no worker enablement;
- no OpenClaw gateway.

## Invocation

One Codex invocation was made using the PM-48 v3 known-good manual pattern:

```text
codex.cmd exec --sandbox read-only --cd <repo> <prompt>
```

No retry was performed.

## Observed result

Sanitized result only:

| Field | Value |
|---|---|
| `CODEX_EXIT_CODE` | `0` |
| `HAS_START_MARKER` | `False` |
| `HAS_END_MARKER` | `False` |
| `STRICT_PASS_CANDIDATE` | `False` |
| `git status --short` after probe | clean |

Raw Codex stdout/stderr is not committed.

## Interpretation

PM-48 did not produce the required PM-37 marker-delimited JSON block.

This is not an n8n-usable artifact.
This is not a validated `strict_pass` artifact.
This does not unblock PM-34 real worker execution.

## Safety boundaries

Confirmed:

- no n8n import;
- no workflow 40 edit;
- no workflow 41 edit;
- no worker execution beyond the one local Codex CLI probe;
- no OpenClaw gateway runtime;
- no secrets committed;
- no raw stdout/stderr committed.

## Next boundary

Do not retry PM-48 without a new explicit gate.

Any next step should diagnose why Codex returned exit 0 without strict markers, or switch to a safer output-capture strategy before PM-34 real worker integration is reconsidered.
