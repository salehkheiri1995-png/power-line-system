import React from 'react';
import ChartSection from './ChartSection';
import ChartBlock from './ChartBlock';
import { aggregateData } from './utils';

function TripleChartSection({ title, data, field, chartType, top, aggregate, onChartClick }) {
  const coldData = data.filter(r => r.program_type === 'سرد');
  const warmData = data.filter(r => r.program_type === 'گرم');

  return (
    <ChartSection title={title}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        <div>
          <div style={{ color: '#ff4d4d', fontWeight: 'bold', marginBottom: 10 }}>🔥 گرم</div>
          <ChartBlock data={aggregateData(warmData, field, aggregate)} chartType={chartType} top={top}
            onChartClick={(label) => onChartClick(field, label, warmData)} />
        </div>
        <div>
          <div style={{ color: '#00f0ff', fontWeight: 'bold', marginBottom: 10 }}>📊 هر دو</div>
          <ChartBlock data={aggregateData(data, field, aggregate)} chartType={chartType} top={top}
            onChartClick={(label) => onChartClick(field, label, data)} />
        </div>
        <div>
          <div style={{ color: '#b366ff', fontWeight: 'bold', marginBottom: 10 }}>❄️ سرد</div>
          <ChartBlock data={aggregateData(coldData, field, aggregate)} chartType={chartType} top={top}
            onChartClick={(label) => onChartClick(field, label, coldData)} />
        </div>
      </div>
    </ChartSection>
  );
}

export default TripleChartSection;