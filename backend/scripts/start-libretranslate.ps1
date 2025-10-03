# Start LibreTranslate Server using Docker
Write-Host "Starting LibreTranslate server..." -ForegroundColor Green

# Check if Docker is running
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: Docker is not installed or not accessible." -ForegroundColor Red
    exit 1
}

# Start the container
Write-Host "Launching LibreTranslate container..." -ForegroundColor Yellow
docker-compose up -d libretranslate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nLibreTranslate server is starting up!" -ForegroundColor Green
    Write-Host "This may take a few minutes on first run while models are downloaded." -ForegroundColor Yellow
    Write-Host "`nUseful commands:" -ForegroundColor Cyan
    Write-Host "  - View logs:        docker-compose logs -f libretranslate"
    Write-Host "  - Check status:     docker-compose ps"
    Write-Host "  - Stop server:      docker-compose down"
    Write-Host "  - Web interface:    http://localhost:5000"
    Write-Host "  - Test API:         curl http://localhost:5000/languages"
    Write-Host "`nWaiting for server to be ready..."
    
    # Wait for health check
    $maxAttempts = 30
    $attempt = 0
    $ready = $false
    
    while ($attempt -lt $maxAttempts -and -not $ready) {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/languages" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $ready = $true
                Write-Host "`n✓ LibreTranslate is ready!" -ForegroundColor Green
                Write-Host "Access it at: http://localhost:5000" -ForegroundColor Cyan
            }
        } catch {
            Write-Host "." -NoNewline
        }
    }
    
    if (-not $ready) {
        Write-Host "`nServer is still starting. Check logs with:" -ForegroundColor Yellow
        Write-Host "docker-compose logs -f libretranslate" -ForegroundColor Cyan
    }
} else {
    Write-Host "`nFailed to start LibreTranslate." -ForegroundColor Red
    Write-Host "Check Docker logs for details." -ForegroundColor Yellow
}
