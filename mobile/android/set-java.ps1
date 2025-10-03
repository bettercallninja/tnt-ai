# Set Java 17+ for Android Build
# Run this script after installing JDK 17 or newer

Write-Host "Searching for installed JDK versions..." -ForegroundColor Cyan

$javaLocations = @(
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Java",
    "C:\Program Files\OpenJDK",
    "C:\Program Files (x86)\Java"
)

$jdkFound = $null

foreach ($location in $javaLocations) {
    if (Test-Path $location) {
        $jdks = Get-ChildItem $location -Directory | Where-Object { $_.Name -match "jdk-?(\d+)" -and [int]$Matches[1] -ge 17 } | Sort-Object Name -Descending
        if ($jdks) {
            $jdkFound = $jdks[0].FullName
            break
        }
    }
}

if ($jdkFound) {
    Write-Host "`n✓ Found JDK: $jdkFound" -ForegroundColor Green
    
    # Set for current session
    $env:JAVA_HOME = $jdkFound
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    
    Write-Host "`n✓ JAVA_HOME set for current session" -ForegroundColor Green
    Write-Host "  JAVA_HOME = $env:JAVA_HOME" -ForegroundColor White
    
    # Verify
    Write-Host "`nVerifying Java version:" -ForegroundColor Cyan
    & java -version
    
    Write-Host "`n✓ Ready to build Android app!" -ForegroundColor Green
    Write-Host "  Run: cd D:\ilia\PyProj\tnt-ai\mobile\android; .\gradlew assembleRelease" -ForegroundColor Cyan
    
    # Instructions for permanent setting
    Write-Host "`n📝 To set permanently (optional):" -ForegroundColor Yellow
    Write-Host "  1. Open: System Properties > Environment Variables" -ForegroundColor White
    Write-Host "  2. Add JAVA_HOME: $jdkFound" -ForegroundColor White
    Write-Host "  3. Add to PATH: %JAVA_HOME%\bin" -ForegroundColor White
    
} else {
    Write-Host "`n✗ No JDK 17+ found!" -ForegroundColor Red
    Write-Host "`nPlease install JDK 17 or newer:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://adoptium.net/temurin/releases/" -ForegroundColor White
    Write-Host "  2. Select: Version 17 (LTS), Windows x64" -ForegroundColor White
    Write-Host "  3. Run installer" -ForegroundColor White
    Write-Host "  4. Run this script again" -ForegroundColor White
    exit 1
}
