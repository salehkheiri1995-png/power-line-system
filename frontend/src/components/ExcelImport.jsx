import React, { useRef, useState } from 'react';
import api, { uploadExcel } from '../api';
import './ExcelImport.css';

const MAX_SIZE_MB = 25;

const COLUMN_HINTS = [
  ['نوع برنامه', 'سرد / گرم'],
  ['کد', 'اختیاری'],
  ['نام خط', 'الزامی'],
  ['سطح ولتاژ', 'مثلاً 63 / 230'],
  ['شرح انجام کار', 'الزامی'],
  ['شماره دکل', 'الزامی'],
  ['موقعیت', 'دشت / کوهستان'],
  ['تاریخ انجام', 'شمسی یا میلادی'],
  ['تعداد اکیپ', 'عدد'],
  ['تعداد نفرات', 'عدد'],
  ['نام سرپرست اکیپ', 'متن'],
  ['مقدار / واحد', 'عدد و متن'],
  ['شماره دکل ۲', 'اختیاری'],
  ['عنوان کار', 'اختیاری'],
];

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
}

function errorText(err) {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || 'خطای ناشناخته';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join(' | ');
  return JSON.stringify(detail);
}

function ExcelImport({ onDone }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState('append');
  const [syncLines, setSyncLines] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRef = useRef();

  const selectFile = (picked) => {
    if (!picked) return;
    if (!/\.(xlsx|xlsm)$/i.test(picked.name)) {
      setMessage({ type: 'error', text: '❌ فقط فایل اکسل با پسوند xlsx پذیرفته می‌شود (فایل‌های xls قدیمی را با اکسل به xlsx تبدیل کنید).' });
      return;
    }
    if (picked.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage({ type: 'error', text: `❌ حجم فایل بیشتر از ${MAX_SIZE_MB} مگابایت است.` });
      return;
    }
    setMessage(null);
    setFile(picked);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file || busy) return;
    setBusy(true);
    setMessage({ type: 'info', text: '⏳ در حال خواندن فایل و ذخیره در دیتابیس...' });
    try {
      const res = await uploadExcel(file, mode);
      const data = res.data || {};
      const sheetInfo = (data.sheets || [])
        .filter(s => s.imported > 0)
        .map(s => `«${s.name}»: ${s.imported} رکورد`)
        .join(' — ');

      let syncInfo = '';
      if (syncLines) {
        try {
          const syncRes = await api.post('/lines-towers/import-from-records');
          const sync = syncRes.data || {};
          syncInfo = `\n🔄 ${sync.message || 'خطوط و دکل‌ها ساخته شدند'} — ${sync.lines ?? 0} خط، ${sync.towers ?? 0} دکل`;
        } catch (syncErr) {
          syncInfo = `\n⚠️ رکوردها ذخیره شدند اما ساخت خطوط/دکل‌ها ناموفق بود: ${errorText(syncErr)}`;
        }
      }

      setMessage({
        type: 'success',
        text: `✅ ${data.message || 'ورود داده‌ها انجام شد'}${data.total != null ? ` — مجموع رکوردهای سیستم: ${data.total}` : ''}${sheetInfo ? `\n${sheetInfo}` : ''}${syncInfo}`,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      if (onDone) await onDone();
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${errorText(err)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="xls-root">
      <div className="xls-header">
        <div className="xls-header-icon">📥</div>
        <div>
          <h2 className="xls-header-title">ورود داده‌ها از فایل اکسل</h2>
          <p className="xls-header-sub">
            فایل‌های xlsx با ساختار جدول تعمیرات خطوط برق به‌صورت خودکار تشخیص داده می‌شوند
          </p>
        </div>
      </div>

      {message && (
        <div className={`xls-alert xls-alert--${message.type}`}>
          <span style={{ whiteSpace: 'pre-line' }}>{message.text}</span>
          <button className="xls-alert-close" onClick={() => setMessage(null)} aria-label="بستن">×</button>
        </div>
      )}

      <div className="xls-body">
        {!file ? (
          <div
            className={`xls-drop${dragging ? ' xls-drop--over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          >
            <span className="xls-drop-icon">📊</span>
            <p className="xls-drop-title">فایل اکسل را اینجا رها کنید</p>
            <p className="xls-drop-sub">یا کلیک کنید و فایل را انتخاب کنید</p>
            <span className="xls-drop-badge">xlsx / xlsm — حداکثر {MAX_SIZE_MB} مگابایت</span>
          </div>
        ) : (
          <div className="xls-file">
            <span className="xls-file-icon">📄</span>
            <div className="xls-file-info">
              <div className="xls-file-name" title={file.name}>{file.name}</div>
              <div className="xls-file-size">{humanSize(file.size)}</div>
            </div>
            <button
              type="button"
              className="xls-btn xls-btn--ghost"
              disabled={busy}
              onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
            >
              تغییر فایل
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm"
          style={{ display: 'none' }}
          onChange={e => selectFile(e.target.files?.[0])}
        />

        <div className="xls-section-title">نحوه‌ی ورود داده‌ها</div>
        <div className="xls-modes">
          <label className={`xls-mode${mode === 'append' ? ' xls-mode--active' : ''}`}>
            <input
              type="radio"
              name="import-mode"
              value="append"
              checked={mode === 'append'}
              onChange={() => setMode('append')}
              disabled={busy}
            />
            <div>
              <div className="xls-mode-title">➕ افزودن به داده‌های موجود</div>
              <div className="xls-mode-desc">رکوردهای جدید کنار داده‌های فعلی ذخیره می‌شوند.</div>
            </div>
          </label>

          <label className={`xls-mode xls-mode--danger${mode === 'replace' ? ' xls-mode--active' : ''}`}>
            <input
              type="radio"
              name="import-mode"
              value="replace"
              checked={mode === 'replace'}
              onChange={() => setMode('replace')}
              disabled={busy}
            />
            <div>
              <div className="xls-mode-title">♻️ جایگزینی کامل داده‌ها</div>
              <div className="xls-mode-desc">ابتدا همه‌ی رکوردهای قبلی حذف و سپس فایل جدید وارد می‌شود.</div>
            </div>
          </label>
        </div>

        {mode === 'replace' && (
          <div className="xls-warning">
            ⚠️ در این حالت تمام رکوردهای فعلی حذف می‌شوند. این کار قابل بازگشت نیست.
          </div>
        )}

        <label className="xls-check">
          <input
            type="checkbox"
            checked={syncLines}
            onChange={e => setSyncLines(e.target.checked)}
            disabled={busy}
          />
          <span>
            🔄 ساخت خطوط، دکل‌ها و سوابق تعمیر از داده‌های واردشده
            <small className="xls-check-hint">برای اینکه در بخش «مدیریت خطوط» و «ساختار شبکه» هم دیده شوند</small>
          </span>
        </label>

        <div className="xls-actions">
          <button
            type="button"
            className="xls-btn xls-btn--primary"
            onClick={handleSubmit}
            disabled={!file || busy}
          >
            {busy ? <><span className="xls-spinner" /> در حال ورود داده‌ها...</> : '📥 شروع ورود داده‌ها'}
          </button>
        </div>

        <details className="xls-guide">
          <summary>راهنمای ستون‌های قابل شناسایی</summary>
          <p className="xls-guide-note">
            سطر عنوان ستون‌ها می‌تواند در پانزده سطر اول فایل باشد. شیت‌های اطلاعاتی (مثل «اطلاعات فیلتر»)
            نادیده گرفته می‌شوند. تاریخ‌های میلادی به‌صورت خودکار به شمسی تبدیل می‌شوند.
          </p>
          <div className="xls-guide-grid">
            {COLUMN_HINTS.map(([name, note]) => (
              <div className="xls-guide-item" key={name}>
                <span className="xls-guide-name">{name}</span>
                <span className="xls-guide-note">{note}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

export default ExcelImport;
