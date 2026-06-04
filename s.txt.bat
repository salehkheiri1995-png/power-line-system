@echo off
chcp 65001 >nul
title Power Line System Launcher

set PROJECT=C:\reversscripts\power-line-system
set BACKEND=%PROJECT%\backend
set FRONTEND=%PROJECT%\frontend

echo.
echo ============================================
echo   Power Line System - Starting...
echo ============================================
echo.

taskkill /f /im ngrok.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo VITE_API_URL=http://localhost:8000> "%FRONTEND%\.env"
echo [1/4] Written .env with localhost backend

echo [2/4] Starting Backend on port 8000...
start "BACKEND" cmd /k "cd /d %BACKEND% && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 4 /nobreak >nul

echo [3/4] Starting Frontend on port 5173...
start "FRONTEND" cmd /k "cd /d %FRONTEND% && npm run dev -- --host 0.0.0.0 --port 5173"
timeout /t 5 /nobreak >nul

echo [4/4] Starting ngrok tunnel for Frontend...
start "NGROK" cmd /k "ngrok http 5173"
timeout /t 8 /nobreak >nul

echo.
echo ============================================
powershell -command "$r = try { (Invoke-WebRequest 'http://localhost:4040/api/tunnels' -UseBasicParsing).Content | ConvertFrom-Json } catch { $null }; if ($r) { $url = $r.tunnels | Where-Object {$_.proto -eq 'https'} | Select-Object -ExpandProperty public_url; Write-Host ''; Write-Host '  >>> Public URL (share this):' -ForegroundColor Green; Write-Host ('      ' + $url) -ForegroundColor Yellow; Write-Host '' } else { Write-Host '  Could not get URL - check ngrok window' -ForegroundColor Red }"
echo ============================================
echo.
echo  Do NOT close the other windows!
echo  Press any key to close this launcher.
pause >nul