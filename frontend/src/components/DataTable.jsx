import React, { useState, useMemo } from 'react';
import { deleteRecord } from '../api';
import EditModal from './EditModal';
import * as XLSX from 'xlsx';

// نگاشت انگلیسی به فارسی
const PERSIAN_HEADERS = {
  code: 'کد',
  line_name: 'نام خط',
  voltage_level: 'سطح ولتاژ',
  program_type: 'نوع برنامه',
  work_description: 'شرح انجام کار',
  tower_number: 'شماره دکل',
  location: 'موقعیت',
  pm_date: 'تاریخ pm',
  execution_date: 'تاریخ انجام',
  team_count: 'تعداد اکیپ',
  personnel_count: 'تعداد نفرات',
  supervisor: 'نام سرپرست اکیپ',
  quantity: 'مقدار',
  unit: 'واحد',
  title_of_work: 'عنوان کار',
};

// ترتیب و عرض دلخواه ستون‌ها
const COLUMNS_CONFIG = [
  { key: 'code', width: '70px' },
  { key: 'line_name', width: '120px' },
  { key: 'voltage_level', width: '90px' },
  { key: 'program_type', width: '80px' },
  { key: 'work_description', width: '180px' },
  { key: 'tower_number', width: '110px' },
  { key: 'location', width: '90px' },
  { key: 'execution_date', width: '100px' },
  { key: 'pm_date', width: '100px' },
  { key: 'team_count', width: '80px' },
  { key: 'personnel_count', width: '80px' },
  { key: 'supervisor', width: '110px' },
  { key: 'quantity', width: '70px' },
  { key: 'unit', width: '60px' },
];

