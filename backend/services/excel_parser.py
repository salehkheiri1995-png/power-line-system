"""تجزیه فایل‌های اکسل تعمیرات خطوط برق.

این ماژول تلاش می‌کند ساختار فایل را خودکار تشخیص دهد:
- سطر هدر لازم نیست حتماً سطر چهارم باشد؛ در ۱۵ سطر اول جستجو می‌شود.
- نام شیت‌های غیرداده‌ای (مثل «اطلاعات فیلتر») نادیده گرفته می‌شوند.
- ستون‌ها بر اساس عنوان (فارسی/عربی/با فاصله یا بدون فاصله) نگاشت می‌شوند.
- تاریخ میلادی/سریال اکسل به تاریخ شمسی تبدیل می‌شود.
- اعداد فارسی/عربی و جداکننده هزارگان پاک‌سازی می‌شوند.
"""

import re
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import openpyxl

try:
    import jdatetime
except ImportError:  # pragma: no cover - jdatetime در requirements هست
    jdatetime = None


# ======================== ثابت‌ها ========================

FIELDS = [
    "program_type",
    "code",
    "line_name",
    "voltage_level",
    "work_description",
    "tower_number",
    "location",
    "pm_date",
    "execution_date",
    "team_count",
    "personnel_count",
    "supervisor",
    "quantity",
    "unit",
    "tower_number2",
    "title_of_work",
    "extra_tower_number",
]

NUMERIC_FIELDS = {"team_count", "personnel_count", "quantity"}
DATE_FIELDS = {"pm_date", "execution_date"}

# ستون‌هایی که وجودشان نشانه‌ی قطعی یک شیت داده است
_KEY_FIELDS = {"line_name", "work_description", "execution_date", "tower_number"}

_HEADER_SCAN_ROWS = 15

_FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
_AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"
_DIGIT_TABLE = str.maketrans(_FA_DIGITS + _AR_DIGITS, "0123456789" * 2)


# ======================== پاک‌سازی مقادیر ========================

def _to_ascii_digits(value: str) -> str:
    return value.translate(_DIGIT_TABLE)


def _normalize_text(value: Any) -> str:
    """حروف عربی -> فارسی، ارقام فارسی -> لاتین، حذف فاصله‌های کنترلی."""
    if value is None:
        return ""
    text = _to_ascii_digits(str(value))
    text = text.replace("ي", "ی").replace("ك", "ک")
    text = text.replace("\u200e", "").replace("\u200f", "")
    text = text.replace("\xa0", " ").replace("\u202f", " ")
    return text.strip()


def _norm_header(value: Any) -> str:
    """عنوان ستون را برای مقایسه یکسان‌سازی می‌کند (بدون فاصله و نویسه‌های مخفی)."""
    text = _normalize_text(value)
    text = text.replace("\u200c", " ").replace("_", " ")
    text = re.sub(r"\s+", "", text)
    return text.lower()


# ======================== نگاشت عنوان ستون‌ها ========================

_EXACT_HEADERS = {
    "نوعبرنامه": "program_type",
    "نوع": "program_type",
    "کد": "code",
    "کدبرنامه": "code",
    "نامخط": "line_name",
    "خط": "line_name",
    "سطحولتاژ": "voltage_level",
    "ولتاژ": "voltage_level",
    "شرحانجامکار": "work_description",
    "شرحکار": "work_description",
    "شرح": "work_description",
    "شمارهدکل": "tower_number",
    "شمارهدکل1": "tower_number",
    "شمارهدکل2": "tower_number2",
    "شمارهدکلدوم": "tower_number2",
    "موقعیت": "location",
    "منطقه": "location",
    "محل": "location",
    "تاریخpm": "pm_date",
    "تاریخثبت": "pm_date",
    "تاریخگزارش": "pm_date",
    "تاریخانجام": "execution_date",
    "تاریخاجرا": "execution_date",
    "تعداداکیپ": "team_count",
    "اکیپ": "team_count",
    "تعدادنفرات": "personnel_count",
    "نفرات": "personnel_count",
    "تعدادپرسنل": "personnel_count",
    "نامسرپرستاکیپ": "supervisor",
    "نامسرپرست": "supervisor",
    "سرپرستاکیپ": "supervisor",
    "سرپرست": "supervisor",
    "مقدار": "quantity",
    "واحد": "unit",
    "عنوانکار": "title_of_work",
    "شماره": "extra_tower_number",
}


