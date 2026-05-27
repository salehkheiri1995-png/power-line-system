import React, { useState, useMemo } from 'react';
import KPICards from './KPICards';
import OverviewTab from './OverviewTab';
import TrendsTab from './TrendsTab';
import FailureAnalysisTab from './FailureAnalysisTab';
import ResourcesTab from './ResourcesTab';
import FilterPanel from '../FilterPanel';
import { applyFilters, calcStats } from './utils';

const TABS = [
  { id: 'overview', label: '📊 خلاصه مدیریتی' },
  { id: 'trends', label: '📈 روندها و الگوها' },
  { id: 'failures', label: '⚠️ تحلیل خرابی و ریسک' },
  { id: 'resources', label: '👥 منابع و کارایی' },
];

function AnalyticsDashboard({ records, filterOptions, analyticsFilters, onAnalyticsFilterChange }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => applyFilters(records, analyticsFilters), [records, analyticsFilters]);
  const stats = useMemo(() => calcStats(filtered), [filtered]);

  if (!filterOptions) return <div>در حال بارگذاری فیلترها...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>📊 تحلیل پیشرفته</h3>
        <button className="btn-glow" onClick={() => setFiltersOpen(!filtersOpen)}>
          {filtersOpen ? '🔽 بستن فیلترها' : '🔍 فیلترها'}
        </button>
      </div>

      {filtersOpen && (
        <div style={{ marginBottom: 25 }}>
          <FilterPanel
            options={filterOptions}
            onFilter={onAnalyticsFilterChange}
            onClear={() => onAnalyticsFilterChange({})}
            records={records}
          />
        </div>
      )}

      <KPICards stats={stats} />

      <div className="space-tabs" style={{ marginBottom: 25 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`space-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab data={filtered} stats={stats} />}
      {activeTab === 'trends' && <TrendsTab data={filtered} />}
      {activeTab === 'failures' && <FailureAnalysisTab data={filtered} />}
      {activeTab === 'resources' && <ResourcesTab data={filtered} />}
    </div>
  );
}

export default AnalyticsDashboard;