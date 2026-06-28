import React, { useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import FilterPanel from './FilterPanel';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/* ─── پالت رنگی بر اساس تم گرم ─── */
const PALETTE = [
  '#01696f', '#3d95a3', '#0c4e54', '#7dc452',
  '#d4804a', '#b52a1e', '#1d6fa4', '#8a6200',
];

const PALETTE_BORDER = PALETTE.map(c => c + 'cc');

/* ─── helper: دریافت CSS variable ─── */
const v = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ─── آپشن‌های مشترک ─── */
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 14,
        boxWidth: 14,
        boxHeight: 14,
        font: { family: 'Vazirmatn', size: 12 },
        color: '#5e5c57',  /* --color-text-muted */
      },
    },
    tooltip: {
      rtl: true,
      backgroundColor: 'rgba(249,248,245,0.97)',
      titleColor: '#01696f',
      bodyColor: '#28251d',
      borderColor: '#d4d1ca',
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'Vazirmatn', weight: '700', size: 13 },
      bodyFont:  { family: 'Vazirmatn', size: 12 },
    },
  },
};

const pieOptions = {
  ...baseOptions,
  plugins: {
    ...baseOptions.plugins,
    legend: { ...baseOptions.plugins.legend, position: 'right' },
  },
};

const barOptions = {
  ...baseOptions,
  plugins: { ...baseOptions.plugins },
  scales: {
    x: {
      ticks: {
        color: '#5e5c57',
        font: { family: 'Vazirmatn', size: 11 },
        maxRotation: 35,
        autoSkip: true,
        maxTicksLimit: 12,
      },
      grid: { color: 'rgba(40,37,29,0.06)' },
      border: { color: '#dcd9d5' },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#5e5c57',
        font: { family: 'Vazirmatn', size: 11 },
        precision: 0,
      },
      grid: { color: 'rgba(40,37,29,0.06)' },
      border: { color: '#dcd9d5' },
    },
  },
};

/* ─── سازندگی دیتا ─── */
const makePieData = (records, field) => {
  const counts = {};
  records.forEach((r) => {
    const val = r[field] || 'نامشخص';
    counts[val] = (counts[val] || 0) + 1;
  });
  return {
    labels: Object.keys(counts),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: PALETTE,
      borderColor: PALETTE_BORDER,
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };
};

const makeBarData = (records, field) => {
  const counts = {};
  records.forEach((r) => {
    const val = r[field] || 'نامشخص';
    counts[val] = (counts[val] || 0) + 1;
  });
  const labels = Object.keys(counts);
  return {
    labels,
    datasets: [{
      label: 'تعداد',
      data: Object.values(counts),
      backgroundColor: PALETTE[0] + 'cc',
      borderColor: PALETTE[0],
      borderWidth: 1.5,
      borderRadius: 6,
      borderSkipped: false,
      hoverBackgroundColor: PALETTE[1] + 'cc',
    }],
  };
};

