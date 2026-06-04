@echo off
chcp 65001 >nul
title Power Line System Launcher

set PROJECT=C:\reversscripts\power-line-system
set BACKEND=%PROJECT%\backend
set FRONTEND=%PROJECT%\frontend
set VITE_CONFIG=%FRONTEND%\vite.config.js

echo.
echo ============================================
echo   Power Line System - Starting...
echo ============================================
echo.

REM --- Kill everything first ---
taskkill /f /im ngrok.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM --- Fix vite.config.js ---
echo [1/5] Fixing vite.config.js...
(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo.
echo export default defineConfig^({
echo   plugins: [react^(^)],
echo   server: {
echo     port: 5173,
echo     allowedHosts: 'all',
echo     proxy: {
echo       '/api': 'http://localhost:8000'
echo     }
echo   }
echo }^)
) > "%VITE_CONFIG%"
echo     Done: vite.config.js fixed

REM --- Fix .env ---
echo [2/5] Writing .env...
echo VITE_API_URL=http://localhost:8000> "%FRONTEND%\.env"
echo     Done: .env written

REM --- Start Backend ---
echo [3/5] Starting Backend...
start "BACKEND" cmd /k "cd /d %BACKEND% && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 4 /nobreak >nul

REM --- Start Frontend ---
echo [4/5] Starting Frontend...
start "FRONTEND" cmd /k "cd /d %FRONTEND% && npm run dev -- --host 0.0.0.0 --port 5173"
timeout /t 6 /nobreak >nul

REM --- Start ngrok ---
echo [5/5] Starting ngrok...
start "NGROK" cmd /k "ngrok http 5173 --request-header-add ngrok-skip-browser-warning:true"
timeout /t 8 /nobreak >nul

REM --- Show URL ---
echo.
echo ============================================
powershell -command "$r = try { (Invoke-WebRequest 'http://localhost:4040/api/tunnels' -UseBasicParsing).Content | ConvertFrom-Json } catch { $null }; if ($r) { $url = $r.tunnels | Where-Object {$_.proto -eq 'https'} | Select-Object -ExpandProperty public_url; Write-Host ''; Write-Host '  >>> Public URL (share this):' -ForegroundColor Green; Write-Host ('      ' + $url) -ForegroundColor Yellow; Write-Host '' } else { Write-Host '  Could not get URL - check ngrok window' -ForegroundColor Red }"
echo ============================================
echo.
echo  Do NOT close the other windows!
echo  Press any key to close this launcher.
pause >nul
