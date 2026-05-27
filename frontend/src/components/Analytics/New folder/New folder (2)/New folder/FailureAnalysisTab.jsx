import React, { useMemo, useState } from 'react';
import ChartSection from './ChartSection';
import ChartBlock from './ChartBlock';
import DataModal from './DataModal';
import { calcTopFailureLines, COLORS } from './utils';

function FailureAnalysisTab({ data }) {
  const [modal, setModal] = useState(null);
  const topLines = useMemo(() => calcTopFailureLines(data), [data]);

  const lineChartData = Object.fromEntries(topLines);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
      <ChartSection title="🔝 پرتکرارترین خطوط">
        <ChartBlock data={lineChartData} chartType="bar" height={300}
          onChartClick={(label) => setModal({ label, data: data.filter(r => r.line_name === label) })} />
      </ChartSection>
      <ChartSection title="نقشه حرارتی موقعیت‌ها">
        <ChartBlock data={/*...*/} chartType="bar" height={300} />
      </ChartSection>
      {modal && <DataModal title={modal.label} data={modal.data} onClose={() => setModal(null)} />}
    </div>
  );
}

export default FailureAnalysisTab;