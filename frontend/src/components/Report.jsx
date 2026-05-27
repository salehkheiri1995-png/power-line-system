import React, { useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const NEON_COLORS = [
  '#00f0ff',
  '#b366ff',
  '#ff4d94',
  '#ffaa00',
  '#00e676',
  '#ff4081',
  '#69f0ae',
  '#40c4ff',
  '#ff9f40',
  '#c9cbcf',
];

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
        font: { family: 'Vazirmatn', size: 11 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 20, 30, 0.9)',
      titleColor: '#00f0ff',
      bodyColor: '#e0f0ff',
      borderColor: '#00f0ff',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: '#8892b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: { color: '#8892b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
};

function Report({ records }) {
  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;

    const total = records.length;
    const cold = records.filter(r => r.program_type === 'سرد').length;
    const hot = total - cold;
    const avgTeam =
      records.reduce((s, r) => s + (+r.team_count || 0), 0) / total;
    const avgPersonnel =
      records.reduce((s, r) => s + (+r.personnel_count || 0), 0) / total;

    // خطوط پرتکرار
    const lineCounts = {};
    records.forEach(r => {
      const l = r.line_name || 'نامشخص';
      lineCounts[l] = (lineCounts[l] || 0) + 1;
    });
    const topLines = Object.entries(lineCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // شرح کارهای پرتکرار
    const workCounts = {};
    records.forEach(r => {
      const d = r.work_description || 'نامشخص';
      workCounts[d] = (workCounts[d] || 0) + 1;
    });
    const topWorks = Object.entries(workCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      total,
      cold,
      hot,
      avgTeam: avgTeam.toFixed(1),
      avgPersonnel: avgPersonnel.toFixed(1),
      topLines,
      topWorks,
    };
  }, [records]);

  if (!stats) {
    return (
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          🪐 داده‌ای برای گزارش وجود ندارد
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* کارت‌های آماری */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '30px',
        }}
      >
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h6 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>کل رکوردها</h6>
          <div className="stat-value" style={{ fontSize: '2.2rem', fontWeight: 700 }}>
            {stats.total}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h6 style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }}>برنامه سرد</h6>
          <div className="stat-value" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#00f0ff' }}>
            {stats.cold}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h6 style={{ color: 'var(--accent-pink)', marginBottom: '8px' }}>برنامه گرم</h6>
          <div className="stat-value" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ff4d94' }}>
            {stats.hot}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h6 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>میانگین اکیپ</h6>
          <div className="stat-value" style={{ fontSize: '2.2rem', fontWeight: 700 }}>
            {stats.avgTeam}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <h6 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>میانگین نفرات</h6>
          <div className="stat-value" style={{ fontSize: '2.2rem', fontWeight: 700 }}>
            {stats.avgPersonnel}
          </div>
        </div>
      </div>

      {/* نمودارها */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '20px',
        }}
      >
        {/* ۱۰ خط پرتکرار */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 className="chart-title">⚡ ۱۰ خط پرتکرار</h4>
          <div style={{ height: '300px' }}>
            <Bar
              data={{
                labels: stats.topLines.map(([l]) => l),
                datasets: [
                  {
                    label: 'تعداد',
                    data: stats.topLines.map(([, c]) => c),
                    backgroundColor: '#00f0ff',
                    borderRadius: 5,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* ۱۰ شرح کار پرتکرار */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 className="chart-title">🔧 ۱۰ شرح کار پرتکرار</h4>
          <div style={{ height: '300px' }}>
            <Pie
              data={{
                labels: stats.topWorks.map(([d]) => d),
                datasets: [
                  {
                    data: stats.topWorks.map(([, c]) => c),
                    backgroundColor: NEON_COLORS,
                    borderColor: 'rgba(0,0,0,0.3)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;