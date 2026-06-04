@echo off
chcp 65001 >nul
title Power Line System - Full Launcher

set PROJECT=C:\reversscripts\power-line-system
set BACKEND=%PROJECT%\backend
set FRONTEND=%PROJECT%\frontend

echo.
echo ============================================
echo   Power Line System - Full Launcher
echo ============================================
echo.

REM --- Update ngrok ---
echo [1/5] Updating ngrok...
ngrok update >nul 2>&1

REM --- Start Backend ---
echo [2/5] Starting Backend...
start "BACKEND" cmd /k "cd /d %BACKEND% && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 4 /nobreak >nul

REM --- Tunnel Backend ---
echo [3/5] Tunneling Backend with ngrok...
start "NGROK-BACKEND" cmd /k "ngrok http 8000 --log stdout"
echo.
echo >>>  Waiting for backend tunnel to start...
timeout /t 8 /nobreak >nul

REM --- Get backend URL from ngrok API ---
echo [4/5] Getting backend tunnel URL...
for /f "delims=" %%i in ('powershell -command "(Invoke-WebRequest -Uri http://localhost:4040/api/tunnels -UseBasicParsing).Content | ConvertFrom-Json | Select -ExpandProperty tunnels | Where-Object {$_.proto -eq 'https'} | Select -ExpandProperty public_url"') do set BACKEND_URL=%%i

echo.
echo    Backend URL: %BACKEND_URL%
echo.

REM --- Write .env for frontend ---
echo [4.5/5] Writing frontend .env...
echo VITE_API_URL=%BACKEND_URL%> "%FRONTEND%\.env"
echo Written: VITE_API_URL=%BACKEND_URL%

REM --- Start Frontend ---
echo [5/5] Starting Frontend...
start "FRONTEND" cmd /k "cd /d %FRONTEND% && npm run dev -- --host 0.0.0.0 --port 5173"
timeout /t 6 /nobreak >nul

REM --- Tunnel Frontend ---
start "NGROK-FRONTEND" cmd /k "ngrok http 5173 --log stdout"
timeout /t 8 /nobreak >nul

REM --- Get frontend URL ---
echo.
echo ============================================
echo   Getting your public URLs...
echo ============================================
echo.

powershell -command ^
  "$tunnels = (Invoke-WebRequest -Uri 'http://localhost:4040/api/tunnels' -UseBasicParsing).Content | ConvertFrom-Json | Select -ExpandProperty tunnels;" ^
  "Write-Host ''; Write-Host '  ============================================' -ForegroundColor Cyan;" ^
  "Write-Host '  Frontend (share this):' -ForegroundColor Green;" ^
  "Write-Host '' ; " ^
  "$tunnels | ForEach-Object { Write-Host ('    ' + $_.public_url) -ForegroundColor Yellow };" ^
  "Write-Host '  ============================================' -ForegroundColor Cyan; Write-Host '';"

echo.
echo  Press any key to exit launcher (tunnels will keep running)
pause >nul
