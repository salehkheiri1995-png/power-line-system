import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.items import router as items_router
from routers.auth import router as auth_router
from routers.lines_towers import router as lines_towers_router
from routers.analytics import router as analytics_router
from routers.grid import router as grid_router
from database import engine, Base, SessionLocal
from models import User
from auth import get_password_hash

app = FastAPI(title="Power Line Data Management")

# ======= CORS =======
# در فایل .env مقدار ALLOWED_ORIGINS را تعریف کنید، مثلاً:
# ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.10:5173
_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]
if not allowed_origins:
    # فقط در محیط توسعه local اجازه می‌دهیم
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items_router)
app.include_router(lines_towers_router)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(grid_router)

# ایجاد جداول
Base.metadata.create_all(bind=engine)


def init_admin():
    """ساخت کاربر ادمین پیش‌فرض - پسورد از env خوانده می‌شود"""
    admin_password = os.getenv("POWER_LINE_ADMIN_PASSWORD")
    if not admin_password:
        import warnings
        warnings.warn(
            "متغیر POWER_LINE_ADMIN_PASSWORD تنظیم نشده است. "
            "کاربر ادمین پیش‌فرض ساخته نمی‌شود. "
            "لطفاً این متغیر را در .env تعریف کنید.",
            stacklevel=2,
        )
        return
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            admin_user = User(
                username="admin",
                hashed_password=get_password_hash(admin_password),
                role="admin",
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()


init_admin()


@app.get("/")
def read_root():
    return {"message": "Power Line API is running"}
