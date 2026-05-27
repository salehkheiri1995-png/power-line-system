import React, { useState, useRef } from 'react';

function ExcelUploader({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('⚠️ لطفاً فقط فایل Excel (xlsx, xls) انتخاب کنید');
      return;
    }
    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`upload-zone${dragging ? ' dragover' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="آپلود فایل Excel"
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
    >
      <span className="upload-icon">📊</span>
      <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
        فایل Excel خود را اینجا بکشید
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
        یا کلیک کنید تا فایل انتخاب کنید
      </p>
      <p style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)' }}>
        فرمت‌های پشتیبانی شده: xlsx, xls
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}

export default ExcelUploader;
