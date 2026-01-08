@echo off
echo ==========================================
echo Redis Hybrid Persistence Visualization
echo ==========================================
echo.

echo [1/3] Checking Docker container...
docker ps --filter "name=redis-hybrid" --format "{{.Names}}" | findstr redis-hybrid >nul
if %errorlevel% neq 0 (
    echo ERROR: redis-hybrid container is not running!
    echo Please start it first: docker-compose up -d redis-hybrid
    pause
    exit /b 1
)
echo OK: Container is running
echo.

echo [2/3] Installing Node.js dependencies...
if not exist node_modules (
    call npm install
) else (
    echo Dependencies already installed
)
echo.

echo [3/3] Starting API server...
echo.
echo API Server will run on http://localhost:3000
echo Dashboard: Open dashboard.html in your browser
echo.
echo Press Ctrl+C to stop the server
echo.

node api-server.js

