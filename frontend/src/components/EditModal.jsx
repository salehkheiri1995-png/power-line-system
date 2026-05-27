import React, { useState } from 'react';
import { updateRecord } from '../api';

function EditModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({ ...record });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, ...data } = form;
      await updateRecord(record.id, data);
      onSaved();
      onClose();
    } catch (err) {
      alert('خطا در ذخیره تغییرات');
    } finally {
      setSaving(false);
    }
  };

  const fields = Object.keys(record).filter(k => k !== 'id');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '90%',
          maxWidth: '700px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)',
          animation: 'scaleIn 0.25s ease',
        }}
      >
        {/* هدر مدال */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '15px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #00f0ff, #b366ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ✏️ ویرایش رکورد #{record.id}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ff4d4d',
              fontSize: '1.8rem',
              cursor: 'pointer',
              lineHeight: 1,
              transition: '0.2s',
            }}
            title="بستن"
          >
            ✕
          </button>
        </div>

        {/* بدنه فرم */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
            }}
          >
            {fields.map((key) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  style={{
                    color: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    textShadow: '0 0 5px rgba(0,240,255,0.3)',
                  }}
                >
                  {key}
                </label>
                <input
                  name={key}
                  value={form[key] || ''}
                  onChange={handleChange}
                  style={{
                    background: 'rgba(10, 15, 25, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#e0f0ff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00f0ff')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)')}
                />
              </div>
            ))}
          </div>

          {/* فوتر دکمه‌ها */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '30px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '20px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#e0f0ff',
                borderRadius: '25px',
                padding: '10px 28px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                backdropFilter: 'blur(4px)',
                transition: '0.2s',
              }}
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-glow"
              style={{
                padding: '10px 32px',
                fontSize: '0.95rem',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? '⏳ در حال ذخیره...' : '💾 ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>

      {/* کی‌فریم‌های انیمیشن */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default EditModal;