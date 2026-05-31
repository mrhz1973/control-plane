# LAST CURSOR REPORT — control-plane (rolling)

Scopo: registro su GitHub dell'output post-push verbatim di Cursor. Il verificatore del PASS legge l'hash remoto da questo file sul remoto oppure da `git ls-remote origin main` diretto, non dalla chat Cursor.

Fonte primaria del PASS resta `PROJECT_VISION.md` §7.1: hash remoto su `main`. Questo file è l'artefatto persistente di quell'hash, non una sua sostituzione.

Regole:
- Nessun segreto: token, chat_id, webhook, PAT, URL con token.
- LATEST = ultimo task reale.
- HISTORY = entry precedenti, più recente in alto.
- L'hash registrato è quello del COMMIT REALE, cioè commit 1.
- Il commit 2 che aggiorna questo file NON viene ri-registrato.
- Verifica PASS: `LATEST.real_task_commit` deve risultare nella chain di `origin/main`.

---

## LATEST

- task_ref: wf47-datatable-manual-validation-pass
- timestamp_utc: 2026-05-31T09:37:17Z
- branch: main
- real_task_commit: c286589b80f7ae1aac8ce3c3615f781f72470b83
- result_cursor: PASS

### remote_hash_verbatim — `git ls-remote origin main` post-push commit 1

```text
c286589b80f7ae1aac8ce3c3615f781f72470b83	refs/heads/main
```

### git_log_oneline_5 — `git log --oneline -5`

```text
c286589 docs: record Wf47 Data Table manual validation PASS
8f330ae docs: update rolling Cursor report
41fef73 docs: prepare Wf47 Data Table ready-import template
a0e14e3 docs: update rolling Cursor report
f0bc9a6 docs: record Wf hardened polling validation blocked
```

### git_status_short — `git status --short`

```text

```

## HISTORY

### wf47-datatable-ready-import-template-prep — 2026-05-31T09:16:57Z

- real_task_commit: 41fef737b98260a21b08d8270b36d1616d0b5686
- result_cursor: PASS

### wf-hardened-polling-manual-validation-partial-blocked — 2026-05-31T08:56:31Z

- real_task_commit: f0bc9a6a618ce424d55d3953682edd1ef2b58a79
- result_cursor: PASS

### wf-telegram-inbound-polling-hardening-prep — 2026-05-31T08:40:43Z

- real_task_commit: 9871d2dce736bef039982a1845f3aa492b440d8d
- result_cursor: PASS

### wf-telegram-inbound-polling-live-pass — 2026-05-31T08:32:57Z

- real_task_commit: fcf438007a02734fb2e7116162107201da6c3d14
- result_cursor: PASS

### wf-telegram-inbound-polling-package-prep — 2026-05-31T07:29:41Z

- real_task_commit: 2fc6d137671525ea7cc7600c1bb49aa5da8b8d8b
- result_cursor: PASS

### we-telegram-interactive-buttons-live-blocked — 2026-05-31T07:25:49Z

- real_task_commit: d2ae35a315f2ba6675c36fe461eb9dee2a575dd5
- result_cursor: PASS

### we-telegram-interactive-buttons-package-prep — 2026-05-31T07:12:07Z

- real_task_commit: 9146cce9bb6968d225657ce5934fd235d716c2ac
- result_cursor: PASS

### wd-operational-decision-packet-b-live-pass — 2026-05-31T06:53:32Z

- real_task_commit: 0b6f6adadd4c59472d051fd63cdae28ba28017cc
- result_cursor: PASS

### wd-operational-decision-packet-package-prep — 2026-05-31T05:53:50Z

- real_task_commit: 0e2f9748ac9ff5cd51cb119b36af7dd7f3a10e9d
- result_cursor: PASS

### wc-html-formatting-live-pass — 2026-05-31T01:31:37Z

- real_task_commit: 47ab57f6beb1d37ee58c06af7ec288341cc85fb4
- result_cursor: PASS

### wc-telegram-html-formatting-fix-offline — 2026-05-31T01:23:50Z

- real_task_commit: 88ab3cbe14c686473146b98df07015d867c39f9c
- result_cursor: PASS

### wc-telegram-formatting-fix-offline — 2026-05-31T01:01:50Z

- real_task_commit: aef6b45db2693c1e7c257d22f51cde1f30886072
- result_cursor: PASS

### wc-decision-packet-telegram-manual-pass — 2026-05-31T00:52:38Z

- real_task_commit: dcbcbfbe84891315ba0cb95b7225aae1ead02624
- result_cursor: PASS

### wc-decision-packet-telegram-package-prep — 2026-05-31T00:37:44Z

- real_task_commit: be16239086014d860af30d6366a0c7ca13280c71
- result_cursor: PASS

### wb-live-manual-classifier-server-pass — 2026-05-31T00:26:12Z

- real_task_commit: 7a398d963a67206ec2aa6805711303ff235bdd6b
- result_cursor: PASS

### wb-live-package-prep — 2026-05-30T00:25:44Z

- real_task_commit: 41f22884759cc20ac1a9aa392aee0780681df8a1
- result_cursor: PASS

### decision-packet-format-wb-docs — 2026-05-30T00:15:06Z

- real_task_commit: be73a99d0e6698b748d23199855b445ec39d3443
- result_cursor: PASS

### classifier-http-server-wa-offline — 2026-05-30T00:04:16Z

- real_task_commit: d6dc623790b7a030e74be794703de4e8cdf26adc
- result_cursor: PASS

### decision-packet-telegram-manual-attested — 2026-05-29T23:40:20Z

- real_task_commit: 789b5eb1281d25a3a5826759881223202e3716cd
- result_cursor: PASS

### classifier-guard-keyword-hardening-d0002c — 2026-05-29T23:29:20Z

- real_task_commit: c6a3782270bfe597029628ca0dd5dfb5fd1badd2
- result_cursor: PASS

### classifier-wrapper-c1b-live-smoke — 2026-05-29T23:02:50Z

- real_task_commit: d8ff7960653afbb39fc53867d84d1dca0bb85b81
- result_cursor: PASS

### classifier-wrapper-c1a-offline — 2026-05-29T22:53:05Z

- real_task_commit: f2e95e774138e92ef6defa1bf130f73efa21195a
- result_cursor: PASS

### cursor-prompt-preflight-v2.7 — 2026-05-29T21:14:02Z

- real_task_commit: 9cb29f8e205c56a70c9b5db42c2e9c970966d920
- result_cursor: PASS

### foundation-status-v2.6-reconcile — 2026-05-29T20:52:19Z

- real_task_commit: 22514ed320e1ccf12f627f9798fe6f0d20eb11d5
- result_cursor: PASS

### cursor-prompt-template-v1 — 2026-05-29T20:48:08Z

- real_task_commit: f2ee6d2cfe992465e9e4736d30b1636adad765db
- result_cursor: PASS

### rolling-cursor-report-v1 — 2026-05-29T20:44:01Z

- real_task_commit: ef0afe89efea20f24ed15563f53e3d6930087de8
- result_cursor: PASS
