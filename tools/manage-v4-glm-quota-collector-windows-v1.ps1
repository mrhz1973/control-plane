[CmdletBinding()]
param(
    [ValidateSet("Validate", "Install", "Status", "Uninstall")]
    [string]$Mode = "Status"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$taskName = "ControlPlane-V4-GlmQuotaCollector"
$runnerPath = Join-Path $PSScriptRoot "run-v4-glm-quota-collector-windows-v1.ps1"
$ingestTool = Join-Path $repoRoot "tools\rt25-quota-ingest-glm-v1.mjs"

function Test-CredentialPresent {
    foreach ($n in @("ZAI_API_KEY", "ZHIPUAI_API_KEY")) {
        foreach ($scope in @("Process", "User", "Machine")) {
            $v = [Environment]::GetEnvironmentVariable($n, $scope)
            if ($null -ne $v -and "$v".Length -gt 0) { return $true }
        }
    }
    return $false
}

function Get-TaskInfo {
    try {
        $t = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
        $info = Get-ScheduledTaskInfo -TaskName $taskName
        return [pscustomobject]@{
            Name           = $t.TaskName
            State          = [string]$t.State
            LastRunTime    = $info.LastRunTime
            LastTaskResult = $info.LastTaskResult
            NextRunTime    = $info.NextRunTime
        }
    } catch {
        return $null
    }
}

switch ($Mode) {
    "Validate" {
        $nodePresent = [bool](Get-Command node -ErrorAction SilentlyContinue)
        $runnerPresent = Test-Path -LiteralPath $runnerPath
        $toolPresent = Test-Path -LiteralPath $ingestTool
        $credPresent = Test-CredentialPresent
        $taskPresent = $null -ne (Get-TaskInfo)
        Write-Host "Validate (read-only)"
        Write-Host "node_present=$nodePresent"
        Write-Host "runner_present=$runnerPresent path=$runnerPath"
        Write-Host "ingest_tool_present=$toolPresent path=$ingestTool"
        Write-Host "credential_present=$credPresent"
        Write-Host "task_present=$taskPresent task=$taskName"
        if ($nodePresent -and $runnerPresent -and $toolPresent) { exit 0 } else { exit 1 }
    }
    "Install" {
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Write-Host "FAIL_CLOSED_NO_NODE"
            exit 1
        }
        if (-not (Test-Path -LiteralPath $runnerPath)) {
            Write-Host "FAIL_CLOSED_NO_RUNNER"
            exit 1
        }
        if (-not (Test-CredentialPresent)) {
            Write-Host "FAIL_CLOSED_NO_CREDENTIAL"
            exit 1
        }
        $action = New-ScheduledTaskAction `
            -Execute "powershell.exe" `
            -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runnerPath`"" `
            -WorkingDirectory $repoRoot
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 4) -RepetitionDuration ([TimeSpan]::MaxValue)
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
        Write-Host "INSTALLED $taskName"
        exit 0
    }
    "Status" {
        $info = Get-TaskInfo
        $decision = Join-Path $repoRoot "configs\runtime\quota-ingest\glm-quota-decision.json"
        Write-Host "task=$taskName"
        if (-not $info) {
            Write-Host "state=ABSENT"
        } else {
            Write-Host "state=$($info.State)"
            Write-Host "lastRun=$($info.LastRunTime)"
            Write-Host "lastResult=$($info.LastTaskResult)"
            Write-Host "nextRun=$($info.NextRunTime)"
        }
        if (Test-Path -LiteralPath $decision) {
            $ageSec = [int]((Get-Date) - (Get-Item -LiteralPath $decision).LastWriteTime).TotalSeconds
            Write-Host "decision_present=true age_sec=$ageSec path=$decision"
        } else {
            Write-Host "decision_present=false"
        }
        exit 0
    }
    "Uninstall" {
        $info = Get-TaskInfo
        if (-not $info) {
            Write-Host "state=ABSENT"
            exit 0
        }
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "UNINSTALLED $taskName"
        exit 0
    }
}
