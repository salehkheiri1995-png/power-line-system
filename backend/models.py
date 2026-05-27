from sqlalchemy import Column, Integer, String, Float, Date, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from uuid import uuid4
from database import Base

# ======================== PowerLineRecord (رکوردهای اصلی) ========================
class PowerLineRecord(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String, nullable=True)                # کد
    line_name = Column(String, nullable=True)           # نام خط
    voltage_level = Column(String, nullable=True)       # سطح ولتاژ
    program_type = Column(String, nullable=True)        # نوع برنامه (سرد/گرم)
    work_description = Column(String, nullable=True)    # شرح انجام کار
    tower_number = Column(String, nullable=True)        # شماره دکل
    location = Column(String, nullable=True)            # موقعیت
    pm_date = Column(String, nullable=True)             # تاریخ pm (شمسی)
    execution_date = Column(String, nullable=True)      # تاریخ انجام (شمسی)
    team_count = Column(Float, nullable=True)           # تعداد اکیپ
    personnel_count = Column(Float, nullable=True)      # تعداد نفرات
    supervisor = Column(String, nullable=True)          # نام سرپرست اکیپ
    quantity = Column(Float, nullable=True)             # مقدار
    unit = Column(String, nullable=True)                # واحد
    tower_number2 = Column(String, nullable=True)       # شماره دکل2 (برای سرد)
    title_of_work = Column(String, nullable=True)       # عنوان کار (گرم)
    extra_tower_number = Column(String, nullable=True)  # شماره دکل (گرم)

# ======================== User (کاربران) ========================

# ======================== Line (خطوط) ========================
class Line(Base):
    __tablename__ = "lines"
    id = Column(String, primary_key=True)  # نام خط (شناسه یکتا)
    name = Column(String, nullable=False)
    voltage = Column(Integer, default=0)
    length = Column(Float, default=0)
    status = Column(String, default="active")
    color_class = Column(String, default="c1")
    color_hex = Column(String, default="#3b82f6")
    towers = relationship("Tower", back_populates="line")

# ======================== Tower (دکل‌ها) ========================
class Tower(Base):
    __tablename__ = "towers"
    id = Column(String, primary_key=True)  # "line_id||number"
    line_id = Column(String, ForeignKey("lines.id"), nullable=False)
    number = Column(Integer, nullable=False)
    x = Column(Float, default=0)
    y = Column(Float, default=0)
    type = Column(String, default="معلق")
    height = Column(Float, default=40)
    last_maintenance = Column(String)
    next_maintenance = Column(String)
    line = relationship("Line", back_populates="towers")
    maintenance_records = relationship("MaintenanceRecord", back_populates="tower")
    planned_tasks = relationship("PlannedTask", back_populates="tower")

# ======================== MaintenanceRecord (سوابق تعمیرات) ========================
class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(String, primary_key=True, default=lambda: 'rec_' + str(uuid4())[:8])
    tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    planned_task_id = Column(String, ForeignKey("planned_tasks.id"), nullable=True)  # ← جدید: ارتباط با برنامه
    date = Column(String)                          # تاریخ شمسی
    gregorian_date = Column(DateTime)              # تاریخ میلادی
    type = Column(String)                          # نوع تعمیر
    program_type = Column(String)                  # سرد/گرم/برنامه‌ریزی
    description = Column(Text)                     # شرح کار
    supervisor = Column(String)                    # سرپرست
    crew = Column(String)                          # تعداد اکیپ
    personnel = Column(String)                     # تعداد نفرات
    location = Column(String)                      # موقعیت
    status = Column(String, default="completed")   # "completed" یا "planned"
    tower = relationship("Tower", back_populates="maintenance_records")
    planned_task = relationship("PlannedTask", backref="completed_record", uselist=False)  # ← جدید

# ======================== PlannedTask (برنامه‌های زمان‌بندی‌شده) ========================
class PlannedTask(Base):
    __tablename__ = "planned_tasks"
    id = Column(String, primary_key=True, default=lambda: 'plan_' + str(uuid4())[:8])
    tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    line_id = Column(String)                      # نام خط (برای سهولت)
    number = Column(Integer)                      # شماره دکل
    date = Column(String)                         # تاریخ شمسی برنامه
    gregorian_date = Column(DateTime)             # تاریخ میلادی
    type = Column(String)                         # نوع تعمیر
    description = Column(Text)                    # شرح کار
    supervisor = Column(String)                   # سرپرست
    crew = Column(String)                         # تعداد اکیپ
    personnel = Column(String)                    # تعداد نفرات
    status = Column(String, default="planned")    # "planned" تا وقتی تکمیل نشده
    tower = relationship("Tower", back_populates="planned_tasks")
    # completed_record به‌صورت خودکار از MaintenanceRecord ایجاد می‌شود (backref)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # admin, manager, user
    is_active = Column(Boolean, default=True)
    permissions = Column(String, default="dashboard,data")  # بخش‌های مجاز با کاما جدا می‌شوند