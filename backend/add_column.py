import sqlite3

DB_PATH = "power_line.db"  # همان فایل دیتابیس که در backend قرار دارد

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE maintenance_records ADD COLUMN planned_task_id TEXT")
    print("✅ ستون planned_task_id با موفقیت اضافه شد.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("⚠️ ستون از قبل وجود دارد. نیازی به تغییر نیست.")
    else:
        print("❌ خطا:", e)

conn.commit()
conn.close()