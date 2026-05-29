#Requires -Version 5.1
<#
.SYNOPSIS
  Generate a Codex CLI prompt artifact in docs/runtime/codex-prompts/ (manual-supervised helper).

.DESCRIPTION
  Local helper only: not a daemon, not n8n, not a worker. Runs codex.cmd exec ephemeral read-only.
  Does not commit, push, or call n8n.

.PARAMETER PromptPath
  Path to plain-text prompt file (stdin input for Codex).

.PARAMETER OutputPath
  Artifact path; must be under docs/runtime/codex-prompts/ relative to repo root.

.PARAMETER RepoRoot
  Git repository root (default: current directory).

.PARAMETER CodexCommand
  Codex CLI launcher (default: codex.cmd).

.PARAMETER Force
  Overwrite an existing output artifact.

.PARAMETER AllowDirtyWorkspace
  Skip strict clean-workspace check (default: require clean or only script+prompt changes).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$PromptPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [string]$RepoRoot = (Get-Location).Path,

    [string]$CodexCommand = "codex.cmd",

    [switch]$Force,

    [switch]$AllowDirtyWorkspace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host $Message
}

function Resolve-NormalizedPath {
    param(
        [string]$BasePath,
        [string]$RelativeOrAbsolute
    )
    if ([System.IO.Path]::IsPathRooted($RelativeOrAbsolute)) {
        return (Resolve-Path -LiteralPath $RelativeOrAbsolute).Path
    }
    return (Resolve-Path -LiteralPath (Join-Path $BasePath $RelativeOrAbsolute)).Path
}

function Test-PathUnderBus {
    param(
        [string]$FullPath,
        [string]$BusRoot
    )
    $full = [System.IO.Path]::GetFullPath($FullPath)
    $bus = [System.IO.Path]::GetFullPath($BusRoot)
    return $full.StartsWith($bus + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) `
        -or $full.Equals($bus, [StringComparison]::OrdinalIgnoreCase)
}

function Test-WorkspaceAllowed {
    param(
        [string]$Root,
        [string[]]$AllowedRelativePaths
    )
    Push-Location $Root
    try {
        $lines = @(git status --porcelain 2>&1)
        if ($LASTEXITCODE -ne 0) {
            throw "git status failed in $Root"
        }
        if ($lines.Count -eq 0) {
            return $true
        }
        $allowed = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
        foreach ($rel in $AllowedRelativePaths) {
            if ($rel) { [void]$allowed.Add(($rel -replace '\\', '/')) }
        }
        foreach ($line in $lines) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $pathPart = $line.Substring(3).Trim()
            if ($pathPart -match '^"(.+)"$') { $pathPart = $Matches[1] }
            $norm = ($pathPart -replace '\\', '/')
            if (-not $allowed.Contains($norm)) {
                return $false
            }
        }
        return $true
    }
    finally {
        Pop-Location
    }
}

try {
    $RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

    if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
        throw "RepoRoot is not a Git repository: $RepoRoot"
    }

    $promptFull = Resolve-NormalizedPath -BasePath $RepoRoot -RelativeOrAbsolute $PromptPath
    if (-not (Test-Path -LiteralPath $promptFull -PathType Leaf)) {
        throw "PromptPath does not exist: $promptFull"
    }

    $outputFull = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
        [System.IO.Path]::GetFullPath($OutputPath)
    } else {
        [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $OutputPath))
    }

    $busRoot = Join-Path $RepoRoot "docs/runtime/codex-prompts"
    if (-not (Test-PathUnderBus -FullPath $outputFull -BusRoot $busRoot)) {
        throw "OutputPath must stay under docs/runtime/codex-prompts/: $OutputPath"
    }

    if ((Test-Path -LiteralPath $outputFull) -and -not $Force) {
        throw "Output artifact already exists (use -Force to overwrite): $outputFull"
    }

    $promptRel = (Resolve-Path -LiteralPath $promptFull).Path.Substring($RepoRoot.Length).TrimStart('\', '/')
    $scriptRel = "scripts/codex-artifact.ps1"
    if (-not $AllowDirtyWorkspace) {
        $ok = Test-WorkspaceAllowed -Root $RepoRoot -AllowedRelativePaths @($promptRel, $scriptRel)
        if (-not $ok) {
            throw "Git workspace is not clean (only $scriptRel and input prompt may be dirty/untracked). Use -AllowDirtyWorkspace to override."
        }
    }

    $codexExe = Get-Command $CodexCommand -ErrorAction Stop
    $versionLine = & $CodexCommand --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Codex version check failed: $versionLine"
    }

    $outDir = Split-Path -Parent $outputFull
    if (-not (Test-Path -LiteralPath $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    Write-Step "Codex version: $($versionLine -join ' ')"
    Write-Step "Repo root: $RepoRoot"
    Write-Step "Input prompt: $promptFull"
    Write-Step "Output artifact: $outputFull"

    $promptText = Get-Content -LiteralPath $promptFull -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($promptText)) {
        throw "Prompt file is empty: $promptFull"
    }

    $codexArgs = @(
        "exec",
        "--ephemeral",
        "--sandbox", "read-only",
        "-C", $RepoRoot,
        "-o", $outputFull,
        "-"
    )

    $promptText | & $codexExe.Source @codexArgs
    $codexExit = $LASTEXITCODE
    if ($codexExit -ne 0) {
        throw "Codex exec failed with exit code $codexExit"
    }

    if (-not (Test-Path -LiteralPath $outputFull -PathType Leaf)) {
        throw "Output artifact was not created: $outputFull"
    }

    $artifactText = Get-Content -LiteralPath $outputFull -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($artifactText)) {
        throw "Output artifact is empty: $outputFull"
    }

    if (-not $artifactText.EndsWith("`n")) {
        $artifactText = $artifactText + "`n"
        Set-Content -LiteralPath $outputFull -Value $artifactText -Encoding UTF8 -NoNewline
        Add-Content -LiteralPath $outputFull -Value "" -Encoding UTF8
    }

    Write-Step "Result: PASS"
    exit 0
}
catch {
    Write-Error $_
    Write-Step "Result: FAIL"
    exit 1
}
