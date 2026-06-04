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

REM --- Kill old processes ---
echo [0/5] Cleaning up old processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im ssh.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM --- Build Frontend ---
echo [1/5] Building frontend...
cd /d "%FRONTEND%"
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo     Build OK.

REM --- Write proxy server ---
echo [2/5] Creating proxy server...
(
echo const http = require^('http'^);
echo const fs = require^('fs'^);
echo const path = require^('path'^);
echo const url = require^('url'^);
echo.
echo const PORT = 5173;
echo const DIST = path.join^(__dirname, 'dist'^);
echo const API_TARGET = 'http://127.0.0.1:8000';
echo.
echo const MIME = {
echo   '.html': 'text/html',
echo   '.js':   'application/javascript',
echo   '.css':  'text/css',
echo   '.png':  'image/png',
echo   '.jpg':  'image/jpeg',
echo   '.svg':  'image/svg+xml',
echo   '.ico':  'image/x-icon',
echo   '.json': 'application/json',
echo   '.woff': 'font/woff',
echo   '.woff2':'font/woff2',
echo };
echo.
echo http.createServer^(^(req, res^) =^> {
echo   if ^(req.url.startsWith^('/api'^)^) {
echo     const options = {
echo       hostname: '127.0.0.1',
echo       port: 8000,
echo       path: req.url,
echo       method: req.method,
echo       headers: req.headers,
echo     };
echo     const proxy = http.request^(options, ^(r^) =^> {
echo       res.writeHead^(r.statusCode, r.headers^);
echo       r.pipe^(res^);
echo     }^);
echo     proxy.on^('error', ^(^) =^> { res.writeHead^(502^); res.end^('Backend not reachable'^); }^);
echo     req.pipe^(proxy^);
echo     return;
echo   }
echo.
echo   let filePath = path.join^(DIST, req.url === '/' ? 'index.html' : req.url^);
echo   if ^(!fs.existsSync^(filePath^)^) filePath = path.join^(DIST, 'index.html'^);
echo   const ext = path.extname^(filePath^);
echo   res.writeHead^(200, { 'Content-Type': MIME[ext] ^|^| 'text/plain' }^);
echo   fs.createReadStream^(filePath^).pipe^(res^);
echo }^).listen^(PORT, ^(^) =^> {
echo   console.log^('Proxy server running at http://localhost:' + PORT^);
echo }^);
) > "%FRONTEND%\proxy-server.js"
echo     proxy-server.js created.

REM --- Start Backend ---
echo [3/5] Starting Backend (port 8000)...
start "BACKEND" cmd /k "cd /d %BACKEND% && python -m uvicorn main:app --host 127.0.0.1 --port 8000"
timeout /t 5 /nobreak >nul

REM --- Start Proxy Server ---
echo [4/5] Starting Proxy Server (port 5173)...
start "FRONTEND (Proxy)" cmd /k "cd /d %FRONTEND% && node proxy-server.js"
timeout /t 4 /nobreak >nul

REM --- SSH Tunnel ---
echo [5/5] Starting SSH Tunnel via serveo.net...
start "SSH TUNNEL" cmd /k "ssh -o StrictHostKeyChecking=no -R 80:127.0.0.1:5173 serveo.net"
timeout /t 8 /nobreak >nul

echo.
echo ============================================
echo   All services started!
echo   >> Open TUNNEL window to get public URL
echo   >> Local: http://localhost:5173
echo   Do NOT close any window!
echo ============================================
echo.
pause >nul
