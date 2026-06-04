@echo off
chcp 65001 >nul
title Power Line System

set PROJECT=C:\reversscripts\power-line-system
set BACKEND=%PROJECT%\backend
set FRONTEND=%PROJECT%\frontend

echo.
echo ============================================
echo   Power Line System - Launching...
echo ============================================
echo.

REM --- Kill old processes ---
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im ssh.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM --- Write serve.json for API proxy ---
echo [1/4] Writing serve.json...
(
echo {
echo   "rewrites": [
echo     { "source": "/api/:path*", "destination": "http://localhost:8000/api/:path*" }
echo   ]
echo }
) > "%FRONTEND%\serve.json"
echo     Done.

REM --- Start Backend ---
echo [2/4] Starting Backend...
start "BACKEND" cmd /k "cd /d %BACKEND% && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 4 /nobreak >nul

REM --- Build and Serve Frontend ---
echo [3/4] Building and Serving Frontend...
start "FRONTEND" cmd /k "cd /d %FRONTEND% && npm run build && serve dist -p 5173"
timeout /t 15 /nobreak >nul

REM --- SSH Tunnel ---
echo [4/4] Starting SSH Tunnel...
start "TUNNEL" cmd /k "ssh -o StrictHostKeyChecking=no -R 80:127.0.0.1:5173 serveo.net"
timeout /t 8 /nobreak >nul

echo.
echo ============================================
echo   Done! Check the TUNNEL window for URL
echo   Share that URL with others!
echo ============================================
echo.
echo  Do NOT close the other windows!
pause >nul
