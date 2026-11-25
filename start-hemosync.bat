@echo off
title HemoSync - Blood Bank and Donor Slot Management System
color 0C
echo ============================================================================
echo   HEMOSYNC: BLOOD BANK AND DONOR SLOT MANAGEMENT SYSTEM
echo   Four Integrated Engines:
echo     1. OS - Donor Slot Scheduler (Port 5001)
echo     2. DSA - Compatibility Matcher (Port 5002) - Head of Engine
echo     3. DBMS - Inventory and Records Manager (Port 3306 / Embedded Engine)
echo     4. WEB - Control and Request Dashboard (Port 3000 API, Port 5173 UI)
echo ============================================================================
echo.

:: Automatically unblock all files if downloaded from internet
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue" >nul 2>&1

:: Start Engine 01: OS Scheduler (C++)
echo [1/4] Starting Engine 01: OS Scheduler on port 5001...
start "Engine 01 - OS Scheduler (Port 5001)" cmd /k "cd /d "%~dp0engines\os-scheduler" && scheduler_engine.exe 5001"
ping 127.0.0.1 -n 2 >nul

:: Start Engine 02: DSA Compatibility Matcher (C++)
echo [2/4] Starting Engine 02: DSA Compatibility Matcher on port 5002...
start "Engine 02 - DSA Matcher (Port 5002)" cmd /k "cd /d "%~dp0engines\dsa-compatibility" && compatibility_engine.exe 5002"
ping 127.0.0.1 -n 2 >nul

:: Start Node.js Backend Server
echo [3/4] Starting Node.js Backend API on port 3000...
start "Backend API Server (Port 3000)" cmd /k "cd /d "%~dp0backend" && node src/server.js"
ping 127.0.0.1 -n 3 >nul

:: Start React Frontend Dashboard
echo [4/4] Launching React Frontend Dashboard on port 5173...
start "Frontend Web Dashboard (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
ping 127.0.0.1 -n 3 >nul

:: Open browser automatically
start http://localhost:5173

echo.
echo ============================================================================
echo   ALL ENGINES LAUNCHED SUCCESSFULLY!
echo.
echo   Web Dashboard URL: http://localhost:5173
echo   Backend API URL:   http://localhost:3000/api
echo   OS Scheduler API:  http://localhost:5001/api/scheduler
echo   DSA Matcher API:   http://localhost:5002/api/compatibility
echo.
echo   Demo Login Accounts (All passwords: password123):
echo     - Admin:     admin@bloodbank.com
echo     - Staff:     staff@bloodbank.com
echo     - Donor:     donor1@bloodbank.com
echo     - Requester: requester@bloodbank.com
echo ============================================================================
echo.
if "%1"=="--no-pause" goto end
pause
:end
