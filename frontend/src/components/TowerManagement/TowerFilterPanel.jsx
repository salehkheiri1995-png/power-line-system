import React, { useState } from 'react';

function TowerFilterPanel({ lines, onFilter, compact = false }) {
  const [viewMode, setViewMode] = useState('all');
  const [programType, setProgramType] = useState('');
  const [lineName, setLineName] = useState('');
  const [voltage, setVoltage] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const apply = () => {
    onFilter({
      viewMode,
      programType,
      lineName,
      voltage,
      location,
      dateFrom,
      dateTo,
    });
  };

  const reset = () => {
    setViewMode('all');
    setProgramType('');
    setLineName('');
    setVoltage('');
    setLocation('');
    setDateFrom('');
    setDateTo('');

    onFilter({
      viewMode: 'all',
      programType: '',
      lineName: '',
      voltage: '',
      location: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const voltages = [...new Set(lines.map((l) => l.voltage).filter(Boolean))].sort((a, b) => a - b);

  return (
    <div className={`tm-filter-card ${compact ? 'compact' : ''}`}>
      <div className="tm-filter-head">
        <h4 className="tm-filter-title">🔎 فیلترها</h4>
        <div className="tm-filter-actions">
          <button type="button" className="btn-glow btn-sm" onClick={apply}>
            اعمال
          </button>
          <button type="button" className="btn-ghost tm-filter-reset" onClick={reset}>
            پاک کردن
          </button>
        </div>
      </div>

      <div className={`tm-filter-grid ${compact ? 'compact' : ''}`}>
        <div className="form-group">
          <label className="field-label">حالت نمایش</label>
          <select
            className="input-field"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="all">همه موارد</option>
            <option value="completed">فقط انجام‌شده‌ها</option>
            <option value="planned">فقط برنامه‌ریزی‌ها</option>
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">نوع برنامه</label>
          <select
            className="input-field"
            value={programType}
            onChange={(e) => setProgramType(e.target.value)}
          >
            <option value="">همه</option>
            <option value="سرد">سرد</option>
            <option value="گرم">گرم</option>
            <option value="برنامه‌ریزی">برنامه‌ریزی</option>
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">نام خط</label>
          <select
            className="input-field"
            value={lineName}
            onChange={(e) => setLineName(e.target.value)}
          >
            <option value="">همه</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">سطح ولتاژ</label>
          <select
            className="input-field"
            value={voltage}
            onChange={(e) => setVoltage(e.target.value)}
          >
            <option value="">همه</option>
            {voltages.map((v) => (
              <option key={v} value={v}>
                {v} kV
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">موقعیت</label>
          <select
            className="input-field"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">همه</option>
            <option value="دشت">دشت</option>
            <option value="کوهستان">کوهستان</option>
            <option value="شهری">شهری</option>
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">از تاریخ (شمسی)</label>
          <input
            className="input-field"
            placeholder="1404/01/01"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="field-label">تا تاریخ (شمسی)</label>
          <input
            className="input-field"
            placeholder="1404/12/29"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default TowerFilterPanel;