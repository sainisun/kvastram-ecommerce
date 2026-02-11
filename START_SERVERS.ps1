# Kvastram Platform Startup Script
# Run this in PowerShell as Administrator

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  KVASTRAM PLATFORM - STARTUP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing processes
Write-Host "[1/4] Stopping existing servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
Write-Host "      Done" -ForegroundColor Green
Write-Host ""

# Step 2: Change directory
$projectPath = "C:\Users\User\OneDrive\Desktop\Kvastram projects\kvastram-platform"
Set-Location $projectPath

# Step 3: Start Backend
Write-Host "[2/4] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectPath\backend'; npm run dev" -WindowStyle Normal
Write-Host "      Backend starting on port 4000..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Step 4: Start Admin
Write-Host "[3/4] Starting Admin Panel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectPath\admin'; npm run dev" -WindowStyle Normal
Write-Host "      Admin starting on port 3001..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Step 5: Start Storefront
Write-Host "[4/4] Starting Storefront..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectPath\storefront'; npm run dev" -WindowStyle Normal
Write-Host "      Storefront starting on port 3002..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Final message
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ALL SERVERS STARTING!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:    http://localhost:4000" -ForegroundColor White
Write-Host "Admin:      http://localhost:3001" -ForegroundColor White
Write-Host "Storefront: http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "Login: admin@kvastram.com / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wait 30 seconds for all servers to fully start..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Check FIXES_COMPLETE.md for details" -ForegroundColor Gray

# Keep window open
Read-Host "Press Enter to close this window"
