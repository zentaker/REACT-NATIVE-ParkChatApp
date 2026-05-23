$ErrorActionPreference = "Continue"

Write-Host "Aldea Node/NPM Doctor"
Write-Host "====================="
Write-Host ""

Write-Host "Current directory:"
Write-Host (Get-Location).Path
Write-Host ""

function Test-Command {
  param (
    [string]$Name
  )

  $cmd = Get-Command $Name -ErrorAction SilentlyContinue

  if ($cmd) {
    Write-Host "[OK] $Name -> $($cmd.Source)"
    return $true
  }

  Write-Host "[MISSING] $Name not found in PATH"
  return $false
}

function Test-Version {
  param (
    [string]$Label,
    [string]$Command
  )

  try {
    $version = & $Command -v 2>$null
    if ($LASTEXITCODE -eq 0 -or $version) {
      Write-Host "${Label}: $version"
      return $true
    }
  } catch {
    Write-Host "${Label}: unavailable"
    return $false
  }

  Write-Host "${Label}: unavailable"
  return $false
}

$nodeOk = Test-Command "node"
$npmOk = Test-Command "npm"
$npmCmdOk = Test-Command "npm.cmd"
$npxOk = Test-Command "npx"
$npxCmdOk = Test-Command "npx.cmd"

Write-Host ""
Write-Host "Versions:"
if ($nodeOk) {
  Test-Version "node" "node" | Out-Null
} else {
  Write-Host "node: unavailable"
}

if ($npmOk) {
  Test-Version "npm" "npm" | Out-Null
} elseif ($npmCmdOk) {
  Test-Version "npm.cmd" "npm.cmd" | Out-Null
} else {
  Write-Host "npm: unavailable"
}

if ($npxOk) {
  Test-Version "npx" "npx" | Out-Null
} elseif ($npxCmdOk) {
  Test-Version "npx.cmd" "npx.cmd" | Out-Null
} else {
  Write-Host "npx: unavailable"
}

Write-Host ""
Write-Host "Common Windows locations:"

$nodeDir = "C:\Program Files\nodejs"
$nodeDirX86 = "C:\Program Files (x86)\nodejs"
$appDataNpm = Join-Path $env:APPDATA "npm"

if (Test-Path $nodeDir) {
  Write-Host "[OK] Found $nodeDir"
} else {
  Write-Host "[MISSING] $nodeDir"
}

if (Test-Path $nodeDirX86) {
  Write-Host "[OK] Found $nodeDirX86"
} else {
  Write-Host "[MISSING] $nodeDirX86"
}

if (Test-Path $appDataNpm) {
  Write-Host "[OK] Found $appDataNpm"
} else {
  Write-Host "[MISSING] $appDataNpm"
}

Write-Host ""
Write-Host "Direct binary checks:"

$directNode = Join-Path $nodeDir "node.exe"
$directNpm = Join-Path $nodeDir "npm.cmd"
$directNpx = Join-Path $nodeDir "npx.cmd"

if (Test-Path $directNode) {
  Write-Host "[OK] $directNode"
  & $directNode -v
} else {
  Write-Host "[MISSING] $directNode"
}

if (Test-Path $directNpm) {
  Write-Host "[OK] $directNpm"
  & $directNpm -v
} else {
  Write-Host "[MISSING] $directNpm"
}

if (Test-Path $directNpx) {
  Write-Host "[OK] $directNpx"
  & $directNpx -v
} else {
  Write-Host "[MISSING] $directNpx"
}

Write-Host ""
Write-Host "PATH contains nodejs?"
if ($env:PATH -like "*C:\Program Files\nodejs*") {
  Write-Host "[OK] PATH includes C:\Program Files\nodejs"
} else {
  Write-Host "[WARN] PATH does not include C:\Program Files\nodejs"
}

if ($env:PATH -like "*C:\Program Files (x86)\nodejs*") {
  Write-Host "[WARN] PATH includes C:\Program Files (x86)\nodejs"
}

Write-Host ""
Write-Host "PATH contains AppData npm?"
if ($env:PATH -like "*$appDataNpm*") {
  Write-Host "[OK] PATH includes $appDataNpm"
} else {
  Write-Host "[WARN] PATH does not include $appDataNpm"
}

Write-Host ""
Write-Host "where.exe results:"
where.exe node 2>$null
where.exe npm 2>$null
where.exe npm.cmd 2>$null
where.exe npx 2>$null
where.exe npx.cmd 2>$null

Write-Host ""
Write-Host "Recommendation:"

if ($nodeOk -and ($npmOk -or $npmCmdOk) -and ($npxOk -or $npxCmdOk)) {
  Write-Host "[OK] Node/npm/npx toolchain is usable from PATH."
  exit 0
}

if ((Test-Path $directNode) -and (Test-Path $directNpm) -and (Test-Path $directNpx)) {
  Write-Host "Node/npm/npx exist in C:\Program Files\nodejs, but PATH does not resolve them correctly."
  Write-Host "Temporary workaround:"
  Write-Host "`"$directNpm`" install"
  Write-Host "`"$directNpm`" run typecheck"
  Write-Host "`"$directNpm`" run start"
}

if (-not $nodeOk) {
  Write-Host "Node is not available from PATH. Install Node.js LTS or fix PATH, then restart PowerShell/VS Code/Codex."
  Write-Host "Suggested command if winget is available:"
  Write-Host "winget install OpenJS.NodeJS.LTS"
}

if ($nodeOk -and -not $npmOk -and $npmCmdOk) {
  Write-Host "npm is available as npm.cmd. Try:"
  Write-Host "npm.cmd install"
  Write-Host "npm.cmd run typecheck"
  Write-Host "npm.cmd run start"
}

if (-not $npmOk -and -not $npmCmdOk) {
  Write-Host "npm is not available from PATH. Reinstall Node.js LTS or fix PATH."
}

Write-Host ""
Write-Host "Expected PATH entries:"
Write-Host "C:\Program Files\nodejs\"
Write-Host "%AppData%\npm"

exit 1
