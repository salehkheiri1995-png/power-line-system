import React, { useMemo, useState } from 'react';
import ChartSection from './ChartSection';
import ChartBlock from './ChartBlock';
import DataModal from './DataModal';
import { calcSupervisorWorkload, COLORS } from './utils';

function ResourcesTab({ data }) {
  const [modal, setModal] = useState(null);
  const workload = useMemo(() => calcSupervisorWorkload(data), [data]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
      <ChartSection title="عملکرد تیم‌ها">
        <ChartBlock data={Object.fromEntries(workload.map(w => [w[0], w[1].total]))} chartType="bar" height={300}
          onChartClick={(label) => setModal({ label, data: data.filter(r => r.supervisor === label) })} />
      </ChartSection>
      <ChartSection title="توزیع منابع">
        <ChartBlock data={/*...*/} chartType="pie" height={300} />
      </ChartSection>
      {modal && <DataModal title={modal.label} data={modal.data} onClose={() => setModal(null)} />}
    </div>
  );
}

export default ResourcesTab;