function DataTable({ records, onDataChange }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editingRecord, setEditingRecord] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const pageSize = 25;

  const role = localStorage.getItem('role') || 'user';
  const isAdmin = role === 'admin';

  // ستون‌های موجود در داده‌ها
  const availableColumns = useMemo(() => {
    if (records.length === 0) return [];
    const keys = Object.keys(records[0]).filter(k => k !== 'id' && k !== 'tower_number2' && k !== 'extra_tower_number');
    return COLUMNS_CONFIG.filter(c => keys.includes(c.key));
  }, [records]);

  // ترکیب شماره دکل‌ها
  const getTowerDisplay = (row) => {
    const parts = [row.tower_number, row.tower_number2, row.extra_tower_number].filter(Boolean);
    return parts.join(' / ') || '';
  };

  // جستجو
  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const s = search.toLowerCase();
    return records.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(s))
    );
  }, [records, search]);

  // مرتب‌سازی
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const sortedData = [...filtered].sort((a, b) => {
      let aVal = sortKey === 'tower_number' ? getTowerDisplay(a) : a[sortKey];
      let bVal = sortKey === 'tower_number' ? getTowerDisplay(b) : b[sortKey];
      aVal = aVal ?? '';
      bVal = bVal ?? '';
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal), 'fa', { sensitivity: 'base' })
        : String(bVal).localeCompare(String(aVal), 'fa', { sensitivity: 'base' });
    });
    return sortedData;
  }, [filtered, sortKey, sortDir]);

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return alert('⛔ فقط مدیران مجاز به حذف رکورد هستند');
    if (window.confirm('آیا از حذف این رکورد مطمئن هستید؟')) {
      await deleteRecord(id);
      onDataChange();
    }
  };

  const exportToExcel = () => {
    if (sorted.length === 0) return alert('داده‌ای برای خروجی وجود ندارد');
    const data = sorted.map(row => {
      const newRow = {};
      availableColumns.forEach(c => {
        newRow[PERSIAN_HEADERS[c.key] || c.key] = c.key === 'tower_number' ? getTowerDisplay(row) : row[c.key];
      });
      return newRow;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'داده‌ها');
    XLSX.writeFile(wb, `filtered_data_${new Date().toLocaleDateString('fa-IR')}.xlsx`);
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▴' : ' ▾';
  };

  if (records.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>🪐 هیچ رکوردی برای نمایش وجود ندارد</div>
      </div>
    );
  }

  return (
    <div>
      {/* نوار جستجو */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', fontSize: '1.2rem', pointerEvents: 'none' }}>🔍</span>
            <input
              placeholder="جستجو در همه فیلدها..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{
                width: '100%', background: 'rgba(10,15,25,0.8)', border: '1px solid rgba(0,240,255,0.3)',
                borderRadius: '25px', padding: '10px 40px 10px 16px', color: '#e0f0ff',
                fontSize: '0.95rem', outline: 'none', backdropFilter: 'blur(4px)', transition: '0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#00f0ff'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,240,255,0.3)'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{sorted.length} رکورد</span>
            <button onClick={exportToExcel} className="btn-glow" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              📥 خروجی Excel
            </button>
          </div>
        </div>
      </div>

      {/* جدول */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="space-table" style={{ width: '100%', minWidth: '800px' }}>
          <thead>
            <tr>
              {availableColumns.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)}
                  style={{
                    cursor: 'pointer', userSelect: 'none', padding: '12px 6px', whiteSpace: 'nowrap',
                    width: col.width, fontSize: '0.82rem', color: sortKey === col.key ? '#00f0ff' : undefined,
                    position: 'sticky', top: 0, background: 'rgba(10,15,25,0.95)', zIndex: 1,
                  }}
                  title={`مرتب‌سازی بر اساس ${PERSIAN_HEADERS[col.key] || col.key}`}
                >
                  {PERSIAN_HEADERS[col.key] || col.key}{getSortIcon(col.key)}
                </th>
              ))}
              <th style={{ width: '90px', textAlign: 'center', padding: '12px 6px', fontSize: '0.82rem', position: 'sticky', top: 0, background: 'rgba(10,15,25,0.95)', zIndex: 1 }}>
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(row => (
              <tr key={row.id}>
                {availableColumns.map(col => (
                  <td key={col.key} style={{
                    padding: '6px 4px', fontSize: '0.8rem', maxWidth: col.width,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: col.key === 'work_description' ? 'normal' : 'nowrap',
                  }}>
                    {col.key === 'tower_number' ? getTowerDisplay(row) : (row[col.key] ?? '')}
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    {isAdmin ? (
                      <>
                        <button className="btn-glow" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'linear-gradient(135deg, #ffaa00, #ff6600)' }}
                          onClick={() => setEditingRecord(row)} title="ویرایش">✏️</button>
                        <button style={{ background: 'rgba(255,77,77,0.15)', border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => handleDelete(row.id)} title="حذف"
                          onMouseOver={e => e.target.style.background = 'rgba(255,77,77,0.3)'}
                          onMouseOut={e => e.target.style.background = 'rgba(255,77,77,0.15)'}>🗑️</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>بدون دسترسی</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* صفحه‌بندی */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
          style={{ background: page === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: page === 0 ? '#555' : '#00f0ff', borderRadius: '20px', padding: '8px 20px', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
        >قبلی</button>
        <span style={{ color: 'var(--text-secondary)' }}>صفحه {page + 1} از {totalPages || 1}</span>
        <button disabled={(page + 1) * pageSize >= sorted.length} onClick={() => setPage(p => p + 1)}
          style={{ background: (page + 1) * pageSize >= sorted.length ? 'rgba(255,255,255,0.05)' : 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: (page + 1) * pageSize >= sorted.length ? '#555' : '#00f0ff', borderRadius: '20px', padding: '8px 20px', cursor: (page + 1) * pageSize >= sorted.length ? 'not-allowed' : 'pointer' }}
        >بعدی</button>
      </div>

      {editingRecord && <EditModal record={editingRecord} onClose={() => setEditingRecord(null)} onSaved={onDataChange} />}
    </div>
  );
}

export default DataTable;