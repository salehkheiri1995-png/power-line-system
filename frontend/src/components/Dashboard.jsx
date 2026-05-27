import React, { useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import FilterPanel from './FilterPanel';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// رنگ‌های نئونی برای نمودارها
const NEON_COLORS = [
  '#00f0ff', // فیروزه‌ای نئون
  '#b366ff', // بنفش
  '#ff4d94', // صورتی
  '#ffaa00', // نارنجی
  '#00e676', // سبز نئون
  '#ff4081', // سرخابی
  '#69f0ae', // سبز روشن
  '#40c4ff', // آبی آسمانی
];

function Dashboard({ records, filterOptions }) {
  const [filtered, setFiltered] = useState(records);

  // اعمال فیلترها (همان منطق قبلی)
  const handleFilter = (filters) => {
    let result = [...records];

    if (filters.program_type) result = result.filter(r => r.program_type === filters.program_type);
    if (filters.code) result = result.filter(r => r.code === filters.code);
    if (filters.voltage_level) result = result.filter(r => r.voltage_level === filters.voltage_level);
    if (filters.location) result = result.filter(r => r.location === filters.location);
    if (filters.supervisor) result = result.filter(r => r.supervisor === filters.supervisor);
    if (filters.line_names?.length) result = result.filter(r => filters.line_names.includes(r.line_name));
    if (filters.work_descriptions?.length) result = result.filter(r => filters.work_descriptions.includes(r.work_description));

    // فیلتر تاریخ (شمسی)
    if (filters.dateFromYear || filters.dateFromMonth || filters.dateFromDay) {
      result = result.filter(r => {
        if (!r.execution_date) return false;
        const [y, m, d] = r.execution_date.split('/').map(Number);
        if (filters.dateFromYear && y < +filters.dateFromYear) return false;
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
        if (filters.dateToYear && y > +filters.dateToYear) return false;
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

  // آماده‌سازی داده‌های نمودار دایره‌ای
  const pieData = (field) => {
    const counts = {};
    filtered.forEach(r => {
      const val = r[field] || 'نامشخص';
      counts[val] = (counts[val] || 0) + 1;
    });
    return {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: NEON_COLORS,
        borderColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
      }]
    };
  };

  // آماده‌سازی داده‌های نمودار میله‌ای
  const barData = (field) => {
    const counts = {};
    filtered.forEach(r => {
      const val = r[field] || 'نامشخص';
      counts[val] = (counts[val] || 0) + 1;
    });
    return {
      labels: Object.keys(counts),
      datasets: [{
        label: 'تعداد',
        data: Object.values(counts),
        backgroundColor: '#00f0ff',
        borderRadius: 5,
      }]
    };
  };

  // تنظیمات مشترک نمودارها برای تم تیره
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e0f0ff',
          padding: 12,
          font: { family: 'Vazirmatn', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 20, 30, 0.9)',
        titleColor: '#00f0ff',
        bodyColor: '#e0f0ff',
        borderColor: '#00f0ff',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#8892b0' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#8892b0' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  return (
    <div>
      <FilterPanel
        options={filterOptions}
        onFilter={handleFilter}
        onClear={handleClear}
        records={records}
      />

      {/* شبکه نمودارها با CSS Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {/* نمودار دایره‌ای: نوع برنامه */}
        <div className="glass-card" style={{ padding: '20px', minHeight: '350px' }}>
          <h4 className="chart-title">🌌 توزیع نوع برنامه</h4>
          <div style={{ height: '280px' }}>
            <Pie data={pieData('program_type')} options={chartOptions} />
          </div>
        </div>

        {/* نمودار دایره‌ای: نام خطوط */}
        <div className="glass-card" style={{ padding: '20px', minHeight: '350px' }}>
          <h4 className="chart-title">⚡ توزیع خطوط</h4>
          <div style={{ height: '280px' }}>
            <Pie data={pieData('line_name')} options={chartOptions} />
          </div>
        </div>

        {/* نمودار دایره‌ای: موقعیت‌ها */}
        <div className="glass-card" style={{ padding: '20px', minHeight: '350px' }}>
          <h4 className="chart-title">📍 توزیع موقعیت‌ها</h4>
          <div style={{ height: '280px' }}>
            <Pie data={pieData('location')} options={chartOptions} />
          </div>
        </div>

        {/* نمودار میله‌ای: تعداد اکیپ */}
        <div className="glass-card" style={{ padding: '20px', minHeight: '350px' }}>
          <h4 className="chart-title">👥 توزیع تعداد اکیپ</h4>
          <div style={{ height: '280px' }}>
            <Bar data={barData('team_count')} options={chartOptions} />
          </div>
        </div>

        {/* نمودار میله‌ای: تعداد نفرات */}
        <div className="glass-card" style={{ padding: '20px', minHeight: '350px' }}>
          <h4 className="chart-title">👤 توزیع تعداد نفرات</h4>
          <div style={{ height: '280px' }}>
            <Bar data={barData('personnel_count')} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* در صورت خالی بودن داده‌ها */}
      {filtered.length === 0 && (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', marginTop: '20px' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            🪐 داده‌ای با فیلترهای انتخاب‌شده یافت نشد
          </span>
        </div>
      )}
    </div>
  );
}

export default Dashboard;