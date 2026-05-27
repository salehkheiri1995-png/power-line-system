import React, { useState } from 'react';
import { updateRecord } from '../api';

function EditModal({ record, onClose, onSaved }) {
  const [form, setForm]     = useState({ ...record });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fields = Object.keys(record).filter(k => k !== 'id');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { id, ...data } = form;
      await updateRecord(record.id, data);
      onSaved();
      onClose();
    } catch (err) {
      setError('خطا در ذخیره تغییرات. لطفاً دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">✏️ ویرایش رکورد #{record.id}</h2>
          <button className="modal-close" onClick={onClose} aria-label="بستن">✕</button>
        </div>

        {error && <div className="message error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <form onSubmit={e => e.preventDefault()}>
          <div className="form-grid">
            {fields.map(key => (
              <div key={key} className="form-group">
                <label className="field-label" htmlFor={`edit-${key}`}>{key}</label>
                <input
                  id={`edit-${key}`}
                  name={key}
                  className="input-field"
                  value={form[key] || ''}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>انصراف</button>
            <button
              type="button"
              className="btn-glow"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '⏳ در حال ذخیره...' : '💾 ذخیره تغییرات'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default EditModal;
