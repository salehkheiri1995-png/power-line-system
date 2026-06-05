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


# ======================== Line (خطوط انتقال) ========================
class Line(Base):
    __tablename__ = "lines"

    # برای سازگاری با نسخه فعلی، شناسه همچنان رشته است (نام خط)، اما فیلدهای جدید کامل‌تر هستند
    id = Column(String, primary_key=True)  # LineCode به صورت یکتا
    name = Column(String, nullable=False)  # LineName
    voltage = Column(Integer, default=0)   # VoltageLevel
    length = Column(Float, default=0)      # TotalLengthKm
    status = Column(String, default="active")  # LineStatus
    color_class = Column(String, default="c1")
    color_hex = Column(String, default="#3b82f6")

    # فیلدهای تکمیلی بر اساس طراحی جدید
    line_code = Column(String, unique=True, nullable=True)
    line_name = Column(String, nullable=True)
    voltage_level = Column(Integer, nullable=True)
    current_type = Column(String, nullable=True)
    total_length_km = Column(Float, nullable=True)
    line_type = Column(String, nullable=True)
    number_of_circuits = Column(Integer, nullable=True)
    source_substation = Column(String, nullable=True)
    destination_substation = Column(String, nullable=True)
    commissioning_date = Column(Date, nullable=True)
    line_status = Column(String, nullable=True)
    last_inspection_date = Column(Date, nullable=True)
    max_transfer_mw = Column(Integer, nullable=True)
    rated_current_a = Column(Integer, nullable=True)
    geo_path = Column(Text, nullable=True)  # JSON path

    towers = relationship("Tower", back_populates="line")
    spans = relationship("Span", back_populates="line")
    inspections = relationship("Inspection", back_populates="line")


# ======================== Tower (دکل‌ها) ========================
class Tower(Base):
    __tablename__ = "towers"

    # در نسخه قبلی: id = "line_id||number" بود، آن را حفظ می‌کنیم
    id = Column(String, primary_key=True)
    line_id = Column(String, ForeignKey("lines.id"), nullable=False)
    number = Column(Integer, nullable=False)  # TowerNumber

    # مختصات قبلی (x,y) را نگه می‌داریم
    x = Column(Float, default=0)
    y = Column(Float, default=0)

    # فیلدهای جدید بر اساس طراحی کامل
    tower_code = Column(String, nullable=True)
    tower_type = Column(String, default="Suspension")
    material = Column(String, nullable=True)
    height_meters = Column(Float, nullable=True)
    arm_width_meters = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    altitude_meters = Column(Float, nullable=True)
    foundation_type = Column(String, nullable=True)
    foundation_depth_meters = Column(Float, nullable=True)
    foundation_date = Column(Date, nullable=True)
    anti_climbing_device = Column(Boolean, default=False)
    warning_sign = Column(Boolean, default=False)
    bird_nest_status = Column(String, nullable=True)
    last_inspection_date = Column(Date, nullable=True)
    inspection_report = Column(Text, nullable=True)
    photos = Column(Text, nullable=True)  # JSON list
    grounding_resistance_ohm = Column(Float, nullable=True)
    grounding_rod_count = Column(Integer, nullable=True)
    last_grounding_test_date = Column(Date, nullable=True)

    # فیلدهای نگه‌داری قبلی
    type = Column(String, default="معلق")
    height = Column(Float, default=40)
    last_maintenance = Column(String)
    next_maintenance = Column(String)

    line = relationship("Line", back_populates="towers")
    maintenance_records = relationship("MaintenanceRecord", back_populates="tower")
    planned_tasks = relationship("PlannedTask", back_populates="tower")

    grounding = relationship("TowerGrounding", back_populates="tower", uselist=False)
    insulators = relationship("Insulator", back_populates="tower")
    conductors = relationship("Conductor", back_populates="tower")
    fittings = relationship("HardwareFitting", back_populates="tower")
    span_from = relationship("Span", foreign_keys="Span.from_tower_id", back_populates="from_tower")
    span_to = relationship("Span", foreign_keys="Span.to_tower_id", back_populates="to_tower")
    inspections = relationship("Inspection", back_populates="tower")


