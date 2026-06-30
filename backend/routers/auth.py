from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from auth import (
    verify_password, create_access_token, get_password_hash,
    get_current_user, get_current_admin_user
)
from database import get_db
from models import User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api", tags=["auth"])

# ========== Schemas ==========
class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    permissions: str

class UserSchema(BaseModel):
    id: int
    username: str
    role: str = "user"
    is_active: bool = True
    permissions: str = ""
    class Config: from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "user"
    permissions: str = "dashboard,data"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[str] = None

# ========== ورود ==========
@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="نام کاربری یا رمز عبور اشتباه است")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="حساب کاربری غیرفعال است")
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "permissions": user.permissions,
    }

# ========== اطلاعات کاربر فعلی ==========
@router.get("/users/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "permissions": current_user.permissions,
    }

# ========== مدیریت کاربران (فقط ادمین) ==========
@router.get("/users", response_model=List[UserSchema])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    return db.query(User).all()

@router.post("/users", response_model=UserSchema)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="این نام کاربری قبلاً ثبت شده است")
    user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        permissions=user_in.permissions,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}", response_model=UserSchema)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    if user_in.username is not None:
        user.username = user_in.username
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.permissions is not None:
        user.permissions = user_in.permissions
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    if user.username == "admin":
        raise HTTPException(status_code=400, detail="حذف کاربر ادمین اصلی مجاز نیست")
    db.delete(user)
    db.commit()
    return {"ok": True}
