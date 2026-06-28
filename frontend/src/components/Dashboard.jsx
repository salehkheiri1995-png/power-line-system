import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line, PolarArea } from 'react-chartjs-2';
import FilterPanel from './FilterPanel';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
);

/* ─── پالت رنگی تم گرم ─── */
const P = [
  '#01696f','#3d95a3','#0c4e54','#2e6b0e',
  '#7dc452','#1d6fa4','#d4804a','#b52a1e',
  '#8a6200','#5a6475','#7a3610','#0f3638',
];
const PA = P.map(c => c + 'dd');

/* ─── tooltip مشترک ─── */
const TT = {
  rtl: true,
  backgroundColor: 'rgba(249,248,245,0.97)',
  titleColor: '#01696f',
  bodyColor: '#28251d',
  borderColor: '#d4d1ca',
  borderWidth: 1,
  padding: 10,
  titleFont: { family: 'Vazirmatn', weight: '700', size: 13 },
  bodyFont:  { family: 'Vazirmatn', size: 12 },
};

const LEG = (pos = 'bottom') => ({
  position: pos,
  labels: {
    padding: 14, boxWidth: 13, boxHeight: 13,
    font: { family: 'Vazirmatn', size: 11 },
    color: '#5e5c57',
  },
});

const AXIS = {
  ticks: { color: '#5e5c57', font: { family: 'Vazirmatn', size: 11 } },
  grid:  { color: 'rgba(40,37,29,0.07)' },
  border:{ color: '#dcd9d5' },
};

/* ─── helpers ─── */
const countBy = (arr, key, top = 999) => {
  const m = {};
  arr.forEach(r => { const v = r[key] || 'نامشخص'; m[v] = (m[v] || 0) + 1; });
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top);
};