# ======================== MaintenanceRecord (سوابق تعمیرات) ========================
class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(String, primary_key=True, default=lambda: 'rec_' + str(uuid4())[:8])
    tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    planned_task_id = Column(String, ForeignKey("planned_tasks.id"), nullable=True)
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
    planned_task = relationship("PlannedTask", backref="completed_record", uselist=False)


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


# ======================== User (کاربران) ========================
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # admin, manager, user
    is_active = Column(Boolean, default=True)
    permissions = Column(String, default="dashboard,data")


# ======================== Insulator (مقره) ========================
class Insulator(Base):
    __tablename__ = "insulators"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    phase_position = Column(String, nullable=True)
    insulator_type = Column(String, nullable=True)
    material = Column(String, nullable=True)
    number_of_discs = Column(Integer, nullable=True)
    mechanical_class_kn = Column(Integer, nullable=True)
    condition = Column(String, nullable=True)
    installation_date = Column(Date, nullable=True)

    tower = relationship("Tower", back_populates="insulators")


# ======================== Conductor (هادی) ========================
class Conductor(Base):
    __tablename__ = "conductors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    phase_number = Column(Integer, nullable=True)
    conductor_type = Column(String, nullable=True)
    cross_section_mm2 = Column(Integer, nullable=True)
    strand_count = Column(Integer, nullable=True)
    tension_kgf = Column(Float, nullable=True)
    sag_mm = Column(Float, nullable=True)
    clamp_type = Column(String, nullable=True)

    tower = relationship("Tower", back_populates="conductors")


# ======================== HardwareFitting (یراق‌آلات) ========================
class HardwareFitting(Base):
    __tablename__ = "hardware_fittings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    fitting_type = Column(String, nullable=True)
    subtype = Column(String, nullable=True)
    quantity = Column(Integer, nullable=True)
    installation_date = Column(Date, nullable=True)
    condition = Column(String, nullable=True)

    tower = relationship("Tower", back_populates="fittings")


# ======================== TowerGrounding (سیستم ارت دکل) ========================
class TowerGrounding(Base):
    __tablename__ = "tower_groundings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tower_id = Column(String, ForeignKey("towers.id"), unique=True, nullable=False)
    resistance_ohm = Column(Float, nullable=True)
    electrode_type = Column(String, nullable=True)
    number_of_electrodes = Column(Integer, nullable=True)
    test_date = Column(Date, nullable=True)
    next_test_due_date = Column(Date, nullable=True)

    tower = relationship("Tower", back_populates="grounding")


# ======================== Span (دهانه) ========================
class Span(Base):
    __tablename__ = "spans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    line_id = Column(String, ForeignKey("lines.id"), nullable=False)
    from_tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    to_tower_id = Column(String, ForeignKey("towers.id"), nullable=False)
    span_length_meters = Column(Float, nullable=True)
    terrain_type = Column(String, nullable=True)
    min_ground_clearance_meters = Column(Float, nullable=True)
    mid_span_damper_count = Column(Integer, nullable=True)

    line = relationship("Line", back_populates="spans")
    from_tower = relationship("Tower", foreign_keys=[from_tower_id], back_populates="span_from")
    to_tower = relationship("Tower", foreign_keys=[to_tower_id], back_populates="span_to")


# ======================== Inspection (بازرسی) ========================
class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tower_id = Column(String, ForeignKey("towers.id"), nullable=True)
    line_id = Column(String, ForeignKey("lines.id"), nullable=True)
    inspection_date = Column(Date, nullable=True)
    inspection_type = Column(String, nullable=True)
    inspector_name = Column(String, nullable=True)
    defects_found = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=True)
    next_inspection_date = Column(Date, nullable=True)

    tower = relationship("Tower", back_populates="inspections")
    line = relationship("Line", back_populates="inspections")
