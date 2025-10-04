#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop TNT-AI services gracefully
.DESCRIPTION
    Stops LibreTranslate Docker containers and cleans up resources
.PARAMETER All
    Stop all services including removing containers and volumes
#>

param(
    [switch]$All
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot

function Write-Banner {
    param([string]$Text, [string]$Color = "Cyan")
    $Width = 64
    $Padding = [Math]::Max(0, ($Width - $Text.Length - 2) / 2)
    Write-Host ("═" * $Width) -ForegroundColor $Color
    Write-Host ("║" + (" " * [Math]::Floor($Padding)) + $Text + (" " * [Math]::Ceiling($Padding)) + "║") -ForegroundColor $Color
    Write-Host ("═" * $Width) -ForegroundColor $Color
}

Clear-Host
Write-Banner "Stopping TNT-AI Services" "Yellow"

Push-Location $ProjectRoot
try {
    if ($All) {
        Write-Host "`nStopping and removing all containers, networks, and volumes..." -ForegroundColor Yellow
        docker-compose down -v
        Write-Host "✓ All services stopped and cleaned" -ForegroundColor Green
    } else {
        Write-Host "`nStopping containers..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✓ Services stopped (data preserved)" -ForegroundColor Green
    }
} finally {
    Pop-Location
}

Write-Host ""
