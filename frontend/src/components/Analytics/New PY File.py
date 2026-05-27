import os

# مسیر پایه فرانت‌اند
BASE_DIR = r"C:\reversscripts\power-line-system\frontend\src\components\Analytics"

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Created: {path}")

# ========== 1. utils.js ==========
write_file(os.path.join(BASE_DIR, "utils.js"), r"""
export const persianMonths = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند'
];

export function calcStats(data) {
  let total = data.length, cold = 0, warm = 0, totalTowers = 0;
  const unitQuantities = {};
  data.forEach(r => {
    if (r.program_type === 'سرد') cold++; else if (r.program_type === 'گرم') warm++;
    const towers = (r.tower_number || '').split('-').filter(Boolean);
    totalTowers += towers.length;
    const u = r.unit || 'عدد';
    unitQuantities[u] = (unitQuantities[u] || 0) + (parseFloat(r.quantity) || 0);
  });
  return { total, cold, warm, totalTowers, avgTowers: total ? totalTowers/total : 0, unitQuantities };
}

export function aggregateData(data, field, aggregate) {
  const counts = {};
  data.forEach(r => {
    let key = r[field];
    if (field === 'month') {
      const m = (r.execution_date || '').substring(5,7);
      key = persianMonths[parseInt(m)-1] || m;
    }
    if (!key) key = 'نامشخص';
    if (aggregate === 'quantity') {
      counts[key] = (counts[key] || 0) + (parseFloat(r.quantity) || 0);
    } else {
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  return counts;
}
""")

# ========== 2. StatsCards.jsx ==========
write_file(os.path.join(BASE_DIR, "StatsCards.jsx"), r"""
import React from 'react';

function StatsCards({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 30 }}>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>کل عملیات</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{stats.total}</div>
      </div>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>کل دکل‌ها</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{stats.totalTowers}</div>
      </div>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>میانگین دکل/عملیات</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{stats.avgTowers.toFixed(2)}</div>
      </div>
      <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>تعداد واحدها</div>
        <div className="stat-value" style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{Object.keys(stats.unitQuantities).length}</div>
      </div>
    </div>
  );
}

export default StatsCards;
""")

# ========== 3. ChartSection.jsx ==========
write_file(os.path.join(BASE_DIR, "ChartSection.jsx"), r"""
import React from 'react';

function ChartSection({ title, children }) {
  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 25 }}>
      <h4 style={{ color: 'var(--accent-cyan)', marginBottom: 15 }}>{title}</h4>
      {children}
    </div>
  );
}

export default ChartSection;
""")

# ========== 4. ChartBlock.jsx ==========
write_file(os.path.join(BASE_DIR, "ChartBlock.jsx"), r"""
import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const COLORS = ['#ff4d4d','#00f0ff','#b366ff','#ffaa00','#00e676','#ff4081','#69f0ae','#40c4ff','#ff9f40','#c9cbcf'];

function ChartBlock({ data, chartType, top, onChartClick }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const callbackRef = useRef(onChartClick);
  useEffect(() => { callbackRef.current = onChartClick; }, [onChartClick]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!data || Object.keys(data).length === 0) return;

    let labels = Object.keys(data);
    let values = Object.values(data);
    if (top) {
      const sorted = Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,top);
      labels = sorted.map(e=>e[0]);
      values = sorted.map(e=>e[1]);
    }

    const ctx = canvasRef.current.getContext('2d');
    const finalType = chartType === 'horizontalBar' ? 'bar' : chartType;

    chartRef.current = new Chart(ctx, {
      type: finalType,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: COLORS,
          borderColor: 'rgba(0,0,0,0.2)',
          borderWidth: 1,
          ...(chartType === 'line' ? { fill: true, tension: 0.3 } : {}),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
        plugins: { legend: { display: false } },
        onClick: (event, elements) => {
          if (elements.length > 0 && callbackRef.current) {
            callbackRef.current(labels[elements[0].index]);
          }
        }
      }
    });

    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [data, chartType, top]);

  if (!data || Object.keys(data).length === 0) {
    return <div style={{ textAlign:'center', color:'#666', padding:20 }}>داده‌ای موجود نیست</div>;
  }

  return <div style={{ height: 250 }}><canvas ref={canvasRef} /></div>;
}

export default ChartBlock;
""")

