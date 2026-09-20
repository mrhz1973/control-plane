# Canonical dispatcher maintenance restart entrypoint (issue #115).
# ALL Scheduled Task recycle operations MUST go through this gate.
# Do NOT call Stop-ScheduledTask / schtasks /End / Kill against the
# dispatcher from ad-hoc Cursor snippets.
$ErrorActionPreference = "Stop"
$Node = "C:\Program Files\nodejs\node.exe"
$Script = Join-Path $PSScriptRoot "safe-restart-local-dev-dispatcher-v1.mjs"
& $Node $Script @args
exit $LASTEXITCODE
