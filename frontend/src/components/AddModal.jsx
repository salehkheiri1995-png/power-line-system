import React, { useState } from 'react';
import { createRecord } from '../api';

function AddModal({ onClose, onSaved, fields }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await createRecord(form);
      onSaved();
      onClose();
    } catch (err) {
      alert('خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div onClick={e => e.stopPropagation()} className="glass-card" style={{
        width: '90%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto',
        padding: '30px', borderRadius: '16px', border: '1px solid rgba(0,240,255,0.3)',
        boxShadow: '0 0 40px rgba(0,240,255,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--accent-cyan)' }}>➕ افزودن رکورد جدید</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {fields.map(key => (
            <div key={key}>
              <label style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{key}</label>
              <input
                name={key}
                value={form[key] || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(10,15,25,0.8)',
                  border: '1px solid rgba(0,240,255,0.3)',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#e0f0ff',
                  marginTop: '5px'
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            color: '#e0f0ff', borderRadius: '20px', padding: '10px 24px', cursor: 'pointer'
          }}>انصراف</button>
          <button className="btn-glow" onClick={handleSave} disabled={saving}>
            {saving ? '⏳' : '💾'} ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddModal;