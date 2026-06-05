import React, { useEffect, useState } from 'react';
import {
  getGridLines,
  createGridLine,
  updateGridLine,
  deleteGridLine,
  getGridTowers,
  getInspections,
} from '../api';

const emptyLine = {
  id: '',
  name: '',
  voltage: 0,
  status: 'active',
  line_code: '',
  line_name: '',
  voltage_level: null,
  current_type: 'AC',
  total_length_km: null,
  line_type: 'Overhead',
  number_of_circuits: 1,
  source_substation: '',
  destination_substation: '',
  commissioning_date: '',
  line_status: 'InService',
  max_transfer_mw: null,
  rated_current_a: null,
};

export default function GridManagement() {
  const [lines, setLines] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState('');
  const [towers, setTowers] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [form, setForm] = useState(emptyLine);
  const [editingId, setEditingId] = useState(null);
  const [warning, setWarning] = useState('');

  const loadLines = async () => {
    const res = await getGridLines();
    setLines(res.data || []);
  };

  const loadTowers = async (lineId) => {
    if (!lineId) {
      setTowers([]);
      return;
    }
    const res = await getGridTowers(lineId);
    setTowers(res.data || []);
  };

  const loadInspections = async (lineId) => {
    if (!lineId) {
      setInspections([]);
      return;
    }
    const res = await getInspections(lineId, '');
    setInspections(res.data || []);
  };

  useEffect(() => {
    loadLines();
  }, []);

  useEffect(() => {
    loadTowers(selectedLineId);
    loadInspections(selectedLineId);
  }, [selectedLineId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateGridLine(editingId, form);
      } else {
        await createGridLine(form);
      }
      setForm(emptyLine);
      setEditingId(null);
      await loadLines();
    } catch (err) {
      setWarning(err.response?.data?.detail || 'خطا در ذخیره خط');
    }
  };

  const handleEdit = (line) => {
    setEditingId(line.id);
    setForm({ ...emptyLine, ...line });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف خط؟')) return;
    await deleteGridLine(id);
    await loadLines();
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">مدیریت ساختار شبکه (خط / دکل / بازرسی)</h3>

      {warning && (
        <div className="alert alert-warning" dir="rtl">
          {warning}
        </div>
      )}

      <div className="row">
        <div className="col-md-4">
          <h5>لیست خطوط</h5>
          <ul className="list-group mb-3" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {lines.map((l) => (
              <li
                key={l.id}
                className={`list-group-item d-flex justify-content-between align-items-center ${
                  selectedLineId === l.id ? 'active text-white' : ''
                }`}
                onClick={() => setSelectedLineId(l.id)}
                style={{ cursor: 'pointer' }}
              >
                <span>
                  {l.id} ({l.voltage_level || l.voltage} kV)
                </span>
                <span>
                  <button
                    className="btn btn-sm btn-light me-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(l);
                    }}
                  >
                    ویرایش
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(l.id);
                    }}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <h5 className="mt-3">فرم خط</h5>
          <form onSubmit={handleSubmit} dir="rtl">
            <div className="mb-2">
              <label className="form-label">شناسه (ID)</label>
              <input
                className="form-control"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                required
                disabled={!!editingId}
              />
            </div>
            <div className="mb-2">
              <label className="form-label">نام خط</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-2">
              <label className="form-label">سطح ولتاژ (kV)</label>
              <input
                type="number"
                className="form-control"
                value={form.voltage_level || ''}
                onChange={(e) =>
                  setForm({ ...form, voltage_level: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div className="mb-2">
              <label className="form-label">نوع خط</label>
              <select
                className="form-select"
                value={form.line_type}
                onChange={(e) => setForm({ ...form, line_type: e.target.value })}
              >
                <option value="Overhead">هوایی</option>
                <option value="Cable">زمینی / کابل</option>
              </select>
            </div>
            <button className="btn btn-primary w-100 mt-2" type="submit">
              {editingId ? 'ذخیره تغییرات' : 'ایجاد خط جدید'}
            </button>
          </form>
        </div>

        <div className="col-md-4">
          <h5>دکل‌های خط انتخاب‌شده</h5>
          {!selectedLineId && <div className="text-muted">ابتدا یک خط را انتخاب کنید.</div>}
          {selectedLineId && (
            <ul className="list-group" style={{ maxHeight: 350, overflowY: 'auto' }}>
              {towers.map((t) => (
                <li key={t.id} className="list-group-item d-flex justify-content-between">
                  <span>
                    دکل {t.number} - نوع: {t.tower_type || t.type}
                  </span>
                  {t.last_inspection_date && (
                    <span className="badge bg-success">بازرسی: {t.last_inspection_date}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-md-4">
          <h5>بازرسی‌های خط انتخاب‌شده</h5>
          {!selectedLineId && <div className="text-muted">ابتدا یک خط را انتخاب کنید.</div>}
          {selectedLineId && (
            <ul className="list-group" style={{ maxHeight: 350, overflowY: 'auto' }}>
              {inspections.map((i) => (
                <li key={i.id} className="list-group-item">
                  <div>تاریخ: {i.inspection_date}</div>
                  <div>نوع: {i.inspection_type}</div>
                  <div>بازرس: {i.inspector_name}</div>
                  {i.defects_found && <div className="text-danger">عیوب: {i.defects_found}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
