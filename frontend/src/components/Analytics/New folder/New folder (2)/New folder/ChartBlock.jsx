import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const COLORS = ['#00f0ff', '#ff4d4d', '#b366ff', '#ffaa00', '#00e676', '#ff4081', '#69f0ae', '#40c4ff', '#ff9f40', '#c9cbcf'];

function ChartBlock({ data, chartType, height = 250, onChartClick }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = Object.keys(data);
    const values = Object.values(data);
    const ctx = canvasRef.current.getContext('2d');

    chartRef.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: COLORS,
          borderColor: 'rgba(0,0,0,0.2)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#e0f0ff' } } },
        onClick: (e, elements) => {
          if (elements.length && onChartClick) onChartClick(labels[elements[0].index]);
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, chartType]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default ChartBlock;