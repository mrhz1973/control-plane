param(
    [Parameter(Mandatory=$true)]
    [string]$ExpectedTaskCommit
)

$ErrorActionPreference = "Stop"

git fetch origin main | Out-Host

$TopLevel = git rev-parse --show-toplevel
$Branch = git branch --show-current
$Status = git status --short
$Head = git rev-parse HEAD
$OriginMain = git rev-parse origin/main
$LsRemoteLine = git ls-remote origin main
$LsRemoteMain = ($LsRemoteLine -split "\s+")[0]
$Log = git log --oneline -5

$FailureReasons = @()

$TaskCommitExists = $false
cmd /c "git cat-file -e $ExpectedTaskCommit 2>nul"
if ($LASTEXITCODE -eq 0) {
    $TaskCommitExists = $true
}

$TaskCommitInChain = $false
if ($TaskCommitExists) {
    cmd /c "git merge-base --is-ancestor $ExpectedTaskCommit HEAD 2>nul"
    if ($LASTEXITCODE -eq 0) {
        $TaskCommitInChain = $true
    } else {
        $FailureReasons += "expected_task_commit_not_in_chain"
    }
} else {
    $FailureReasons += "expected_task_commit_not_found"
}

$WorkspaceClean = [string]::IsNullOrWhiteSpace(($Status | Out-String))
$HashMatch = ($Head -eq $OriginMain) -and ($Head -eq $LsRemoteMain)
$BranchOk = ($Branch -eq "main")

if (-not $BranchOk) { $FailureReasons += "branch_not_main" }
if (-not $WorkspaceClean) { $FailureReasons += "workspace_not_clean" }
if (-not $HashMatch) { $FailureReasons += "head_origin_lsremote_mismatch" }

$Result = if ($HashMatch -and $BranchOk -and $WorkspaceClean -and $TaskCommitExists -and $TaskCommitInChain) {
    "PASS"
} else {
    "FAIL"
}

[ordered]@{
    verifier = "runtime-post-push-verifier"
    result = $Result
    failure_reasons = $FailureReasons
    expected_task_commit = $ExpectedTaskCommit
    task_commit_exists = $TaskCommitExists
    task_commit_in_chain = $TaskCommitInChain
    top_level = $TopLevel
    branch = $Branch
    branch_ok = $BranchOk
    workspace_clean = $WorkspaceClean
    head = $Head
    origin_main = $OriginMain
    ls_remote_main = $LsRemoteMain
    hash_match = $HashMatch
    log_oneline_5 = $Log
    forbidden_actions = "no commit by script; no push by script; no n8n; no telegram; no workflow mutation"
    timestamp_local = (Get-Date).ToString("s")
} | ConvertTo-Json -Depth 5

if ($Result -eq "PASS") {
    exit 0
} else {
    exit 1
}
