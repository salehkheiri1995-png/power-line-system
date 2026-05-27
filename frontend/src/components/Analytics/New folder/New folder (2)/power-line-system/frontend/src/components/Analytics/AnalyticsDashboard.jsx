import React, { useState, useMemo, useEffect } from 'react';
import { getParetoData, getTrendData, getHeatmapData, getCorrelationData } from '../../api'; // توابع جدید api
import StatsCards from './StatsCards';
import ChartSection from './ChartSection';
import DataModal from './DataModal';
import { calcStats } from './utils';
import FilterPanel from '../FilterPanel';
import { Chart } from 'chart.js';
import ParetoChart from './AdvancedCharts/ParetoChart';
import TrendChart from './AdvancedCharts/TrendChart';
import HeatmapChart from './AdvancedCharts/HeatmapChart';
import CorrelationChart from './AdvancedCharts/CorrelationChart';

function AnalyticsDashboard({ records, filterOptions, analyticsFilters, onAnalyticsFilterChange }) {
  const [modalData, setModalData] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState('overview'); // overview | pareto | trend | heatmap | correlation

  const filteredRecords = useMemo(() => {
    // همان تابع فیلتر اعمال شود
    if (!analyticsFilters || Object.keys(analyticsFilters).length === 0) return records;
    let result = [...records];
    const f = analyticsFilters;
    if (f.program_type) result = result.filter(r => r.program_type === f.program_type);
    if (f.code) result = result.filter(r => r.code === f.code);
    if (f.voltage_level) result = result.filter(r => r.voltage_level === f.voltage_level);
    if (f.location) result = result.filter(r => r.location === f.location);
    if (f.supervisor) result = result.filter(r => r.supervisor === f.supervisor);
    if (f.line_names?.length) result = result.filter(r => f.line_names.includes(r.line_name));
    if (f.work_descriptions?.length) result = result.filter(r => f.work_descriptions.includes(r.work_description));
    // تاریخ
    if (f.dateFromYear || f.dateFromMonth || f.dateFromDay) {
      result = result.filter(r => {
        if (!r.execution_date) return false;
        const [y, m, d] = r.execution_date.split('/').map(Number);
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
        const [y, m, d] = r.execution_date.split('/').map(Number);
        if (f.dateToYear && y > +f.dateToYear) return false;
        if (y === +f.dateToYear) {
          if (f.dateToMonth && m > +f.dateToMonth) return false;
          if (m === +f.dateToMonth && f.dateToDay && d > +f.dateToDay) return false;
        }
        return true;
      });
    }
    return result;
  }, [records, analyticsFilters]);

  const stats = useMemo(() => calcStats(filteredRecords), [filteredRecords]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: 'var(--accent-cyan)' }}>📊 تحلیل پیشرفته</h3>
        <button className="btn-glow" onClick={() => setFiltersOpen(!filtersOpen)}>
          {filtersOpen ? '🔽 بستن فیلترها' : '🔍 فیلترها'}
        </button>
      </div>

      {filtersOpen && (
        <div style={{ marginBottom: 25 }}>
          <FilterPanel
            options={filterOptions}
            onFilter={(f) => onAnalyticsFilterChange(f)}
            onClear={() => onAnalyticsFilterChange({})}
            records={records}
          />
        </div>
      )}

      {/* تب‌های داخلی برای انتخاب نوع تحلیل */}
      <div className="space-tabs" style={{ marginBottom: 20 }}>
        {['overview', 'pareto', 'trend', 'heatmap', 'correlation'].map(tab => (
          <button
            key={tab}
            className={`space-tab ${activeAnalysis === tab ? 'active' : ''}`}
            onClick={() => setActiveAnalysis(tab)}
          >
            {tab === 'overview' ? '📊 نمای کلی' :
             tab === 'pareto' ? '📈 تحلیل پارتو' :
             tab === 'trend' ? '📅 روند زمانی' :
             tab === 'heatmap' ? '🗺️ هیت‌مپ' : '🔗 همبستگی'}
          </button>
        ))}
      </div>

      <StatsCards stats={stats} />

      {activeAnalysis === 'overview' && (
        <OverviewCharts data={filteredRecords} onChartClick={(field, label, dataset) => {
          // همان منطق مودال
          setModalData({ title: `جزئیات ${label}`, selectedLabel: label, filteredData: dataset, allData: filteredRecords });
        }} />
      )}

      {activeAnalysis === 'pareto' && (
        <ParetoView />
      )}

      {activeAnalysis === 'trend' && (
        <TrendView />
      )}

      {activeAnalysis === 'heatmap' && (
        <HeatmapView />
      )}

      {activeAnalysis === 'correlation' && (
        <CorrelationView />
      )}

      {modalData && <DataModal {...modalData} onClose={() => setModalData(null)} />}
    </div>
  );
}

// زیرکامپوننت‌های هر تحلیل
function OverviewCharts({ data, onChartClick }) {
  // همان نمودارهای قبلی
  return (
    <div>
      <ChartSection title="📌 توزیع نوع برنامه">
        {/* ... */}
      </ChartSection>
      {/* بقیه نمودارها */}
    </div>
  );
}

function ParetoView() {
  // استفاده از API /api/analytics/pareto
  return <ParetoChart />;
}
function TrendView() {
  return <TrendChart />;
}
function HeatmapView() {
  return <HeatmapChart />;
}
function CorrelationView() {
  return <CorrelationChart />;
}

export default AnalyticsDashboard;