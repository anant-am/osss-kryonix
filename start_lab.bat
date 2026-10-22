@echo off
echo ===================================================
echo   CRISP Research Systems Laboratory
echo   Critical-Section-Aware Memory Reclaim Workbench
echo ===================================================
echo.
echo [1/2] Starting Backend API on http://127.0.0.1:8001 ...
start "CRISP Backend API (:8001)" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001"

echo [2/2] Starting Frontend Workbench on http://localhost:3000 ...
start "CRISP Frontend Workbench (:3000)" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 3000"

echo.
echo All services launched in dedicated terminal windows!
echo   Frontend Dashboard: http://localhost:3000
echo   Backend REST API:   http://127.0.0.1:8001
echo ===================================================
