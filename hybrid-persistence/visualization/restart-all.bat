@echo off
echo ==========================================
echo Redis Hybrid Persistence - Full Restart
echo ==========================================
echo.

echo [1/4] Stopping API server (if running)...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *api-server*" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3000...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo OK: Port 3000 is free
echo.

echo [2/4] Clearing Node.js cache...
cd /d "%~dp0"
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo OK: Node.js cache cleared
) else (
    echo OK: No cache to clear
)
echo.

echo [3/4] Starting API server...
start "Redis API Server" cmd /k "node api-server.js"
timeout /t 3 /nobreak >nul
echo OK: API server started
echo.

echo [4/4] Checking services...
docker ps --filter "name=redis-hybrid" --format "{{.Names}}: {{.Status}}" | findstr redis-hybrid
if %errorlevel% equ 0 (
    echo OK: Redis container is running
) else (
    echo WARNING: Redis container not found!
    echo Please start it: cd .. && docker-compose up -d redis-hybrid
)
echo.

echo ==========================================
echo Restart Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Open dashboard: http://localhost:3000/
echo 2. Press Ctrl+Shift+R (or Ctrl+F5) to hard refresh browser
echo 3. Check browser console (F12) for any errors
echo.
pause

