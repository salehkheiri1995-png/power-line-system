import React, { useState, useMemo } from 'react';
import ChartSection from './ChartSection';
import ChartBlock from './ChartBlock';
import DataModal from './DataModal';
import { calcStats } from './utils';

function OverviewTab({ data }) {
  const [modal, setModal] = useState(null);
  const stats = useMemo(() => calcStats(data), [data]);

  const typeData = { 'سرد': stats.cold, 'گرم': stats.warm };
  const voltageData = useMemo(() => {
    const map = {}; data.forEach(r => { map[r.voltage_level] = (map[r.voltage_level]||0)+1; }); return map;
  }, [data]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartSection title="توزیع نوع برنامه">
          <ChartBlock data={typeData} chartType="doughnut" height={250}
            onChartClick={(label) => setModal({ label, data: data.filter(r => r.program_type === label) })} />
        </ChartSection>
        <ChartSection title="توزیع سطح ولتاژ">
          <ChartBlock data={voltageData} chartType="polarArea" height={250}
            onChartClick={(label) => setModal({ label, data: data.filter(r => r.voltage_level == label) })} />
        </ChartSection>
      </div>
      {modal && <DataModal title={modal.label} data={modal.data} onClose={() => setModal(null)} />}
    </div>
  );
}

export default OverviewTab;