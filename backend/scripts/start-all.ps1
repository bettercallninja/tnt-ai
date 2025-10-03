# Start both LibreTranslate and Backend servers
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              Starting TNT-AI Full Stack                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Start LibreTranslate
Write-Host "Step 1: Starting LibreTranslate..." -ForegroundColor Yellow
& .\scripts\start-libretranslate.ps1

Write-Host "`nWaiting 5 seconds for LibreTranslate to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Backend
Write-Host "`nStep 2: Starting Backend API..." -ForegroundColor Yellow
Write-Host "Note: This will run in the foreground. Open a new terminal to use other commands." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both services.`n" -ForegroundColor Yellow

& .\scripts\start-backend.ps1
