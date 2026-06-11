[CmdletBinding()]
param(
    # Optional manual override passed through to runtime-post-push-verifier.ps1.
    # When omitted, the verifier auto-sources from docs/runtime/LAST_CURSOR_REPORT.md.
    [Parameter(Mandatory = $false)]
    [string]$ExpectedTaskCommit
)

# Manual one-shot only: run local verifier, deposit JSON on VPS via SFTP alias.
# No schedule, no loop, no remote mkdir, no scp, no root SSH target.
$ErrorActionPreference = "Continue"

$SftpAlias = "ionos-cpinbox"
$RemotePath = "/srv/cp-verifier-inbox/latest.json"

function Get-Sanitized {
    param([string]$Text)
    if ([string]::IsNullOrEmpty($Text)) { return "" }
    $t = $Text
    $t = $t -replace 'https?://[^\s/@]*@', 'https://[redacted]@'
    $t = $t -replace '(?i)\b(token|password|secret|api[_-]?key|authorization|bearer)\b\s*[:=]\s*\S+', '$1=[redacted]'
    return $t.Trim()
}

function Get-RepoRoot {
    $here = $PSScriptRoot
    if (-not $here) { return $null }
    $gitDir = Join-Path $here ".."
    try {
        $top = & git -C $gitDir rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0 -and $top) { return $top.Trim() }
    }
    catch { }
    return (Resolve-Path $gitDir -ErrorAction SilentlyContinue).Path
}

function New-FailJson {
    param(
        [string[]]$FailureReasons,
        [string]$ErrorMessage = $null
    )
    $reasons = @($FailureReasons | Where-Object { $_ })
    if ($reasons.Count -eq 0) { $reasons = @("verifier_json_unparseable") }

    $obj = [ordered]@{
        verifier             = "runtime-post-push-verifier"
        result               = "FAIL"
        failure_reasons      = $reasons
        expected_task_commit = ""
        expected_commit_source = "unknown"
        task_commit_exists   = $false
        task_commit_in_chain = $false
        top_level            = ""
        branch               = ""
        branch_ok            = $false
        workspace_clean      = $false
        head                 = ""
        origin_main          = ""
        ls_remote_main       = ""
        hash_match           = $false
        log_oneline_5        = @()
        forbidden_actions    = "no commit by script; no push by script; no n8n; no telegram; no workflow mutation; no http wrapper"
        timestamp_local      = (Get-Date).ToString("s")
        transport            = "manual-sftp-one-shot"
    }
    if ($ErrorMessage) { $obj["error_message"] = $ErrorMessage }
    return ($obj | ConvertTo-Json -Depth 5 -Compress:$false)
}

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )
    $enc = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

function Invoke-VerifierChild {
    param(
        [string]$VerifierPath,
        [string]$ExpectedCommit
    )

    $argList = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $VerifierPath
    )
    if (-not [string]::IsNullOrWhiteSpace($ExpectedCommit)) {
        $argList += @("-ExpectedTaskCommit", $ExpectedCommit)
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell.exe"
    $psi.Arguments = ($argList | ForEach-Object {
        if ($_ -match '\s') { "`"$_`"" } else { $_ }
    }) -join " "
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $null = $proc.Start()
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    $code = $proc.ExitCode

    return [pscustomobject]@{
        StdOut   = $stdout
        StdErr   = $stderr
        ExitCode = $code
    }
}

function Invoke-SftpUpload {
    param(
        [string]$LocalFile,
        [string]$BatchFile
    )

    $batchLines = @(
        "put `"$LocalFile`" $RemotePath"
        "quit"
    )
    $enc = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllLines($BatchFile, $batchLines, $enc)

    $merged = & sftp -b $BatchFile $SftpAlias 2>&1
    $code = $LASTEXITCODE
    $text = ($merged | ForEach-Object { [string]$_ }) -join "`n"
    return [pscustomobject]@{
        ExitCode = $code
        Output   = $text
    }
}

$jsonTemp = $null
$batchTemp = $null
$exitCode = 1
$verifierResult = "FAIL"
$uploadOk = $false

try {
    $repoRoot = Get-RepoRoot
    if (-not $repoRoot) {
        Write-Host "FAIL: cannot resolve repository root"
        exit 1
    }

    $verifierPath = Join-Path $repoRoot "tools\runtime-post-push-verifier.ps1"
    if (-not (Test-Path -LiteralPath $verifierPath -PathType Leaf)) {
        Write-Host "FAIL: verifier script not found at tools/runtime-post-push-verifier.ps1"
        exit 1
    }

    Write-Host "Running local post-push verifier (child process)..."
    $child = Invoke-VerifierChild -VerifierPath $verifierPath -ExpectedCommit $ExpectedTaskCommit

    if ($child.StdErr) {
        $sanErr = Get-Sanitized $child.StdErr
        if ($sanErr) { Write-Host "Verifier stderr: $sanErr" }
    }

    $jsonText = $null
    $stdoutTrim = ($child.StdOut | Out-String).Trim()
    if ($stdoutTrim) {
        # Verifier emits a single JSON object on stdout.
        try {
            $null = $stdoutTrim | ConvertFrom-Json -ErrorAction Stop
            $jsonText = $stdoutTrim
        }
        catch {
            $jsonText = $null
        }
    }

    if (-not $jsonText) {
        Write-Host "FAIL: verifier output is not parseable JSON"
        $jsonText = New-FailJson -FailureReasons @("verifier_json_unparseable") `
            -ErrorMessage (Get-Sanitized $stdoutTrim)
        $verifierResult = "FAIL"
    }
    else {
        $parsed = $stdoutTrim | ConvertFrom-Json
        $verifierResult = [string]$parsed.result
        if ($verifierResult -ne "PASS") {
            Write-Host "Verifier result: FAIL (uploading structured JSON anyway)"
        }
        else {
            Write-Host "Verifier result: PASS"
        }
    }

    $jsonTemp = [System.IO.Path]::GetTempFileName()
    $batchTemp = [System.IO.Path]::GetTempFileName()
    Write-Utf8NoBom -Path $jsonTemp -Content $jsonText

    Write-Host "Uploading latest.json via SFTP alias $SftpAlias ..."
    $sftp = Invoke-SftpUpload -LocalFile $jsonTemp -BatchFile $batchTemp
    if ($sftp.Output) {
        $sanOut = Get-Sanitized $sftp.Output
        if ($sanOut) { Write-Host "SFTP: $sanOut" }
    }

    if ($sftp.ExitCode -ne 0) {
        Write-Host "FAIL: SFTP upload failed (exit $($sftp.ExitCode))"
        $uploadOk = $false
        $exitCode = 1
    }
    else {
        Write-Host "SFTP upload succeeded"
        $uploadOk = $true
        if ($verifierResult -eq "PASS" -and $child.ExitCode -eq 0) {
            $exitCode = 0
        }
        else {
            $exitCode = 1
        }
    }
}
catch {
    Write-Host "FAIL: $($_.Exception.Message)"
    $exitCode = 1
}
finally {
    foreach ($p in @($jsonTemp, $batchTemp)) {
        if ($p -and (Test-Path -LiteralPath $p)) {
            try { Remove-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue } catch { }
        }
    }
}

exit $exitCode
