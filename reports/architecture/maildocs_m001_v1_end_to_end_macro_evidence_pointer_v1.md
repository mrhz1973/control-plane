# Maildocs M001 — control-plane evidence pointer

Consumer: `mrhz1973/Automazione-Posta-Documenti-Gdrive`
App macro issue: #17
Control-plane authorization: #131

## Verdict

`PASS_WITH_HUMAN_GATES`

## App commit

`9a59adb8bcb5ec61e849979ec15d4819ecd2e786`

## Evidence index (app repo)

`reports/architecture/maildocs_m001_v1_end_to_end_macro_evidence_v1.md`

## R004C baseline (unchanged)

- implementation: `4bb2259bd8e166e5fa306d8c60efb8fcc9832b31`
- docs: `122fcc78b39f3b5c73b1ef1815b331c5def7c84d`
- evidence: `37a1ed77c507075748d9e2f2a5021dc8c6d8d6f8`

## Human gates (7)

See app `docs/human-gates.md`:
HUMAN_GATE_ENEL_SAMPLE, HUMAN_GATE_AGN_SAMPLE, HUMAN_GATE_WATER_SAMPLE,
HUMAN_GATE_DRIVE_OAUTH, HUMAN_GATE_SHEETS_OAUTH, HUMAN_GATE_PAYMENT_SOURCE,
HUMAN_GATE_GMAIL_WRITE_OAUTH.

## Invariants

- SECRETS_EXPOSED=0
- No Gmail/Drive destructive mutations in M001
- WF01 remains sole Maildocs ACTIVE workflow
- No n8n/PG container replacement for M001

