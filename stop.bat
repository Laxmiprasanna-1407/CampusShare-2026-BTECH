@echo off
setlocal

echo ============================================================
echo   Stopping CampusShare Services...
echo ============================================================

REM Free port 8080 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 "') do (
    echo Stopping Backend process %%a on port 8080...
    taskkill /F /PID %%a >nul 2>&1
)

REM Free port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    echo Stopping Frontend process %%a on port 5173...
    taskkill /F /PID %%a >nul 2>&1
)

echo [OK] CampusShare services stopped.
endlocal
