import React, { useMemo } from 'react';
import ChartSection from './ChartSection';
import ChartBlock from './ChartBlock';
import { calcMonthlyTrends } from './utils';

function TrendsTab({ data }) {
  const monthly = useMemo(() => calcMonthlyTrends(data), [data]);
  
  // تحلیل فصلی
  const seasonal = useMemo(() => {
    const s = { بهار: 0, تابستان: 0, پاییز: 0, زمستان: 0 };
    data.forEach(r => {
      const m = parseInt((r.execution_date||'').substring(5,7));
      if (m >=1 && m<=3) s['بهار']++;
      else if (m>=4 && m<=6) s['تابستان']++;
      else if (m>=7 && m<=9) s['پاییز']++;
      else s['زمستان']++;
    });
    return s;
  }, [data]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
      <ChartSection title="روند ماهانه">
        <ChartBlock data={monthly} chartType="line" height={300} />
      </ChartSection>
      <ChartSection title="الگوی فصلی">
        <ChartBlock data={seasonal} chartType="radar" height={300} />
      </ChartSection>
    </div>
  );
}

export default TrendsTab;