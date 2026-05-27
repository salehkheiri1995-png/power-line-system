from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from routers.items import router as items_router
from routers.auth import router as auth_router
from routers.lines_towers import router as lines_towers_router
from routers.analytics import router as analytics_router
from database import engine, Base, SessionLocal
from models import User
from auth import get_password_hash

app = FastAPI(title="Power Line Data Management")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items_router)
app.include_router(lines_towers_router)
app.include_router(auth_router)
app.include_router(analytics_router)

# ایجاد جداول و کاربر پیش‌فرض
Base.metadata.create_all(bind=engine)


def init_admin():
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
    db.close()


init_admin()


@app.get("/")
def read_root():
    return {"message": "Power Line API is running"}