# ========== 5. DataModal.jsx ==========
write_file(os.path.join(BASE_DIR, "DataModal.jsx"), r"""
import React from 'react';

function DataModal({ title, selectedLabel, filteredData, allData, onClose }) {
  if (!filteredData || filteredData.length === 0) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div className="glass-card" style={{ padding: 20, textAlign: 'center' }} onClick={e=>e.stopPropagation()}>
          <p>داده‌ای برای این بخش موجود نیست.</p>
          <button className="btn-glow" onClick={onClose}>بستن</button>
        </div>
      </div>
    );
  }

  const workCounts = {};
  filteredData.forEach(r => {
    const w = r.work_description || 'نامشخص';
    workCounts[w] = (workCounts[w] || 0) + 1;
  });
  const sortedWorks = Object.entries(workCounts).sort((a,b)=>b[1]-a[1]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="glass-card" style={modalStyle} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:15 }}>
          <h3 style={{ color:'var(--accent-cyan)' }}>📊 داده‌های: {selectedLabel}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#ff4d4d', fontSize:28, cursor:'pointer' }}>✕</button>
        </div>
        <p style={{ color:'var(--text-secondary)' }}>{title} — تعداد کل: {filteredData.length} عملیات</p>

        <h4 style={{ color:'var(--accent-cyan)', marginTop:20 }}>🔝 شرح کارهای انجام شده</h4>
        <div style={{ maxHeight:300, overflowY:'auto' }}>
          <table className="space-table" style={{ width:'100%', fontSize:13 }}>
            <thead><tr><th>رتبه</th><th>شرح کار</th><th>تعداد</th><th>درصد</th></tr></thead>
            <tbody>
              {sortedWorks.map(([w,c], i)=>(
                <tr key={i}><td>{i+1}</td><td>{w}</td><td>{c}</td><td>{((c/filteredData.length)*100).toFixed(1)}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 style={{ color:'var(--accent-cyan)', marginTop:20 }}>📋 تمام رکوردها</h4>
        <div style={{ maxHeight:300, overflowY:'auto' }}>
          <table className="space-table" style={{ width:'100%', fontSize:11 }}>
            <thead><tr><th>نوع</th><th>خط</th><th>ولتاژ</th><th>کار</th><th>مقدار</th><th>موقعیت</th><th>تاریخ</th></tr></thead>
            <tbody>
              {filteredData.map((r,i)=>(
                <tr key={i}><td>{r.program_type}</td><td>{r.line_name}</td><td>{r.voltage_level}</td><td style={{fontSize:10}}>{r.work_description}</td><td>{r.quantity} {r.unit}</td><td>{r.location}</td><td>{r.execution_date}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-glow" style={{ marginTop:20, width:'100%' }} onClick={onClose}>بستن</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
  backgroundColor:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)',
  display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999
};

const modalStyle = {
  width:'90%', maxWidth:'900px', maxHeight:'85vh', overflowY:'auto',
  padding:25, borderRadius:16, border:'1px solid rgba(0,240,255,0.3)',
  boxShadow:'0 0 40px rgba(0,240,255,0.2)'
};

export default DataModal;
""")

# ========== 6. TripleChartSection.jsx ==========
write_file(os.path.join(BASE_DIR, "TripleChartSection.jsx"), r"""
import React from 'react';
import ChartSection from './ChartSection';
import ChartBlock from './ChartBlock';
import { aggregateData } from './utils';

function TripleChartSection({ title, data, field, chartType, top, aggregate, onChartClick }) {
  const coldData = data.filter(r => r.program_type === 'سرد');
  const warmData = data.filter(r => r.program_type === 'گرم');
  return (
    <ChartSection title={title}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
        <div>
          <div style={{ color:'#ff4d4d', fontWeight:'bold', marginBottom:10 }}>🔥 گرم</div>
          <ChartBlock data={aggregateData(warmData, field, aggregate)} chartType={chartType} top={top}
            onChartClick={(label) => onChartClick(field, label, warmData)} />
        </div>
        <div>
          <div style={{ color:'#00f0ff', fontWeight:'bold', marginBottom:10 }}>📊 هر دو</div>
          <ChartBlock data={aggregateData(data, field, aggregate)} chartType={chartType} top={top}
            onChartClick={(label) => onChartClick(field, label, data)} />
        </div>
        <div>
          <div style={{ color:'#b366ff', fontWeight:'bold', marginBottom:10 }}>❄️ سرد</div>
          <ChartBlock data={aggregateData(coldData, field, aggregate)} chartType={chartType} top={top}
            onChartClick={(label) => onChartClick(field, label, coldData)} />
        </div>
      </div>
    </ChartSection>
  );
}

export default TripleChartSection;
""")

