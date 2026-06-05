"""
migrate_grid.py
---------------
Run ONCE to bring an existing power-line-system SQLite database in sync
with the new grid-entity columns added in branch feature-grid-entities.

Usage (from the backend/ directory):
    python migrate_grid.py

It is safe to run multiple times – every ALTER TABLE is wrapped in a
check that silently skips already-existing columns/tables.
"""

import sqlite3
import os

# نام واقعی دیتابیس طبق database.py
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "power_line.db")


def col_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def table_exists(cursor, table: str) -> bool:
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
    )
    return cursor.fetchone() is not None


def add_column(cursor, table: str, column: str, col_type: str, default=None):
    if col_exists(cursor, table, column):
        print(f"  [skip]  {table}.{column} already exists")
        return
    default_clause = f" DEFAULT {default}" if default is not None else ""
    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause}")
    print(f"  [added] {table}.{column}")


def migrate(conn: sqlite3.Connection):
    cur = conn.cursor()

    print("\n=== Migrating table: lines ===")
    line_cols = [
        ("line_code",               "TEXT",    None),
        ("line_name",               "TEXT",    None),
        ("voltage_level",           "INTEGER", None),
        ("current_type",            "TEXT",    None),
        ("total_length_km",         "REAL",    None),
        ("line_type",               "TEXT",    None),
        ("number_of_circuits",      "INTEGER", None),
        ("source_substation",       "TEXT",    None),
        ("destination_substation",  "TEXT",    None),
        ("commissioning_date",      "TEXT",    None),
        ("line_status",             "TEXT",    None),
        ("last_inspection_date",    "TEXT",    None),
        ("max_transfer_mw",         "INTEGER", None),
        ("rated_current_a",         "INTEGER", None),
        ("geo_path",                "TEXT",    None),
    ]
    for col, typ, dflt in line_cols:
        add_column(cur, "lines", col, typ, dflt)

    print("\n=== Migrating table: towers ===")
    tower_cols = [
        ("tower_code",               "TEXT",    None),
        ("tower_type",               "TEXT",    "'Suspension'"),
        ("material",                 "TEXT",    None),
        ("height_meters",            "REAL",    None),
        ("arm_width_meters",         "REAL",    None),
        ("latitude",                 "REAL",    None),
        ("longitude",                "REAL",    None),
        ("altitude_meters",          "REAL",    None),
        ("foundation_type",          "TEXT",    None),
        ("foundation_depth_meters",  "REAL",    None),
        ("foundation_date",          "TEXT",    None),
        ("anti_climbing_device",     "INTEGER", "0"),
        ("warning_sign",             "INTEGER", "0"),
        ("bird_nest_status",         "TEXT",    None),
        ("last_inspection_date",     "TEXT",    None),
        ("inspection_report",        "TEXT",    None),
        ("photos",                   "TEXT",    None),
        ("grounding_resistance_ohm", "REAL",    None),
        ("grounding_rod_count",      "INTEGER", None),
        ("last_grounding_test_date", "TEXT",    None),
    ]
    for col, typ, dflt in tower_cols:
        add_column(cur, "towers", col, typ, dflt)

    print("\n=== Creating table: insulators ===")
    if not table_exists(cur, "insulators"):
        cur.execute("""
            CREATE TABLE insulators (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                tower_id            TEXT    NOT NULL REFERENCES towers(id),
                phase_position      TEXT,
                insulator_type      TEXT,
                material            TEXT,
                number_of_discs     INTEGER,
                mechanical_class_kn INTEGER,
                condition           TEXT,
                installation_date   TEXT
            )
        """)
        print("  [created] insulators")
    else:
        print("  [skip]  insulators already exists")

    print("\n=== Creating table: conductors ===")
    if not table_exists(cur, "conductors"):
        cur.execute("""
            CREATE TABLE conductors (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                tower_id          TEXT    NOT NULL REFERENCES towers(id),
                phase_number      INTEGER,
                conductor_type    TEXT,
                cross_section_mm2 INTEGER,
                strand_count      INTEGER,
                tension_kgf       REAL,
                sag_mm            REAL,
                clamp_type        TEXT
            )
        """)
        print("  [created] conductors")
    else:
        print("  [skip]  conductors already exists")

    print("\n=== Creating table: hardware_fittings ===")
    if not table_exists(cur, "hardware_fittings"):
        cur.execute("""
            CREATE TABLE hardware_fittings (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                tower_id          TEXT    NOT NULL REFERENCES towers(id),
                fitting_type      TEXT,
                subtype           TEXT,
                quantity          INTEGER,
                installation_date TEXT,
                condition         TEXT
            )
        """)
        print("  [created] hardware_fittings")
    else:
        print("  [skip]  hardware_fittings already exists")

    print("\n=== Creating table: tower_groundings ===")
    if not table_exists(cur, "tower_groundings"):
        cur.execute("""
            CREATE TABLE tower_groundings (
                id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                tower_id             TEXT    NOT NULL UNIQUE REFERENCES towers(id),
                resistance_ohm       REAL,
                electrode_type       TEXT,
                number_of_electrodes INTEGER,
                test_date            TEXT,
                next_test_due_date   TEXT
            )
        """)
        print("  [created] tower_groundings")
    else:
        print("  [skip]  tower_groundings already exists")

    print("\n=== Creating table: spans ===")
    if not table_exists(cur, "spans"):
        cur.execute("""
            CREATE TABLE spans (
                id                          INTEGER PRIMARY KEY AUTOINCREMENT,
                line_id                     TEXT    NOT NULL REFERENCES lines(id),
                from_tower_id               TEXT    NOT NULL REFERENCES towers(id),
                to_tower_id                 TEXT    NOT NULL REFERENCES towers(id),
                span_length_meters          REAL,
                terrain_type                TEXT,
                min_ground_clearance_meters REAL,
                mid_span_damper_count       INTEGER
            )
        """)
        print("  [created] spans")
    else:
        print("  [skip]  spans already exists")

    print("\n=== Creating table: inspections ===")
    if not table_exists(cur, "inspections"):
        cur.execute("""
            CREATE TABLE inspections (
                id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                tower_id             TEXT    REFERENCES towers(id),
                line_id              TEXT    REFERENCES lines(id),
                inspection_date      TEXT,
                inspection_type      TEXT,
                inspector_name       TEXT,
                defects_found        TEXT,
                action_taken         TEXT,
                next_inspection_date TEXT
            )
        """)
        print("  [created] inspections")
    else:
        print("  [skip]  inspections already exists")

    conn.commit()
    print("\n✅ Migration complete.")


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("   Make sure you run this from the backend/ directory and the app has been started at least once.")
    else:
        print(f"🔧 Migrating database: {DB_PATH}")
        with sqlite3.connect(DB_PATH) as conn:
            migrate(conn)
