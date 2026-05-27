
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
