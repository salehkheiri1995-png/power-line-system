
import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const COLORS = ['#ff4d4d','#00f0ff','#b366ff','#ffaa00','#00e676','#ff4081','#69f0ae','#40c4ff','#ff9f40','#c9cbcf'];

function ChartBlock({ data, chartType, top, onChartClick }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const callbackRef = useRef(onChartClick);
  useEffect(() => { callbackRef.current = onChartClick; }, [onChartClick]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!data || Object.keys(data).length === 0) return;

    let labels = Object.keys(data);
    let values = Object.values(data);
    if (top) {
      const sorted = Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,top);
      labels = sorted.map(e=>e[0]);
      values = sorted.map(e=>e[1]);
    }

    const ctx = canvasRef.current.getContext('2d');
    const finalType = chartType === 'horizontalBar' ? 'bar' : chartType;

    chartRef.current = new Chart(ctx, {
      type: finalType,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: COLORS,
          borderColor: 'rgba(0,0,0,0.2)',
          borderWidth: 1,
          ...(chartType === 'line' ? { fill: true, tension: 0.3 } : {}),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
        plugins: { legend: { display: false } },
        onClick: (event, elements) => {
          if (elements.length > 0 && callbackRef.current) {
            callbackRef.current(labels[elements[0].index]);
          }
        }
      }
    });

    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [data, chartType, top]);

  if (!data || Object.keys(data).length === 0) {
    return <div style={{ textAlign:'center', color:'#666', padding:20 }}>داده‌ای موجود نیست</div>;
  }

  return <div style={{ height: 250 }}><canvas ref={canvasRef} /></div>;
}

export default ChartBlock;
