@echo off
echo Checking for processes using port 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo Process %%a terminated successfully.
    ) else (
        echo Failed to terminate process %%a.
    )
)

timeout /t 1 /nobreak >nul
echo Port 3000 is now free.

