# CRISP Research Systems Laboratory One-Click Startup Script

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  CRISP Research Systems Laboratory" -ForegroundColor Cyan
Write-Host "  Critical-Section-Aware Memory Reclaim Workbench" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Starting Backend API on http://127.0.0.1:8001 ..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d `"$ScriptDir`" && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001" -WindowStyle Normal

Write-Host "[2/2] Starting Frontend Workbench on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d `"$ScriptDir\frontend`" && npm run dev -- --host 127.0.0.1 --port 3000" -WindowStyle Normal

Write-Host ""
Write-Host "Both services launched in dedicated terminal windows!" -ForegroundColor Green
Write-Host "  Frontend Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend REST API:   http://127.0.0.1:8001" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
