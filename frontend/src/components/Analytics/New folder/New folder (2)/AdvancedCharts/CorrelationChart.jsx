import React, { useEffect, useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import { getCorrelationData } from '../../../api';

function CorrelationChart() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getCorrelationData().then(res => setData(res.data));
  }, []);

  if (!data) return <div>در حال بارگذاری...</div>;

  const coldPoints = data.cold;
  const warmPoints = data.warm;

  const chartData = {
    datasets: [
      {
        label: 'سرد',
        data: coldPoints.map(p => ({ x: p.towers, y: p.quantity })),
        backgroundColor: '#00f0ff',
      },
      {
        label: 'گرم',
        data: warmPoints.map(p => ({ x: p.towers, y: p.quantity })),
        backgroundColor: '#ff4d4d',
      }
    ]
  };

  return (
    <div className="glass-card p-3">
      <h4>🔗 همبستگی دکل‌ها و مقدار کار</h4>
      <Scatter data={chartData} options={{ responsive: true }} />
    </div>
  );
}

export default CorrelationChart;