@echo off
setlocal
chcp 65001 >nul

echo =============================================
echo   Power Line System - LAN Runner
echo =============================================

aTitle Power Line System LAN Runner

set PROJECT_DIR=C:\reversscripts\power-line-system
set FRONTEND_DIR=%PROJECT_DIR%\frontend
set BACKEND_DIR=%PROJECT_DIR%\backend
set LAPTOP_IP=10.125.53.85
set FRONTEND_PORT=5173
set BACKEND_PORT=8000

echo [1/6] Checking project path...
if not exist "%PROJECT_DIR%" (
  echo ERROR: Project folder not found:
  echo %PROJECT_DIR%
  pause
  exit /b 1
)

echo [2/6] Updating frontend .env...
if not exist "%FRONTEND_DIR%" (
  echo ERROR: Frontend folder not found:
  echo %FRONTEND_DIR%
  pause
  exit /b 1
)

> "%FRONTEND_DIR%\.env" echo VITE_API_URL=http://%LAPTOP_IP%:%BACKEND_PORT%
echo VITE_HOST=0.0.0.0>> "%FRONTEND_DIR%\.env"

echo [3/6] Opening Windows Firewall ports...
netsh advfirewall firewall add rule name="PowerLine Frontend %FRONTEND_PORT%" dir=in action=allow protocol=TCP localport=%FRONTEND_PORT% >nul 2>&1
netsh advfirewall firewall add rule name="PowerLine Backend %BACKEND_PORT%" dir=in action=allow protocol=TCP localport=%BACKEND_PORT% >nul 2>&1

echo [4/6] Starting backend...
if exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
  start "PowerLine Backend" cmd /k "cd /d "%BACKEND_DIR%" && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port %BACKEND_PORT%"
) else if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
  start "PowerLine Backend" cmd /k "cd /d "%BACKEND_DIR%" && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port %BACKEND_PORT%"
) else (
  start "PowerLine Backend" cmd /k "cd /d "%BACKEND_DIR%" && python -m uvicorn main:app --host 0.0.0.0 --port %BACKEND_PORT%"
)

timeout /t 4 /nobreak >nul

echo [5/6] Starting frontend...
start "PowerLine Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%"

echo [6/6] Done.
echo.
echo Frontend for other devices:
echo   http://%LAPTOP_IP%:%FRONTEND_PORT%
echo.
echo Backend for other devices:
echo   http://%LAPTOP_IP%:%BACKEND_PORT%
echo.
echo If backend did not start, check the backend startup command.
echo Common fix: replace main:app with your real FastAPI entrypoint.
echo.
pause
