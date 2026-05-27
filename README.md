# Power Line Data Management System

سیستم مدیریت و تحلیل تعمیرات خطوط برق (بک‌اند FastAPI + فرانت‌اند React/Vite).

## پیش‌نیازها

- Python 3.10+
- Node.js 18+
- Git

## راه‌اندازی بک‌اند

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # در ویندوز
pip install -r requirements.txt
```

متغیرهای محیطی (اختیاری – برای production توصیه می‌شود):

- `POWER_LINE_SECRET_KEY`  کلید JWT
- `POWER_LINE_DATABASE_URL`  آدرس دیتابیس (پیش‌فرض: `sqlite:///./power_line.db`)

اجرای سرور:

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## راه‌اندازی فرانت‌اند

```bash
cd frontend
npm install
npm run dev
```

در حالت توسعه، Vite درخواست‌های `/api` را به `http://localhost:8000` پروکسی می‌کند.

## اجرای سریع با اسکریپت

در ریشه‌ی پروژه:

```bash
start.bat
```

این اسکریپت بک‌اند (روی پورت 8000) و فرانت‌اند (روی پورت 5173) را با هم اجرا می‌کند.
