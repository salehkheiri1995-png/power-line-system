@echo off
title Power Line Management

:: تغییر مسیر به پوشه‌ی ریشه‌ی پروژه (همان جایی که این فایل قرار دارد)
cd /d "%~dp0"

echo ============================================
echo    کهکشان داده‌های خطوط برق
echo ============================================

echo [1/2] راه‌اندازی بک‌اند (FastAPI)...
start "Backend" cmd /c "cd backend && call venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] راه‌اندازی فرانت‌اند (React + Vite)...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo ============================================
echo    بک‌اند:  http://localhost:8000
echo    فرانت‌اند: http://localhost:5173
echo    مستندات: http://localhost:8000/docs
echo ============================================
echo برای متوقف کردن، پنجره‌های بک‌اند و فرانت‌اند را ببندید.

:: نگه داشتن پنجره تا دیده شود
pause