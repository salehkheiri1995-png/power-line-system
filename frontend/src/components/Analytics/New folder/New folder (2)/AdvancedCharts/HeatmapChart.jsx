import React, { useEffect, useState } from 'react';
import { getHeatmapData } from '../../../api';

function HeatmapChart() {
  const [heatmap, setHeatmap] = useState(null);
  useEffect(() => {
    getHeatmapData().then(res => setHeatmap(res.data));
  }, []);

  if (!heatmap) return <div>در حال بارگذاری...</div>;

  const maxVal = Math.max(...heatmap.data.flat());

  return (
    <div className="glass-card p-3" style={{ overflowX: 'auto' }}>
      <h4>🗺️ هیت‌مپ خط × موقعیت</h4>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th></th>
            {heatmap.locations.map(loc => <th key={loc}>{loc}</th>)}
          </tr>
        </thead>
        <tbody>
          {heatmap.lines.map((line, i) => (
            <tr key={line}>
              <td style={{ fontWeight: 'bold' }}>{line}</td>
              {heatmap.locations.map((loc, j) => {
                const value = heatmap.data[i][j];
                const opacity = maxVal > 0 ? value / maxVal : 0;
                return (
                  <td key={loc} style={{
                    background: `rgba(0, 240, 255, ${opacity})`,
                    color: opacity > 0.5 ? '#000' : '#fff',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HeatmapChart;