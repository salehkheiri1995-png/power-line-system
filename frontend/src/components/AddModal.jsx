import React, { useState } from 'react';
import { createRecord } from '../api';

function AddModal({ onClose, onSaved, fields }) {
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await createRecord(form);
      onSaved();
      onClose();
    } catch (err) {
      setError('خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">➕ افزودن رکورد جدید</h2>
          <button className="modal-close" onClick={onClose} aria-label="بستن">✕</button>
        </div>

        {error && <div className="message error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <div className="form-grid">
          {fields.map(key => (
            <div key={key} className="form-group">
              <label className="field-label">{key}</label>
              <input
                name={key}
                className="input-field"
                value={form[key] || ''}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>انصراف</button>
          <button className="btn-glow" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ در حال ذخیره...' : '💾 ذخیره'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddModal;
