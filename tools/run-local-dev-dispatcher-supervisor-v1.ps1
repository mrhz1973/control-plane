$ErrorActionPreference = "Continue"

$Node    = "C:\Program Files\nodejs\node.exe"
$Script  = "C:\Users\mrhz\Documents\AI\GitHub\control-plane\tools\serve-local-dev-autonomous-dispatcher-v1.mjs"
$WorkDir = "C:\Users\mrhz\Documents\AI\GitHub\control-plane"
$LogFile = Join-Path $env:LOCALAPPDATA "ControlPlane\logs\local-dev-dispatcher.log"

Set-Location $WorkDir

$RestartCount = 0

while ($true) {
    $RestartCount++

    Add-Content $LogFile (
        "[{0}] SUPERVISOR_START attempt={1} wrapper_pid={2}" -f `
        (Get-Date -Format o), $RestartCount, $PID
    )

    try {
        & $Node $Script *>> $LogFile
        $ExitCode = $LASTEXITCODE
    }
    catch {
        $ExitCode = 1
        Add-Content $LogFile (
            "[{0}] NODE_EXCEPTION attempt={1} message={2}" -f `
            (Get-Date -Format o), $RestartCount, $_.Exception.Message
        )
    }

    Add-Content $LogFile (
        "[{0}] NODE_EXIT attempt={1} code={2}" -f `
        (Get-Date -Format o), $RestartCount, $ExitCode
    )

    Add-Content $LogFile (
        "[{0}] RESTART_WAIT seconds=10" -f (Get-Date -Format o)
    )

    Start-Sleep -Seconds 10
}