# ========== 7. AdvancedCharts (پوشه و فایل‌ها) ==========
adv_dir = os.path.join(BASE_DIR, "AdvancedCharts")
os.makedirs(adv_dir, exist_ok=True)

write_file(os.path.join(adv_dir, "ParetoChart.jsx"), r"""
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { getParetoData } from '../../../api';

function ParetoChart() {
  const [data, setData] = useState(null);
  const [field, setField] = useState('work_description');
  useEffect(() => { getParetoData(field).then(res => setData(res.data)); }, [field]);
  if (!data) return <div>در حال بارگذاری...</div>;

  const chartData = {
    labels: data.map(d=>d.label),
    datasets: [
      { type:'bar', label:'تعداد', data: data.map(d=>d.count), backgroundColor:'#00f0ff', yAxisID:'y' },
      { type:'line', label:'درصد تجمعی', data: data.map(d=>d.cumulative_percentage), borderColor:'#ff4d4d', backgroundColor:'transparent', yAxisID:'y1' }
    ]
  };

  return (
    <div className="glass-card p-3">
      <h4>📈 تحلیل پارتو</h4>
      <select value={field} onChange={e=>setField(e.target.value)} className="form-select mb-3">
        <option value="work_description">شرح کار</option>
        <option value="line_name">نام خط</option>
        <option value="location">موقعیت</option>
        <option value="supervisor">سرپرست</option>
      </select>
      <Bar data={chartData} options={{ responsive:true, scales:{ y:{ beginAtZero:true, position:'left' }, y1:{ beginAtZero:true, max:100, position:'right', grid:{ drawOnChartArea:false } } } }} />
    </div>
  );
}

export default ParetoChart;
""")

write_file(os.path.join(adv_dir, "TrendChart.jsx"), r"""
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { getTrendData } from '../../../api';

function TrendChart() {
  const [data, setData] = useState([]);
  useEffect(() => { getTrendData().then(res => setData(res.data)); }, []);
  const chartData = {
    labels: data.map(d=>d.month),
    datasets: [{ label:'تعداد عملیات', data: data.map(d=>d.count), borderColor:'#00f0ff', backgroundColor:'rgba(0,240,255,0.1)', fill:true, tension:0.3 }]
  };
  return <div className="glass-card p-3"><h4>📅 روند ماهانه</h4><Line data={chartData} options={{ responsive:true }} /></div>;
}

export default TrendChart;
""")

write_file(os.path.join(adv_dir, "HeatmapChart.jsx"), r"""
import React, { useEffect, useState } from 'react';
import { getHeatmapData } from '../../../api';

function HeatmapChart() {
  const [heatmap, setHeatmap] = useState(null);
  useEffect(() => { getHeatmapData().then(res => setHeatmap(res.data)); }, []);
  if (!heatmap) return <div>در حال بارگذاری...</div>;
  const maxVal = Math.max(...heatmap.data.flat());
  return (
    <div className="glass-card p-3" style={{ overflowX:'auto' }}>
      <h4>🗺️ هیت‌مپ خط × موقعیت</h4>
      <table style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead><tr><th></th>{heatmap.locations.map(loc=><th key={loc}>{loc}</th>)}</tr></thead>
        <tbody>
          {heatmap.lines.map((line,i)=>(
            <tr key={line}><td style={{fontWeight:'bold'}}>{line}</td>
              {heatmap.locations.map((loc,j)=>{
                const val = heatmap.data[i][j];
                const opacity = maxVal>0 ? val/maxVal : 0;
                return <td key={loc} style={{ background:`rgba(0,240,255,${opacity})`, color: opacity>0.5?'#000':'#fff', padding:8, textAlign:'center' }}>{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HeatmapChart;
""")

