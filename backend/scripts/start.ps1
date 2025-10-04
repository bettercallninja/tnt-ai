#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TNT-AI Backend Startup Script - World-Class Edition
.DESCRIPTION
    Manages LibreTranslate (Docker) and FastAPI backend with multiple modes:
    - First Run: Complete setup with dependency checks
    - Development: Auto-reload enabled
    - Production: Optimized for performance
.PARAMETER Mode
    Startup mode: 'first-run', 'dev', 'prod'
.PARAMETER SkipDocker
    Skip Docker LibreTranslate startup (use if already running)
.EXAMPLE
    .\scripts\start.ps1 -Mode first-run
    .\scripts\start.ps1 -Mode dev
    .\scripts\start.ps1 -Mode prod -SkipDocker
#>

param(
    [Parameter(Position=0)]
    [ValidateSet('first-run', 'dev', 'prod')]
    [string]$Mode = 'dev',
    
    [switch]$SkipDocker
)

# ═══════════════════════════════════════════════════════════════
#                         CONFIGURATION
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$VenvPath = Join-Path $ProjectRoot ".venv"
$RequirementsFile = Join-Path $ProjectRoot "requirements.txt"
$DockerCompose = Join-Path $ProjectRoot "docker-compose.yml"

# ═══════════════════════════════════════════════════════════════
#                         HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

function Write-Banner {
    param([string]$Text, [string]$Color = "Cyan")
    $Width = 64
    $Padding = [Math]::Max(0, ($Width - $Text.Length - 2) / 2)
    Write-Host ("═" * $Width) -ForegroundColor $Color
    Write-Host ("║" + (" " * [Math]::Floor($Padding)) + $Text + (" " * [Math]::Ceiling($Padding)) + "║") -ForegroundColor $Color
    Write-Host ("═" * $Width) -ForegroundColor $Color
}

function Write-Step {
    param([string]$Text)
    Write-Host "`n▶ $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✓ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "  ✗ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "  ℹ $Text" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Test-VirtualEnv {
    return (Test-Path (Join-Path $VenvPath "Scripts\python.exe"))
}

function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Get-FFmpegPath {
    # Check if ffmpeg is in PATH
    $ffmpegCmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($ffmpegCmd) {
        return $ffmpegCmd.Source
    }
    
    # Check WinGet installation
    $wingetPath = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin\ffmpeg.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($wingetPath) {
        return $wingetPath.DirectoryName
    }
    
    return $null
}

# ═══════════════════════════════════════════════════════════════
#                         FIRST RUN SETUP
# ═══════════════════════════════════════════════════════════════

function Initialize-FirstRun {
    Write-Banner "TNT-AI First Run Setup" "Magenta"
    
    # Check Python
    Write-Step "Checking Python installation..."
    if (-not (Test-Command "python")) {
        Write-Error "Python not found! Please install Python 3.10+ from https://python.org"
        exit 1
    }
    $pythonVersion = python --version
    Write-Success "Found: $pythonVersion"
    
    # Check Docker
    Write-Step "Checking Docker installation..."
    if (-not (Test-Command "docker")) {
        Write-Error "Docker not found! Please install Docker Desktop from https://docker.com"
        exit 1
    }
    if (-not (Test-DockerRunning)) {
        Write-Error "Docker daemon is not running! Please start Docker Desktop"
        exit 1
    }
    Write-Success "Docker is running"
    
    # Check ffmpeg
    Write-Step "Checking ffmpeg installation..."
    $ffmpegPath = Get-FFmpegPath
    if (-not $ffmpegPath) {
        Write-Info "ffmpeg not found. Installing via winget..."
        try {
            winget install Gyan.FFmpeg --silent
            Write-Success "ffmpeg installed successfully"
            Write-Info "Note: You may need to restart your terminal for PATH changes to take effect"
            
            # Add to current session
            $ffmpegPath = Get-FFmpegPath
            if ($ffmpegPath) {
                $env:Path += ";$ffmpegPath"
            }
        } catch {
            Write-Error "Failed to install ffmpeg. Please install manually from https://ffmpeg.org"
            exit 1
        }
    } else {
        Write-Success "Found: $ffmpegPath"
        # Ensure it's in current session PATH
        if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
            $env:Path += ";$ffmpegPath"
        }
    }
    
    # Create virtual environment
    Write-Step "Setting up Python virtual environment..."
    if (-not (Test-VirtualEnv)) {
        python -m venv $VenvPath
        Write-Success "Virtual environment created"
    } else {
        Write-Success "Virtual environment already exists"
    }
    
    # Install dependencies
    Write-Step "Installing Python dependencies..."
    $pythonExe = Join-Path $VenvPath "Scripts\python.exe"
    & $pythonExe -m pip install --upgrade pip --quiet
    & $pythonExe -m pip install -r $RequirementsFile
    Write-Success "Dependencies installed"
    
    # Create models directory
    Write-Step "Creating model directories..."
    $modelsDir = Join-Path $ProjectRoot "models\whisper"
    if (-not (Test-Path $modelsDir)) {
        New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    }
    Write-Success "Model directories ready"
    
    # Download Whisper model (will happen on first API call)
    Write-Info "Whisper model will be downloaded on first transcription request"
    
    Write-Success "`nFirst run setup completed successfully!"
    Write-Host ""
}

