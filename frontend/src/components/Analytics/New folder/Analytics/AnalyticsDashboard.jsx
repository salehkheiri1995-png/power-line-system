import React, { useState, useMemo, useEffect, useRef } from 'react';
import StatsCards from './StatsCards';
import ChartSection from './ChartSection';
import TripleChartSection from './TripleChartSection';
import DataModal from './DataModal';
import { calcStats, persianMonths } from './utils';
import FilterPanel from '../FilterPanel';
import { Chart, registerables } from 'chart.js';
import { getParetoData, getTrendData, getHeatmapData, getCorrelationData } from '../../api';
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
