import React, { useState, useMemo } from 'react';
import { deleteRecord } from '../api';
import EditModal from './EditModal';
import * as XLSX from 'xlsx';

const PERSIAN_HEADERS = {
  code:             'کد',
  line_name:        'نام خط',
  voltage_level:    'سطح ولتاژ',
  program_type:     'نوع برنامه',
  work_description: 'شرح انجام کار',
  tower_number:     'شماره دکل',
  location:         'موقعیت',
  pm_date:          'تاریخ PM',
  execution_date:   'تاریخ انجام',
  team_count:       'تعداد اکیپ',
  personnel_count:  'تعداد نفرات',
  supervisor:       'سرپرست اکیپ',
  quantity:         'مقدار',
  unit:             'واحد',
  title_of_work:    'عنوان کار',
};

const COLUMNS_CONFIG = [
  { key: 'code',             width: '70px'  },
  { key: 'line_name',        width: '130px' },
  { key: 'voltage_level',    width: '95px'  },
  { key: 'program_type',     width: '90px'  },
  { key: 'work_description', width: '190px' },
  { key: 'tower_number',     width: '115px' },
  { key: 'location',         width: '95px'  },
  { key: 'execution_date',   width: '105px' },
  { key: 'pm_date',          width: '105px' },
  { key: 'team_count',       width: '85px'  },
  { key: 'personnel_count',  width: '85px'  },
  { key: 'supervisor',       width: '120px' },
  { key: 'quantity',         width: '70px'  },
  { key: 'unit',             width: '65px'  },
];

function DataTable({ records, onDataChange }) {
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(0);
  const [editingRecord, setEditingRecord] = useState(null);
  const [sortKey, setSortKey]           = useState(null);
  const [sortDir, setSortDir]           = useState('asc');
  const pageSize = 25;

  const role    = localStorage.getItem('role') || 'user';
  const isAdmin = role === 'admin';

  const availableColumns = useMemo(() => {
    if (records.length === 0) return [];
    const keys = Object.keys(records[0]).filter(
      k => k !== 'id' && k !== 'tower_number2' && k !== 'extra_tower_number'
    );
    return COLUMNS_CONFIG.filter(c => keys.includes(c.key));
  }, [records]);

  const getTowerDisplay = (row) =>
    [row.tower_number, row.tower_number2, row.extra_tower_number]
      .filter(Boolean).join(' / ') || '';

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const s = search.toLowerCase();
    return records.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(s))
    );
  }, [records, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal = sortKey === 'tower_number' ? getTowerDisplay(a) : a[sortKey];
      let bVal = sortKey === 'tower_number' ? getTowerDisplay(b) : b[sortKey];
      aVal = aVal ?? '';
      bVal = bVal ?? '';
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum))
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal), 'fa', { sensitivity: 'base' })
        : String(bVal).localeCompare(String(aVal), 'fa', { sensitivity: 'base' });
    });
  }, [filtered, sortKey, sortDir]);

  const paginated   = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages  = Math.ceil(sorted.length / pageSize);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
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
        newRow[PERSIAN_HEADERS[c.key] || c.key] =
          c.key === 'tower_number' ? getTowerDisplay(row) : row[c.key];
      });
      return newRow;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'داده‌ها');
    XLSX.writeFile(wb, `data_${new Date().toLocaleDateString('fa-IR')}.xlsx`);
  };

  if (records.length === 0) {
    return (
      <div className="glass-card">
        <div className="empty-state">
          <span className="empty-state-icon">🪐</span>
          <p>هیچ رکوردی برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* نوار ابزار */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <span style={{
              position: 'absolute', right: '13px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--accent-cyan)',
              fontSize: '1rem', pointerEvents: 'none'
            }}>🔍</span>
            <input
              className="input-field"
              placeholder="جستجو در همه فیلدها..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ borderRadius: 'var(--radius-pill)', paddingRight: '38px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {sorted.length} رکورد
            </span>
            <button className="btn-export" onClick={exportToExcel}>📥 خروجی Excel</button>
          </div>
        </div>
      </div>

      {/* جدول */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="space-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              {availableColumns.map(col => (
                <th
                  key={col.key}
                  className={`sortable${sortKey === col.key ? ' sort-active' : ''}`}
                  onClick={() => handleSort(col.key)}
                  style={{ width: col.width }}
                  title={`مرتب‌سازی بر اساس ${PERSIAN_HEADERS[col.key] || col.key}`}
                >
                  {PERSIAN_HEADERS[col.key] || col.key}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ▴' : ' ▾') : ''}
                </th>
              ))}
              <th style={{ width: '95px', textAlign: 'center' }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(row => (
              <tr key={row.id}>
                {availableColumns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      maxWidth: col.width,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: col.key === 'work_description' ? 'normal' : 'nowrap',
                    }}
                  >
                    {col.key === 'tower_number' ? getTowerDisplay(row) : (row[col.key] ?? '')}
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-1)' }}>
                    {isAdmin ? (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => setEditingRecord(row)}
                          title="ویرایش"
                        >✏️</button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(row.id)}
                          title="حذف"
                        >🗑️</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)' }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* صفحه‌بندی */}
      <div className="pagination">
        <button
          className="pagination-btn"
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
        >قبلی</button>
        <span className="pagination-info">صفحه {page + 1} از {totalPages || 1}</span>
        <button
          className="pagination-btn"
          disabled={(page + 1) * pageSize >= sorted.length}
          onClick={() => setPage(p => p + 1)}
        >بعدی</button>
      </div>

      {editingRecord && (
        <EditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => { setEditingRecord(null); onDataChange(); }}
        />
      )}
    </div>
  );
}

export default DataTable;
