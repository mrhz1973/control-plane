[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ExpectedTaskCommit
)

# Headless-safe: never abort with an unstructured fatal. Every git call is
# captured explicitly; the script ALWAYS emits one structured JSON object and
# a coherent exit code (PASS -> 0, FAIL -> 1).
$ErrorActionPreference = "Continue"

function Invoke-GitCmd {
    param([string[]]$Arguments)

    $stdoutLines = @()
    $stderrLines = @()
    $code = 0
    try {
        $merged = & git @Arguments 2>&1
        $code = $LASTEXITCODE
        foreach ($item in $merged) {
            if ($item -is [System.Management.Automation.ErrorRecord]) {
                $stderrLines += $item.ToString()
            }
            else {
                $stdoutLines += [string]$item
            }
        }
    }
    catch {
        # git binary missing or invocation failure: surface as nonzero, no fatal.
        $stderrLines += $_.Exception.Message
        if ($code -eq 0) { $code = 1 }
    }

    return [pscustomobject]@{
        StdOut   = $stdoutLines
        StdErr   = $stderrLines
        ExitCode = $code
    }
}

function Get-Sanitized {
    param([string]$Text)
    if ([string]::IsNullOrEmpty($Text)) { return "" }
    $t = $Text
    # Strip credentials embedded in URLs and any token/secret-looking pairs.
    $t = $t -replace 'https?://[^\s/@]*@', 'https://[redacted]@'
    $t = $t -replace '(?i)\b(token|password|secret|api[_-]?key|authorization|bearer)\b\s*[:=]\s*\S+', '$1=[redacted]'
    return $t.Trim()
}

# Defaults so the JSON contract is complete even on early failure.
$result = "FAIL"
$failureReasons = New-Object System.Collections.Generic.List[string]
$topLevel = ""
$branch = ""
$branchOk = $false
$workspaceClean = $false
$head = ""
$originMain = ""
$lsRemoteMain = ""
$hashMatch = $false
$taskCommitExists = $false
$taskCommitInChain = $false
$log = @()
$errorMessage = $null

try {
    $top = Invoke-GitCmd @("rev-parse", "--show-toplevel")
    if ($top.ExitCode -eq 0 -and $top.StdOut.Count -gt 0) {
        $topLevel = $top.StdOut[0].Trim()
    }
    else {
        if (-not $failureReasons.Contains("git_repo_invalid")) { $failureReasons.Add("git_repo_invalid") }
        if (-not $errorMessage) { $errorMessage = Get-Sanitized (($top.StdErr -join "; ")) }
    }

    $fetch = Invoke-GitCmd @("fetch", "origin", "main")
    if ($fetch.ExitCode -ne 0) {
        $failureReasons.Add("git_fetch_failed")
        if (-not $errorMessage) { $errorMessage = Get-Sanitized (($fetch.StdErr -join "; ")) }
    }

    $br = Invoke-GitCmd @("branch", "--show-current")
    if ($br.ExitCode -eq 0 -and $br.StdOut.Count -gt 0) {
        $branch = $br.StdOut[0].Trim()
    }
    $branchOk = ($branch -eq "main")
    if (-not $branchOk) { $failureReasons.Add("branch_not_main") }

    $st = Invoke-GitCmd @("status", "--short")
    $statusText = ($st.StdOut -join "`n").Trim()
    $workspaceClean = ($st.ExitCode -eq 0) -and [string]::IsNullOrWhiteSpace($statusText)
    if (-not $workspaceClean) { $failureReasons.Add("workspace_not_clean") }

    $h = Invoke-GitCmd @("rev-parse", "HEAD")
    if ($h.ExitCode -eq 0 -and $h.StdOut.Count -gt 0) {
        $head = $h.StdOut[0].Trim()
    }
    else {
        $failureReasons.Add("git_rev_parse_failed")
        if (-not $errorMessage) { $errorMessage = Get-Sanitized (($h.StdErr -join "; ")) }
    }

    $om = Invoke-GitCmd @("rev-parse", "origin/main")
    if ($om.ExitCode -eq 0 -and $om.StdOut.Count -gt 0) {
        $originMain = $om.StdOut[0].Trim()
    }

    $lr = Invoke-GitCmd @("ls-remote", "origin", "main")
    if ($lr.ExitCode -eq 0 -and $lr.StdOut.Count -gt 0) {
        $lsRemoteMain = (($lr.StdOut[0]) -split "\s+")[0].Trim()
    }
    else {
        $failureReasons.Add("git_ls_remote_failed")
        if (-not $errorMessage) { $errorMessage = Get-Sanitized (($lr.StdErr -join "; ")) }
    }

    $hashMatch = ($head -ne "") -and ($head -eq $originMain) -and ($head -eq $lsRemoteMain)
    if (-not $hashMatch) { $failureReasons.Add("head_origin_lsremote_mismatch") }

    $lg = Invoke-GitCmd @("log", "--oneline", "-5")
    if ($lg.ExitCode -eq 0) {
        $log = $lg.StdOut
    }

    $ce = Invoke-GitCmd @("cat-file", "-e", $ExpectedTaskCommit)
    $taskCommitExists = ($ce.ExitCode -eq 0)
    if (-not $taskCommitExists) {
        $failureReasons.Add("expected_task_commit_not_found")
    }
    else {
        $mb = Invoke-GitCmd @("merge-base", "--is-ancestor", $ExpectedTaskCommit, "HEAD")
        $taskCommitInChain = ($mb.ExitCode -eq 0)
        if (-not $taskCommitInChain) { $failureReasons.Add("expected_task_commit_not_in_chain") }
    }

    if ($branchOk -and $workspaceClean -and $hashMatch -and $taskCommitExists -and $taskCommitInChain) {
        $result = "PASS"
    }
    else {
        $result = "FAIL"
    }
}
catch {
    $result = "FAIL"
    if (-not $failureReasons.Contains("verifier_exception")) { $failureReasons.Add("verifier_exception") }
    $errorMessage = Get-Sanitized ($_.Exception.Message)
}
finally {
    $reasonsArray = @($failureReasons.ToArray())

    $output = [ordered]@{
        verifier             = "runtime-post-push-verifier"
        result               = $result
        failure_reasons      = $reasonsArray
        expected_task_commit = $ExpectedTaskCommit
        task_commit_exists   = $taskCommitExists
        task_commit_in_chain = $taskCommitInChain
        top_level            = $topLevel
        branch               = $branch
        branch_ok            = $branchOk
        workspace_clean      = $workspaceClean
        head                 = $head
        origin_main          = $originMain
        ls_remote_main       = $lsRemoteMain
        hash_match           = $hashMatch
        log_oneline_5        = $log
        forbidden_actions    = "no commit by script; no push by script; no n8n; no telegram; no workflow mutation; no http wrapper"
        timestamp_local      = (Get-Date).ToString("s")
    }
    if ($errorMessage) { $output["error_message"] = $errorMessage }

    $json = $output | ConvertTo-Json -Depth 5
    # Normalize empty failure_reasons to an explicit [] regardless of host quirks.
    $json = $json -replace '("failure_reasons":\s*)""', '$1[]'
    $json = $json -replace '("failure_reasons":\s*)null', '$1[]'
    Write-Output $json

    if ($result -eq "PASS") { exit 0 } else { exit 1 }
}