write_file(os.path.join(adv_dir, "CorrelationChart.jsx"), r"""
import React, { useEffect, useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import { getCorrelationData } from '../../../api';

function CorrelationChart() {
  const [data, setData] = useState(null);
  useEffect(() => { getCorrelationData().then(res => setData(res.data)); }, []);
  if (!data) return <div>در حال بارگذاری...</div>;
  const chartData = {
    datasets: [
      { label:'سرد', data: data.cold.map(p=>({x:p.towers, y:p.quantity})), backgroundColor:'#00f0ff' },
      { label:'گرم', data: data.warm.map(p=>({x:p.towers, y:p.quantity})), backgroundColor:'#ff4d4d' }
    ]
  };
  return <div className="glass-card p-3"><h4>🔗 همبستگی دکل‌ها و مقدار کار</h4><Scatter data={chartData} options={{ responsive:true }} /></div>;
}

export default CorrelationChart;
""")

# ========== 8. AnalyticsDashboard.jsx (اصلی) ==========
write_file(os.path.join(BASE_DIR, "AnalyticsDashboard.jsx"), r"""
import React, { useState, useMemo, useEffect, useRef } from 'react';
import StatsCards from './StatsCards';
import ChartSection from './ChartSection';
import TripleChartSection from './TripleChartSection';
import DataModal from './DataModal';
import { calcStats, persianMonths } from './utils';
import FilterPanel from '../FilterPanel';
import { Chart, registerables } from 'chart.js';
import ParetoChart from './AdvancedCharts/ParetoChart';
import TrendChart from './AdvancedCharts/TrendChart';
import HeatmapChart from './AdvancedCharts/HeatmapChart';
import CorrelationChart from './AdvancedCharts/CorrelationChart';
Chart.register(...registerables);

function applyFilters(records, filters) {
  if (!filters || Object.keys(filters).length === 0) return records;
  let result = [...records];
  const f = filters;
  if (f.program_type) result = result.filter(r => r.program_type === f.program_type);
  if (f.code) result = result.filter(r => r.code === f.code);
  if (f.voltage_level) result = result.filter(r => r.voltage_level === f.voltage_level);
  if (f.location) result = result.filter(r => r.location === f.location);
  if (f.supervisor) result = result.filter(r => r.supervisor === f.supervisor);
  if (f.line_names?.length) result = result.filter(r => f.line_names.includes(r.line_name));
  if (f.work_descriptions?.length) result = result.filter(r => f.work_descriptions.includes(r.work_description));
  if (f.dateFromYear || f.dateFromMonth || f.dateFromDay) {
    result = result.filter(r => {
      if (!r.execution_date) return false;
      const [y,m,d] = r.execution_date.split('/').map(Number);
      if (f.dateFromYear && y < +f.dateFromYear) return false;
      if (y === +f.dateFromYear) {
        if (f.dateFromMonth && m < +f.dateFromMonth) return false;
        if (m === +f.dateFromMonth && f.dateFromDay && d < +f.dateFromDay) return false;
      }
      return true;
    });
  }
  if (f.dateToYear || f.dateToMonth || f.dateToDay) {
    result = result.filter(r => {
      if (!r.execution_date) return false;
      const [y,m,d] = r.execution_date.split('/').map(Number);
      if (f.dateToYear && y > +f.dateToYear) return false;
      if (y === +f.dateToYear) {
        if (f.dateToMonth && m > +f.dateToMonth) return false;
        if (m === +f.dateToMonth && f.dateToDay && d > +f.dateToDay) return false;
      }
      return true;
    });
  }
  return result;
}

function AnalyticsDashboard({ records, filterOptions, analyticsFilters, onAnalyticsFilterChange }) {
  const [modalData, setModalData] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState('overview');
  const doughnutRef = useRef(null);

  const filteredRecords = useMemo(() => applyFilters(records, analyticsFilters), [records, analyticsFilters]);
  const stats = useMemo(() => calcStats(filteredRecords), [filteredRecords]);

  const handleChartClick = (field, label, dataset) => {
    let selected = [];
    if (field === 'voltage_level') selected = dataset.filter(r => (r.voltage_level||'').toString() === label);
    else if (field === 'location') selected = dataset.filter(r => r.location === label);
    else if (field === 'line_name') selected = dataset.filter(r => r.line_name === label);
    else if (field === 'unit') selected = dataset.filter(r => r.unit === label);
    else if (field === 'month') {
      selected = dataset.filter(r => {
        const m = (r.execution_date||'').substring(5,7);
        return persianMonths[parseInt(m)-1] === label;
      });
    } else if (field === 'program_type') selected = dataset.filter(r => r.program_type === label);
    else selected = dataset;
    setModalData({ title: `جزئیات ${label}`, selectedLabel: label, filteredData: selected, allData: filteredRecords });
  };

  useEffect(() => {
    if (!doughnutRef.current) return;
    const ctx = doughnutRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['سرد','گرم'],
        datasets: [{ data: [stats.cold, stats.warm], backgroundColor: ['#00f0ff','#ff4d4d'] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const label = ['سرد','گرم'][elements[0].index];
            handleChartClick('program_type', label, filteredRecords);
          }
        }
      }
    });
    return () => chart.destroy();
  }, [stats, filteredRecords]);

  if (!filterOptions) return <div className="glass-card p-4">در حال بارگذاری فیلترها...</div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ color:'var(--accent-cyan)' }}>📊 تحلیل پیشرفته</h3>
        <button className="btn-glow" onClick={() => setFiltersOpen(!filtersOpen)}>
          {filtersOpen ? '🔽 بستن فیلترها' : '🔍 فیلترها'}
        </button>
      </div>

      {filtersOpen && (
        <div style={{ marginBottom:25 }}>
          <FilterPanel options={filterOptions} onFilter={(f)=>onAnalyticsFilterChange(f)} onClear={()=>onAnalyticsFilterChange({})} records={records} />
        </div>
      )}

      <div className="space-tabs" style={{ marginBottom:20 }}>
        {['overview','pareto','trend','heatmap','correlation'].map(tab => (
          <button key={tab} className={`space-tab ${activeAnalysis===tab?'active':''}`} onClick={()=>setActiveAnalysis(tab)}>
            {tab==='overview'?'📊 نمای کلی':tab==='pareto'?'📈 پارتو':tab==='trend'?'📅 روند':tab==='heatmap'?'🗺️ هیت‌مپ':'🔗 همبستگی'}
          </button>
        ))}
      </div>

      <StatsCards stats={stats} />

      {filteredRecords.length === 0 ? (
        <div className="glass-card p-4 text-center">داده‌ای با این فیلترها یافت نشد.</div>
      ) : (
        <>
          {activeAnalysis === 'overview' && (
            <>
              <ChartSection title="📌 توزیع نوع برنامه">
                <div style={{ maxWidth:400, margin:'0 auto', height:300 }}><canvas ref={doughnutRef} /></div>
              </ChartSection>
              <TripleChartSection title="⚡ سطح ولتاژ" data={filteredRecords} field="voltage_level" chartType="bar" onChartClick={handleChartClick} />
              <TripleChartSection title="🗺️ موقعیت" data={filteredRecords} field="location" chartType="pie" onChartClick={handleChartClick} />
              <TripleChartSection title="🔗 بیشترین خطوط" data={filteredRecords} field="line_name" chartType="horizontalBar" top={12} onChartClick={handleChartClick} />
              <TripleChartSection title="📏 واحدهای اندازه‌گیری" data={filteredRecords} field="unit" chartType="doughnut" aggregate="quantity" onChartClick={handleChartClick} />
              <TripleChartSection title="📅 توزیع ماهانه" data={filteredRecords} field="month" chartType="line" onChartClick={handleChartClick} />
            </>
          )}
          {activeAnalysis === 'pareto' && <ParetoChart />}
          {activeAnalysis === 'trend' && <TrendChart />}
          {activeAnalysis === 'heatmap' && <HeatmapChart />}
          {activeAnalysis === 'correlation' && <CorrelationChart />}
        </>
      )}

      {modalData && <DataModal {...modalData} onClose={() => setModalData(null)} />}
    </div>
  );
}

export default AnalyticsDashboard;
""")

print("\n✅ تمام فایل‌های تحلیل پیشرفته با موفقیت ساخته شدند.")
print("حالا پروژه رو رفرش کن (npm run dev) و تب تحلیل پیشرفته رو ببین.")