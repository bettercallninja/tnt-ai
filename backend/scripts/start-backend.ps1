# Start the FastAPI backend server
Write-Host "Starting TNT-AI Backend Server..." -ForegroundColor Green

# Check if LibreTranslate is running
Write-Host "`nChecking LibreTranslate status..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/languages" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ LibreTranslate is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Warning: LibreTranslate is not running!" -ForegroundColor Yellow
    Write-Host "  Start it with: .\scripts\start-libretranslate.ps1" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nStarting FastAPI server..." -ForegroundColor Cyan
Write-Host "Server will be available at:" -ForegroundColor White
Write-Host "  • API: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  • Docs: http://localhost:8080/docs" -ForegroundColor Cyan
Write-Host "  • ReDoc: http://localhost:8080/redoc" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Activate virtual environment and run uvicorn
if (Test-Path ".venv\Scripts\Activate.ps1") {
    & .venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
} else {
    Write-Host "Error: Virtual environment not found at .venv" -ForegroundColor Red
    Write-Host "Please create it with: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}