const sumBy = (arr, groupKey, valueKey) => {
  const m = {};
  arr.forEach(r => {
    const g = r[groupKey] || 'نامشخص';
    m[g] = (m[g] || 0) + (+r[valueKey] || 0);
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};

/* ─── رنگ بر اساس درصد ─── */
const heatColor = (ratio) => {
  if (ratio > 0.7) return '#b52a1e';
  if (ratio > 0.4) return '#d4804a';
  if (ratio > 0.2) return '#8a6200';
  return '#01696f';
};

/* ==========================================================
   Dashboard Component
   ========================================================== */
function Dashboard({ records, filterOptions }) {
  const [filtered, setFiltered] = useState(records);

  const handleFilter = (filters) => {
    let r = [...records];
    if (filters.program_type)              r = r.filter(x => x.program_type === filters.program_type);
    if (filters.code)                      r = r.filter(x => x.code === filters.code);
    if (filters.voltage_level)             r = r.filter(x => x.voltage_level === filters.voltage_level);
    if (filters.location)                  r = r.filter(x => x.location === filters.location);
    if (filters.supervisor)                r = r.filter(x => x.supervisor === filters.supervisor);
    if (filters.line_names?.length)        r = r.filter(x => filters.line_names.includes(x.line_name));
    if (filters.work_descriptions?.length) r = r.filter(x => filters.work_descriptions.includes(x.work_description));
    const inRange = (rec, fy, fm, fd, ty, tm, td) => {
      if (!rec.execution_date) return false;
      const [y, m, d] = rec.execution_date.split('/').map(Number);
      if (fy && (y < +fy || (y === +fy && fm && (m < +fm || (m === +fm && fd && d < +fd))))) return false;
      if (ty && (y > +ty || (y === +ty && tm && (m > +tm || (m === +tm && td && d > +td))))) return false;
      return true;
    };
    if (filters.dateFromYear || filters.dateFromMonth || filters.dateFromDay ||
        filters.dateToYear   || filters.dateToMonth   || filters.dateToDay) {
      r = r.filter(x => inRange(x,
        filters.dateFromYear, filters.dateFromMonth, filters.dateFromDay,
        filters.dateToYear,   filters.dateToMonth,   filters.dateToDay));
    }
    setFiltered(r);
  };

  const handleClear = () => setFiltered(records);

  /* ─── محاسبات ─── */
  const data = useMemo(() => {
    const total       = filtered.length;
    const totalPers   = filtered.reduce((s, r) => s + (+r.personnel_count || 0), 0);
    const totalTeams  = filtered.reduce((s, r) => s + (+r.team_count || 0), 0);
    const uniqueLines = [...new Set(filtered.map(r => r.line_name).filter(Boolean))].length;
    const uniqueLocs  = [...new Set(filtered.map(r => r.location).filter(Boolean))].length;

    /* --- ۱. Doughnut — نوع برنامه --- */
    const pt = countBy(filtered, 'program_type', 8);
    const doughnutProgram = {
      labels: pt.map(e => e[0]),
      datasets: [{ data: pt.map(e => e[1]), backgroundColor: PA, borderColor: P, borderWidth: 2, hoverOffset: 10 }],
    };

    /* --- ۲. Doughnut — سطح ولتاژ --- */
    const vl = countBy(filtered, 'voltage_level', 8);
    const doughnutVoltage = {
      labels: vl.map(e => e[0]),
      datasets: [{ data: vl.map(e => e[1]), backgroundColor: PA, borderColor: P, borderWidth: 2, hoverOffset: 10 }],
    };

    /* --- ۳. Bar افقی — Top 10 خطوط --- */
    const ln = countBy(filtered, 'line_name', 10).reverse();
    const hbarLine = {
      labels: ln.map(e => e[0]),
      datasets: [{
        label: 'تعداد عملیات',
        data: ln.map(e => e[1]),
        backgroundColor: ln.map((_, i) => P[i % P.length] + 'cc'),
        borderColor:     ln.map((_, i) => P[i % P.length]),
        borderWidth: 1.5, borderRadius: 5, borderSkipped: false,
      }],
    };

    /* --- ۴. Bar عمودی — Top 10 موقعیت --- */
    const loc = countBy(filtered, 'location', 10);
    const barLocation = {
      labels: loc.map(e => e[0]),
      datasets: [{
        label: 'تعداد',
        data: loc.map(e => e[1]),
        backgroundColor: P[0] + 'bb',
        borderColor: P[0],
        borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
        hoverBackgroundColor: P[1] + 'cc',
      }],
    };

    /* --- ۵. Line — روند زمانی عملیات (بر اساس سال شمسی) --- */
    const byYear = {};
    filtered.forEach(r => {
      if (!r.execution_date) return;
      const y = r.execution_date.split('/')[0];
      if (y && y.length === 4) byYear[y] = (byYear[y] || 0) + 1;
    });
    const years = Object.keys(byYear).sort();
    const lineTrend = {
      labels: years,
      datasets: [{
        label: 'تعداد عملیات',
        data: years.map(y => byYear[y]),
        borderColor: P[0],
        backgroundColor: P[0] + '22',
        borderWidth: 2.5,
        pointRadius: 5, pointHoverRadius: 7,
        pointBackgroundColor: P[0],
        pointBorderColor: '#fff', pointBorderWidth: 2,
        tension: 0.38, fill: true,
      }],
    };

    /* --- ۶. Stacked Bar — نفرات vs اکیپ به تفکیک خط --- */
    const lineNames = [...new Set(filtered.map(r => r.line_name).filter(Boolean))]
      .map(l => ({ l, cnt: filtered.filter(r => r.line_name === l).length }))
      .sort((a, b) => b.cnt - a.cnt).slice(0, 8).map(x => x.l);
    const stackedBar = {
      labels: lineNames,
      datasets: [
        {
          label: 'جمع نفرات',
          data: lineNames.map(l => filtered.filter(r => r.line_name === l).reduce((s, r) => s + (+r.personnel_count || 0), 0)),
          backgroundColor: P[0] + 'cc',
          borderColor: P[0], borderWidth: 1.5, borderRadius: 4,
          stack: 's1',
        },
        {
          label: 'جمع اکیپ',
          data: lineNames.map(l => filtered.filter(r => r.line_name === l).reduce((s, r) => s + (+r.team_count || 0), 0)),
          backgroundColor: P[5] + 'cc',
          borderColor: P[5], borderWidth: 1.5, borderRadius: 4,
          stack: 's1',
        },
      ],
    };

    /* --- ۷. PolarArea — توزیع نوع کار --- */
    const wd = countBy(filtered, 'work_description', 7);
    const polar = {
      labels: wd.map(e => e[0]),
      datasets: [{ data: wd.map(e => e[1]), backgroundColor: PA.slice(0, wd.length), borderColor: P.slice(0, wd.length), borderWidth: 1.5 }],
    };

    /* --- ۸. Bar — میانگین نفر به اکیپ به تفکیک نوع برنامه --- */
    const ptNames = [...new Set(filtered.map(r => r.program_type).filter(Boolean))];
    const avgBar = {
      labels: ptNames,
      datasets: [{
        label: 'میانگین نفر / اکیپ',
        data: ptNames.map(pt => {
          const sub = filtered.filter(r => r.program_type === pt);
          const pers = sub.reduce((s, r) => s + (+r.personnel_count || 0), 0);
          const teams = sub.reduce((s, r) => s + (+r.team_count || 0), 0);
          return teams > 0 ? +(pers / teams).toFixed(1) : 0;
        }),
        backgroundColor: ptNames.map((_, i) => P[i % P.length] + 'bb'),
        borderColor:     ptNames.map((_, i) => P[i % P.length]),
        borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
      }],
    };

    return { total, totalPers, totalTeams, uniqueLines, uniqueLocs,
             doughnutProgram, doughnutVoltage, hbarLine, barLocation,
             lineTrend, stackedBar, polar, avgBar };
  }, [filtered]);

  /* ─── options ─── */
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    cutout: '62%',
    animation: { duration: 600 },
    plugins: { legend: LEG('right'), tooltip: TT },
  };

  const hbarOpts = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y',
    animation: { duration: 500 },
    plugins: { legend: { display: false }, tooltip: TT },
    scales: {
      x: { ...AXIS, beginAtZero: true, ticks: { ...AXIS.ticks, precision: 0 } },
      y: { ...AXIS, ticks: { ...AXIS.ticks, autoSkip: false } },
    },
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: { legend: { display: false }, tooltip: TT },
    scales: {
      x: { ...AXIS, ticks: { ...AXIS.ticks, maxRotation: 30, autoSkip: true, maxTicksLimit: 10 } },
      y: { ...AXIS, beginAtZero: true, ticks: { ...AXIS.ticks, precision: 0 } },
    },
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 700 },
    plugins: { legend: LEG('bottom'), tooltip: TT },
    scales: {
      x: { ...AXIS },
      y: { ...AXIS, beginAtZero: true, ticks: { ...AXIS.ticks, precision: 0 } },
    },
  };

  const stackedOpts = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: { legend: LEG('bottom'), tooltip: TT },
    scales: {
      x: { ...AXIS, ticks: { ...AXIS.ticks, maxRotation: 25, autoSkip: true, maxTicksLimit: 8 } },
      y: { ...AXIS, beginAtZero: true, stacked: true, ticks: { ...AXIS.ticks, precision: 0 } },
    },
  };

  const polarOpts = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: { legend: LEG('bottom'), tooltip: TT },
    scales: {
      r: {
        ticks: { color: '#5e5c57', font: { family: 'Vazirmatn', size: 10 }, backdropColor: 'transparent' },
        grid: { color: 'rgba(40,37,29,0.1)' },
        pointLabels: { font: { family: 'Vazirmatn', size: 10 }, color: '#5e5c57' },
      },
    },
  };

  const avgBarOpts = { ...barOpts, plugins: { legend: LEG('bottom'), tooltip: TT } };

  /* ─── render ─── */
  return (
    <div className="db-root">
      <FilterPanel options={filterOptions} onFilter={handleFilter} onClear={handleClear} records={records} />

      {/* KPI */}
      <div className="db-kpi-row">
        {[
          { icon: '📄', val: data.total,       label: 'جمع رکورد',            cls: 'db-kpi-primary' },
          { icon: '⚡',  val: data.uniqueLines,  label: 'خط منحصربهفرد',          cls: 'db-kpi-info'    },
          { icon: '📍', val: data.uniqueLocs,  label: 'موقعیت منحصربهفرد',       cls: 'db-kpi-success' },
          { icon: '👥', val: data.totalPers,   label: 'جمع نفرات',              cls: 'db-kpi-warning' },
          { icon: '🛠️', val: data.totalTeams,  label: 'جمع اکیپ',               cls: 'db-kpi-teams'   },
        ].map(({ icon, val, label, cls }) => (
          <div key={label} className={`db-kpi-card ${cls}`}>
            <span className="db-kpi-icon">{icon}</span>
            <div>
              <div className="db-kpi-val">{val.toLocaleString('fa-IR')}</div>
              <div className="db-kpi-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {data.total > 0 ? (
        <div className="db-charts-grid">

          {/* ۱ — Doughnut: نوع برنامه */}
          <div className="db-chart-card">
            <div className="db-chart-head">
              <span className="db-chart-icon">📋</span>
              <h4 className="db-chart-title">توزیع نوع برنامه</h4>
            </div>
            <div className="db-chart-wrap">
              <Doughnut data={data.doughnutProgram} options={doughnutOpts} />
            </div>
          </div>

          {/* ۲ — Doughnut: سطح ولتاژ */}
          <div className="db-chart-card">
            <div className="db-chart-head">
              <span className="db-chart-icon">⚡</span>
              <h4 className="db-chart-title">توزیع سطح ولتاژ</h4>
            </div>
            <div className="db-chart-wrap">
              <Doughnut data={data.doughnutVoltage} options={doughnutOpts} />
            </div>
          </div>

          {/* ۳ — PolarArea: نوع کار */}
          <div className="db-chart-card">
            <div className="db-chart-head">
              <span className="db-chart-icon">🔧</span>
              <h4 className="db-chart-title">توزیع نوع کار</h4>
            </div>
            <div className="db-chart-wrap">
              <PolarArea data={data.polar} options={polarOpts} />
            </div>
          </div>

          {/* ۴ — Line: روند زمانی */}
          <div className="db-chart-card db-chart-wide">
            <div className="db-chart-head">
              <span className="db-chart-icon">📈</span>
              <h4 className="db-chart-title">روند عملیات در طول سال</h4>
            </div>
            <div className="db-chart-wrap db-chart-wrap-md">
              <Line data={data.lineTrend} options={lineOpts} />
            </div>
          </div>

          {/* ۵ — HBar: Top خطوط */}
          <div className="db-chart-card db-chart-half">
            <div className="db-chart-head">
              <span className="db-chart-icon">⚡</span>
              <h4 className="db-chart-title">پرفعال‌ترین خطوط (Top 10)</h4>
            </div>
            <div className="db-chart-wrap db-chart-wrap-tall">
              <Bar data={data.hbarLine} options={hbarOpts} />
            </div>
          </div>

          {/* ۶ — Bar: موقعیت‌ها */}
          <div className="db-chart-card db-chart-half">
            <div className="db-chart-head">
              <span className="db-chart-icon">📍</span>
              <h4 className="db-chart-title">توزیع موقعیت‌ها (Top 10)</h4>
            </div>
            <div className="db-chart-wrap db-chart-wrap-tall">
              <Bar data={data.barLocation} options={barOpts} />
            </div>
          </div>

          {/* ۷ — Stacked Bar: نفرات + اکیپ به تفکیک خط */}
          <div className="db-chart-card db-chart-wide">
            <div className="db-chart-head">
              <span className="db-chart-icon">👥</span>
              <h4 className="db-chart-title">نفرات و اکیپ به تفکیک خط</h4>
            </div>
            <div className="db-chart-wrap db-chart-wrap-md">
              <Bar data={data.stackedBar} options={stackedOpts} />
            </div>
          </div>

          {/* ۸ — Bar: میانگین نفر/اکیپ */}
          <div className="db-chart-card db-chart-wide">
            <div className="db-chart-head">
              <span className="db-chart-icon">📊</span>
              <h4 className="db-chart-title">میانگین نفر به اکیپ به تفکیک نوع برنامه</h4>
            </div>
            <div className="db-chart-wrap db-chart-wrap-md">
              <Bar data={data.avgBar} options={avgBarOpts} />
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