def _match_header(value: Any) -> Optional[str]:
    """عنوان ستون اکسل را به نام فیلد مدل تبدیل می‌کند."""
    header = _norm_header(value)
    if not header:
        return None

    if header in _EXACT_HEADERS:
        return _EXACT_HEADERS[header]

    # تطبیق بر اساس کلیدواژه (برای فایل‌هایی با عنوان‌های کمی متفاوت)
    if "شمارهدکل" in header:
        if "2" in header or "دوم" in header or "دوتا" in header:
            return "tower_number2"
        return "tower_number"
    if header.startswith("تاریخ") or header.startswith("date"):
        if "انجام" in header or "اجرا" in header:
            return "execution_date"
        if "pm" in header or "ثبت" in header or "گزارش" in header:
            return "pm_date"
        return None
    if "سرپرست" in header:
        return "supervisor"
    if "تعداد" in header and "اکیپ" in header:
        return "team_count"
    if "تعداد" in header and ("نفر" in header or "پرسنل" in header):
        return "personnel_count"
    if "ولتاژ" in header:
        return "voltage_level"
    if "شرح" in header:
        return "work_description"
    if "عنوان" in header and "کار" in header:
        return "title_of_work"
    if "نام" in header and "خط" in header:
        return "line_name"
    if "موقعیت" in header or "منطقه" in header:
        return "location"
    if "مقدار" in header or header == "تعداد":
        return "quantity"
    if "واحد" in header:
        return "unit"
    if "نوع" in header and "برنامه" in header:
        return "program_type"
    if header.startswith("کد") and "نام" not in header:
        return "code"
    if header.startswith("شماره"):
        return "extra_tower_number"
    return None


def _header_map(row: Tuple[Any, ...]) -> Dict[str, int]:
    mapping: Dict[str, int] = {}
    for idx, cell in enumerate(row):
        field = _match_header(cell)
        if field and field not in mapping:
            mapping[field] = idx
    return mapping


def _find_header(rows: List[Tuple[Any, ...]]) -> Tuple[Optional[int], Dict[str, int]]:
    """سطر هدر را در ابتدای شیت پیدا می‌کند."""
    best: Optional[Tuple[int, int, Dict[str, int]]] = None
    for idx, row in enumerate(rows[:_HEADER_SCAN_ROWS]):
        mapping = _header_map(row)
        if not mapping:
            continue
        # ستون‌های کلیدی وزن بیشتری دارند تا سطر داده با سطر هدر اشتباه نشود
        score = len(mapping) + 4 * len(_KEY_FIELDS & set(mapping))
        if best is None or score > best[0]:
            best = (score, idx, mapping)

    if best is None:
        return None, {}
    score, idx, mapping = best
    # حداقل ۳ ستون شناخته‌شده لازم است تا یک سطر به‌عنوان هدر پذیرفته شود
    if len(mapping) < 3 or score < 8:
        return None, {}
    return idx, mapping


# ======================== تبدیل تاریخ ========================

def _gregorian_to_jalali_str(value: date) -> str:
    if jdatetime is None:
        return value.strftime("%Y-%m-%d")
    converted = jdatetime.date.fromgregorian(date=value)
    return f"{converted.year}/{converted.month:02d}/{converted.day:02d}"


def _clean_date(value: Any) -> Optional[str]:
    if value is None:
        return None

    if isinstance(value, datetime):
        return _gregorian_to_jalali_str(value.date())
    if isinstance(value, date):
        return _gregorian_to_jalali_str(value)

    if isinstance(value, bool):
        return None

    if isinstance(value, (int, float)):
        # سریال تاریخ اکسل (مثلاً 45000) در محدوده‌ی منطقی
        if 20000 < float(value) < 80000:
            base = datetime(1899, 12, 30) + timedelta(days=float(value))
            return _gregorian_to_jalali_str(base.date())
        value = int(value) if float(value).is_integer() else value

    text = _to_ascii_digits(str(value)).strip()
    if not text:
        return None

    text = re.sub(r"\s+", "", text)
    text = text.replace("-", "/").replace(".", "/").replace("\\", "/")
    parts = text.split("/")
    if len(parts) != 3:
        return text

    try:
        year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        return text

    # اگر تاریخ میلادی بود به شمسی تبدیل می‌شود
    if 1900 <= year <= 2100:
        try:
            return _gregorian_to_jalali_str(date(year, month, day))
        except ValueError:
            return text

    if year < 100:
        year += 1400
    return f"{year}/{month:02d}/{day:02d}"


