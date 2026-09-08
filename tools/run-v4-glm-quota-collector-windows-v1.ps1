[CmdletBinding()]
param(
    [string]$RepoOverride = ""
)

$ErrorActionPreference = "Stop"

# Discover repo root from this script path (tools/<name>.ps1 -> repo root).
$repoRoot = if ($RepoOverride) {
    (Resolve-Path -LiteralPath $RepoOverride).Path
} else {
    (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
}

function Resolve-CredentialName {
    $names = @("ZAI_API_KEY", "ZHIPUAI_API_KEY")
    foreach ($scope in @("Process", "User", "Machine")) {
        foreach ($n in $names) {
            $val = [Environment]::GetEnvironmentVariable($n, $scope)
            if ($null -ne $val -and "$val".Length -gt 0) {
                return $n
            }
        }
    }
    return $null
}

$credName = Resolve-CredentialName
if (-not $credName) {
    Write-Host "CREDENTIAL_ABSENT_FAIL_CLOSED"
    exit 2
}

$outDir = Join-Path $repoRoot "configs\runtime\quota-ingest"
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "NODE_ABSENT_FAIL_CLOSED"
    exit 2
}

$tool = Join-Path $repoRoot "tools\rt25-quota-ingest-glm-v1.mjs"
if (-not (Test-Path -LiteralPath $tool)) {
    Write-Host "INGEST_TOOL_ABSENT_FAIL_CLOSED"
    exit 2
}

# Place credential into child process environment by NAME only; never print value.
$credValue = [Environment]::GetEnvironmentVariable($credName, "Process")
if (-not $credValue) { $credValue = [Environment]::GetEnvironmentVariable($credName, "User") }
if (-not $credValue) { $credValue = [Environment]::GetEnvironmentVariable($credName, "Machine") }
Set-Item -Path "Env:$credName" -Value $credValue

& $nodeCmd.Source $tool --mode auto --out $outDir
exit $LASTEXITCODE