# ═══════════════════════════════════════════════════════════════
#                     START LIBRETRANSLATE
# ═══════════════════════════════════════════════════════════════

function Start-LibreTranslate {
    Write-Step "Starting LibreTranslate service..."
    
    Push-Location $ProjectRoot
    try {
        # Check if already running
        $running = docker ps --filter "name=libretranslate" --format "{{.Names}}" 2>$null
        if ($running -eq "libretranslate") {
            Write-Success "LibreTranslate is already running"
            return
        }
        
        # Start with docker-compose
        docker-compose up -d --build libretranslate 2>&1 | Out-Null
        
        # Wait for it to be healthy
        Write-Info "Waiting for LibreTranslate to be ready..."
        $maxRetries = 30
        $retries = 0
        while ($retries -lt $maxRetries) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:5000/languages" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Success "LibreTranslate is ready at http://localhost:5000"
                    return
                }
            } catch {
                # Continue waiting
            }
            Start-Sleep -Seconds 2
            $retries++
        }
        
        Write-Error "LibreTranslate failed to start within 60 seconds"
        docker-compose logs libretranslate
        exit 1
        
    } finally {
        Pop-Location
    }
}

# ═══════════════════════════════════════════════════════════════
#                     START BACKEND SERVER
# ═══════════════════════════════════════════════════════════════

function Start-Backend {
    param([string]$RunMode)
    
    Write-Step "Starting TNT-AI Backend API..."
    
    # Ensure ffmpeg is in PATH
    $ffmpegPath = Get-FFmpegPath
    if ($ffmpegPath -and -not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
        $env:Path += ";$ffmpegPath"
    }
    
    Push-Location $ProjectRoot
    try {
        $pythonExe = Join-Path $VenvPath "Scripts\python.exe"
        
        if ($RunMode -eq "dev") {
            Write-Info "Running in DEVELOPMENT mode (auto-reload enabled)"
            Write-Host ""
            & $pythonExe -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
            
        } elseif ($RunMode -eq "prod") {
            Write-Info "Running in PRODUCTION mode"
            Write-Info "Workers: Auto-detect (CPU cores)"
            Write-Info "Log Level: Warning"
            Write-Host ""
            
            # Production settings: multiple workers, no reload, optimized
            $workers = [Environment]::ProcessorCount
            & $pythonExe -m uvicorn app:app `
                --host 0.0.0.0 `
                --port 8080 `
                --workers $workers `
                --log-level warning `
                --no-access-log `
                --proxy-headers `
                --forwarded-allow-ips='*'
        }
        
    } finally {
        Pop-Location
    }
}

# ═══════════════════════════════════════════════════════════════
#                         MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════

Clear-Host
Write-Banner "TNT-AI Backend Startup" "Cyan"

# First run setup
if ($Mode -eq "first-run") {
    Initialize-FirstRun
    Write-Host ""
    Write-Info "Setup complete! Run with -Mode dev to start the server"
    Write-Host ""
    Write-Host "Quick Start Commands:" -ForegroundColor Yellow
    Write-Host "  Development:  .\scripts\start.ps1 -Mode dev" -ForegroundColor Cyan
    Write-Host "  Production:   .\scripts\start.ps1 -Mode prod" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# Verify setup
if (-not (Test-VirtualEnv)) {
    Write-Error "Virtual environment not found! Run with -Mode first-run"
    exit 1
}

# Start LibreTranslate (unless skipped)
if (-not $SkipDocker) {
    Start-LibreTranslate
} else {
    Write-Info "Skipping Docker startup (--SkipDocker flag set)"
}

Write-Host ""

# Start Backend
if ($Mode -eq "prod") {
    Start-Backend -RunMode "prod"
} else {
    Start-Backend -RunMode "dev"
}
