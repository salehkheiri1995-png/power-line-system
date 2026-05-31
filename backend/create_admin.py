import bcrypt
from database import SessionLocal
from models import User

db = SessionLocal()

try:
    username = "saleh"
    password = "saleh"
    permissions = "dashboard,data,add,analytics,report,users,towers"

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    existing = db.query(User).filter(User.username == username).first()

    if existing:
        existing.password = hashed_password
        existing.role = "admin"
        existing.permissions = permissions
        print("Admin user updated successfully.")
    else:
        admin = User(
            username=username,
            password=hashed_password,
            role="admin",
            permissions=permissions,
        )
        db.add(admin)
        print("Admin user created successfully.")

    db.commit()

finally:
    db.close()