import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { getTrendData } from '../../../api';

function TrendChart() {
  const [data, setData] = useState([]);
  useEffect(() => { getTrendData().then(res => setData(res.data)); }, []);
  const chartData = {
    labels: data.map(d=>d.month),
    datasets: [{ label:'تعداد عملیات', data: data.map(d=>d.count), borderColor:'#00f0ff', backgroundColor:'rgba(0,240,255,0.1)', fill:true, tension:0.3 }]
  };
  return <div className="glass-card p-3"><h4>📅 روند ماهانه</h4><Line data={chartData} options={{ responsive:true }} /></div>;
}

export default TrendChart;
