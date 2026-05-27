import React, { useRef, useState } from 'react';

function ExcelUploader({ onUpload }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onUpload(file);
    } else {
      alert('⚠️ لطفاً یک فایل اکسل معتبر انتخاب کنید');
    }
  };

  return (
    <div
      className={`upload-zone glass-card ${dragOver ? 'upload-zone-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current.click()}
      style={{
        transition: 'all 0.3s ease',
        transform: dragOver ? 'scale(1.02)' : 'scale(1)',
        borderColor: dragOver ? 'var(--accent-cyan)' : 'var(--border-glow)',
        boxShadow: dragOver ? '0 0 30px rgba(0, 240, 255, 0.6)' : '0 0 15px rgba(0, 240, 255, 0.15)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ذرات نورانی پس‌زمینه هنگام hover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 30% 50%, rgba(0,240,255,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="upload-icon" style={{ fontSize: '52px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.5))' }}>
          🛸
        </div>
        <h2 style={{ margin: '10px 0', fontWeight: '600', color: '#fff' }}>
          داده‌های خود را به کهکشان بفرستید
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: '8px 0' }}>
          فایل اکسل را اینجا رها کنید یا کلیک کنید
        </p>
        <div
          style={{
            marginTop: '15px',
            padding: '8px 24px',
            border: '1px solid var(--accent-cyan)',
            borderRadius: '30px',
            color: 'var(--accent-cyan)',
            display: 'inline-block',
            fontSize: '14px',
            backdropFilter: 'blur(4px)',
          }}
        >
          📂 انتخاب فایل
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={(e) => {
          if (e.target.files[0]) onUpload(e.target.files[0]);
        }}
      />
    </div>
  );
}

export default ExcelUploader;