# ======================== تبدیل عدد ========================

def _clean_number(value: Any) -> Optional[float]:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)

    text = _to_ascii_digits(str(value)).strip()
    if not text:
        return None
    text = text.replace(",", "").replace("٬", "").replace("،", "").replace(" ", "")
    try:
        return float(text)
    except ValueError:
        return None


# ======================== تبدیل متن ========================

def _clean_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return _gregorian_to_jalali_str(value.date())
    if isinstance(value, date):
        return _gregorian_to_jalali_str(value)
    if isinstance(value, float) and value.is_integer():
        value = int(value)

    text = _normalize_text(value)
    text = re.sub(r"\s{2,}", " ", text)
    return text or None


# ======================== ساخت رکورد ========================

def _build_record(row: Tuple[Any, ...], mapping: Dict[str, int]) -> Dict[str, Any]:
    record: Dict[str, Any] = {field: None for field in FIELDS}
    for field, idx in mapping.items():
        value = row[idx] if idx < len(row) else None
        if field in NUMERIC_FIELDS:
            record[field] = _clean_number(value)
        elif field in DATE_FIELDS:
            record[field] = _clean_date(value)
        else:
            record[field] = _clean_text(value)
    return record


def _is_meaningful(record: Dict[str, Any]) -> bool:
    return any(
        record.get(key)
        for key in ("line_name", "work_description", "execution_date", "tower_number", "code", "title_of_work")
    )


def _program_type_from_sheet(sheet_name: str) -> Optional[str]:
    name = _norm_header(sheet_name)
    if "سرد" in name:
        return "سرد"
    if "گرم" in name:
        return "گرم"
    return None


def _normalize_program_type(value: Optional[str], fallback: Optional[str]) -> Optional[str]:
    if value:
        text = _norm_header(value)
        if "سرد" in text:
            return "سرد"
        if "گرم" in text:
            return "گرم"
        return value
    return fallback


# ======================== API عمومی ========================

def parse_workbook(file_path: str) -> Dict[str, Any]:
    """فایل اکسل را می‌خواند و رکوردها + گزارش شیت‌ها را برمی‌گرداند."""
    workbook = openpyxl.load_workbook(file_path, data_only=True)
    records: List[Dict[str, Any]] = []
    sheets: List[Dict[str, Any]] = []

    try:
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            rows = list(sheet.iter_rows(values_only=True))
            header_row, mapping = _find_header(rows)

            if header_row is None:
                sheets.append({
                    "name": sheet_name,
                    "imported": 0,
                    "skipped": True,
                    "reason": "سطر هدر شناسایی نشد (شیت اطلاعاتی است)",
                })
                continue

            sheet_type = _program_type_from_sheet(sheet_name)
            imported = 0
            skipped = 0
            for row in rows[header_row + 1:]:
                if not row or all(cell is None or str(cell).strip() == "" for cell in row):
                    continue
                record = _build_record(row, mapping)
                if not _is_meaningful(record):
                    skipped += 1
                    continue
                record["program_type"] = _normalize_program_type(record.get("program_type"), sheet_type)
                records.append(record)
                imported += 1

            sheets.append({
                "name": sheet_name,
                "imported": imported,
                "skipped": skipped,
                "reason": None if imported else "داده‌ای یافت نشد",
            })
    finally:
        workbook.close()

    return {"records": records, "sheets": sheets}


def parse_excel(file_path: str) -> List[Dict[str, Any]]:
    """سازگاری با کد قبلی: فقط لیست رکوردها را برمی‌گرداند."""
    return parse_workbook(file_path)["records"]