/* ─── کامپوننت ─── */
function Dashboard({ records, filterOptions }) {
  const [filtered, setFiltered] = useState(records);

  const handleFilter = (filters) => {
    let result = [...records];
    if (filters.program_type)              result = result.filter(r => r.program_type === filters.program_type);
    if (filters.code)                      result = result.filter(r => r.code === filters.code);
    if (filters.voltage_level)             result = result.filter(r => r.voltage_level === filters.voltage_level);
    if (filters.location)                  result = result.filter(r => r.location === filters.location);
    if (filters.supervisor)                result = result.filter(r => r.supervisor === filters.supervisor);
    if (filters.line_names?.length)        result = result.filter(r => filters.line_names.includes(r.line_name));
    if (filters.work_descriptions?.length) result = result.filter(r => filters.work_descriptions.includes(r.work_description));

    if (filters.dateFromYear || filters.dateFromMonth || filters.dateFromDay) {
      result = result.filter(r => {
        if (!r.execution_date) return false;
        const [y, m, d] = r.execution_date.split('/').map(Number);
        if (filters.dateFromYear  && y < +filters.dateFromYear)  return false;
        if (y === +filters.dateFromYear) {
          if (filters.dateFromMonth && m < +filters.dateFromMonth) return false;
          if (m === +filters.dateFromMonth && filters.dateFromDay && d < +filters.dateFromDay) return false;
        }
        return true;
      });
    }
    if (filters.dateToYear || filters.dateToMonth || filters.dateToDay) {
      result = result.filter(r => {
        if (!r.execution_date) return false;
        const [y, m, d] = r.execution_date.split('/').map(Number);
        if (filters.dateToYear  && y > +filters.dateToYear)  return false;
        if (y === +filters.dateToYear) {
          if (filters.dateToMonth && m > +filters.dateToMonth) return false;
          if (m === +filters.dateToMonth && filters.dateToDay && d > +filters.dateToDay) return false;
        }
        return true;
      });
    }
    setFiltered(result);
  };

  const handleClear = () => setFiltered(records);

  const total = filtered.length;

  return (
    <div className="db-root">
      {/* ─── فیلتر ─── */}
      <FilterPanel
        options={filterOptions}
        onFilter={handleFilter}
        onClear={handleClear}
        records={records}
      />

      {/* ─── KPI ─── */}
      <div className="db-kpi-row">
        <div className="db-kpi-card db-kpi-primary">
          <span className="db-kpi-icon">📄</span>
          <div>
            <div className="db-kpi-val">{total.toLocaleString('fa-IR')}</div>
            <div className="db-kpi-label">جمع کل رکورد</div>
          </div>
        </div>
        <div className="db-kpi-card db-kpi-info">
          <span className="db-kpi-icon">⚡</span>
          <div>
            <div className="db-kpi-val">
              {[...new Set(filtered.map(r => r.line_name).filter(Boolean))].length.toLocaleString('fa-IR')}
            </div>
            <div className="db-kpi-label">خطوط منحصربهفرد</div>
          </div>
        </div>
        <div className="db-kpi-card db-kpi-success">
          <span className="db-kpi-icon">📍</span>
          <div>
            <div className="db-kpi-val">
              {[...new Set(filtered.map(r => r.location).filter(Boolean))].length.toLocaleString('fa-IR')}
            </div>
            <div className="db-kpi-label">موقعیت منحصربهفرد</div>
          </div>
        </div>
        <div className="db-kpi-card db-kpi-warning">
          <span className="db-kpi-icon">👥</span>
          <div>
            <div className="db-kpi-val">
              {filtered.reduce((s, r) => s + (+r.personnel_count || 0), 0).toLocaleString('fa-IR')}
            </div>
            <div className="db-kpi-label">جمع نفرات</div>
          </div>
        </div>
      </div>

      {/* ─── نمودارها ─── */}
      {total > 0 ? (
        <div className="db-charts-grid">

          {/* ردیف اول: دو Pie کنار هم */}
          <div className="db-chart-card">
            <h4 className="db-chart-title">📋 توزیع نوع برنامه</h4>
            <div className="db-chart-wrap">
              <Pie data={makePieData(filtered, 'program_type')} options={pieOptions} />
            </div>
          </div>

          <div className="db-chart-card">
            <h4 className="db-chart-title">⚡ توزیع خطوط</h4>
            <div className="db-chart-wrap">
              <Pie data={makePieData(filtered, 'line_name')} options={pieOptions} />
            </div>
          </div>

          <div className="db-chart-card">
            <h4 className="db-chart-title">📍 توزیع موقعیت‌ها</h4>
            <div className="db-chart-wrap">
              <Pie data={makePieData(filtered, 'location')} options={pieOptions} />
            </div>
          </div>

          {/* ردیف دوم: دو Bar عریض */}
          <div className="db-chart-card db-chart-wide">
            <h4 className="db-chart-title">👥 تعداد اکیپ به تفکیک موقعیت</h4>
            <div className="db-chart-wrap db-chart-wrap-bar">
              <Bar data={makeBarData(filtered, 'team_count')} options={barOptions} />
            </div>
          </div>

          <div className="db-chart-card db-chart-wide">
            <h4 className="db-chart-title">👤 تعداد نفرات به تفکیک نوع برنامه</h4>
            <div className="db-chart-wrap db-chart-wrap-bar">
              <Bar data={makeBarData(filtered, 'personnel_count')} options={barOptions} />
            </div>
          </div>

        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p>داده‌ای با فیلترهای انتخاب‌شده یافت نشد</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
