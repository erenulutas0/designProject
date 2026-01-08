@echo off
echo ==========================================
echo Starting Redis Visualization API Server
echo ==========================================
echo.

cd /d "%~dp0"

echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Port 3000 is in use by process %%a. Killing it...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo Checking Docker container...
docker ps --filter "name=redis-hybrid" --format "{{.Names}}" | findstr redis-hybrid >nul
if %errorlevel% neq 0 (
    echo WARNING: redis-hybrid container is not running!
    echo Please start it first: docker-compose up -d redis-hybrid
    echo.
)

echo Installing dependencies...
if not exist node_modules (
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo ==========================================
echo Starting API Server...
echo ==========================================
echo.
echo API Server: http://localhost:3000
echo Dashboard: Open dashboard.html in your browser
echo.
echo Press Ctrl+C to stop the server
echo.

node api-server.js

