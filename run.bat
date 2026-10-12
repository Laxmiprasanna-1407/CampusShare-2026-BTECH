@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   CampusShare: Peer-to-Peer College Item Rental Platform
echo ============================================================

REM 1. Verify or create .env from .env.example
if not exist "%~dp0.env" (
    echo [INFO] .env not found. Creating .env from .env.example...
    copy "%~dp0.env.example" "%~dp0.env" >nul
    echo [OK] Created .env with safe local defaults.
)

REM 2. Start Backend
echo [INFO] Starting Spring Boot Backend (Profile: local, H2 in MySQL mode)...
start "CampusShare-Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local"

REM Wait a few seconds for backend boot
echo [INFO] Waiting for backend initialization...
timeout /t 5 /nobreak >nul

REM 3. Start Frontend
echo [INFO] Starting React + Vite Frontend...
start "CampusShare-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo   CampusShare is running!
echo ============================================================
echo   Frontend Web App:    http://localhost:5173
echo   Backend REST API:    http://localhost:8080
echo   Swagger OpenAPI UI:  http://localhost:8080/swagger-ui.html
echo   Actuator Health:     http://localhost:8080/actuator/health
echo ============================================================
echo   To stop the applications, run stop.bat or close the windows.
echo ============================================================
endlocal
