# D-0032-W — Field-validation end-to-end manuale — PASS attestato

## Contesto

D-0032-W Passo 3 ha validato manualmente il trasporto one-shot:

Ryzen/control-plane → verifier locale → uploader SFTP → inbox VPS → workflow 57 manual reader → cleanup.

Nessuna schedule, nessun loop, nessuna attivazione workflow, nessun PM-34 unlock, `n8n_ready=false`.

## Invarianti

* PM-34: BLOCKED.
* `n8n_ready=false`.
* wf40/wf42 untouched.
* workflow 41 off.
* workflow 57 Manual Trigger only, active=false.
* No Telegram Trigger.
* No Funnel.
* No public webhook.
* No wrapper HTTP.
* No callable-from-n8n worker.
* No secrets in Git.

## Evidenze

### 1 — Ryzen / repo control-plane — pull

```text
PS C:\Users\mrhz> Set-Location "C:\Users\mrhz\Documents\AI\GitHub\control-plane"
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane> git pull --ff-only origin main
From https://github.com/mrhz1973/control-plane
 * branch            main       -> FETCH_HEAD
Already up to date.
```

### 2 — Ryzen / repo control-plane — HEAD

```text
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane> git rev-parse HEAD
966f508d5b153a02421b5acecaac78a5c7c85535
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane>
```

### 3A — Prima invocazione script — blocker ExecutionPolicy

```text
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane> powershell -File tools/push-post-push-verifier-result.ps1
Impossibile caricare il file C:\Users\mrhz\Documents\AI\GitHub\control-plane\tools\push-post-push-verifier-result.ps1.
L'esecuzione di script è disabilitata nel sistema in uso. Per ulteriori informazioni, vedere about_Execution_Policies
all'indirizzo https://go.microsoft.com/fwlink/?LinkID=135170.
    + CategoryInfo          : Errore di protezione: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : UnauthorizedAccess
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane> echo $LASTEXITCODE
1
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane>
```

Interpretazione: blocker d'ambiente, non dello script. L'invocazione esterna è stata corretta con bypass PowerShell solo di processo.

### 3B — Invocazione canonica script — bypass solo di processo

Comando canonico:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1
```

Output:

```text
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane> powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1
Running local post-push verifier (child process)...
Verifier result: PASS
Uploading latest.json via SFTP alias ionos-cpinbox ...
SFTP: sftp> put "C:/Users/mrhz/AppData/Local/Temp/tmpE88A.tmp" /srv/cp-verifier-inbox/latest.json
sftp> quit
SFTP upload succeeded
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane> echo $LASTEXITCODE
0
PS C:\Users\mrhz\Documents\AI\GitHub\control-plane>
```

Nota: `-ExecutionPolicy Bypass` è solo process-level; non modifica la policy persistente del nodo.

### 4 — n8n UI — workflow 57 Manual Trigger

Workflow:

```text
57 - Post-push verifier file reader TEST ONLY
```

Nodo finale:

```text
Normalize verifier JSON result
```

Output JSON:

```json
[
  {
    "worker": "post-push-verifier-file-reader",
    "read_ok": true,
    "result": "PASS",
    "hash_match": true,
    "expected_task_commit": "cc6c52551a4fc7b820af984c9ea6e299b6b30ae9",
    "expected_commit_source": "auto:LAST_CURSOR_REPORT.md",
    "head": "966f508d5b153a02421b5acecaac78a5c7c85535",
    "origin_main": "966f508d5b153a02421b5acecaac78a5c7c85535",
    "ls_remote_main": "966f508d5b153a02421b5acecaac78a5c7c85535",
    "workspace_clean": true,
    "branch": "main",
    "source_path": "/files/control-plane-verifier-inbox/latest.json",
    "test_only": true
  }
]
```

### 5 — Cleanup inbox host + container

```text
root@ubuntu:~# rm -f /srv/cp-verifier-inbox/latest.json && ls -la /srv/cp-verifier-inbox/ && docker exec root-n8n-1 ls -la /files/control-plane-verifier-inbox/ && echo LATEST_JSON_CLEAN
total 8
drwxr-xr-x 2 cpinbox cpinbox 4096 Jun 11 22:49 .
drwxr-xr-x 3 root    root    4096 Jun 10 23:30 ..
total 8
drwxr-xr-x    2 node     node          4096 Jun 12 00:49 .
drwxr-xr-x    4 root     root          4096 Jun  8 02:53 ..
LATEST_JSON_CLEAN
root@ubuntu:~#
```

## Esito attestato

Claude ha attestato PASS del Passo 3: field-validation end-to-end manuale completata.

Valori osservati:

* `read_ok=true`
* `result=PASS`
* `hash_match=true`
* `expected_task_commit=cc6c52551a4fc7b820af984c9ea6e299b6b30ae9`
* `expected_commit_source=auto:LAST_CURSOR_REPORT.md`
* `head=origin_main=ls_remote_main=966f508d5b153a02421b5acecaac78a5c7c85535`
* `workspace_clean=true`
* `branch=main`
* cleanup: `LATEST_JSON_CLEAN`

## Gate separati non approvati

Questa sessione non approva:

* schedule
* loop
* wrapper HTTP
* callable-from-n8n worker
* PM-34 unlock
* `n8n_ready=true`
* workflow 57 active=true

Ogni evoluzione resta Decision Packet separato.
