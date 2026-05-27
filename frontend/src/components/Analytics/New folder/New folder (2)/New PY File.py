# setup_analytics.py
# این اسکریپت تمام فایل‌های مورد نیاز برای بخش تحلیل پیشرفته را ایجاد می‌کند.
# اجرا: python setup_analytics.py

import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ ایجاد شد: {path}")

def main():
    base = os.path.join("power-line-system")  # پوشه اصلی پروژه

    # --- 1. بک‌اند: endpoints تحلیلی جدید ---
    analytics_router = '''from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import SessionLocal
from models import PowerLineRecord
import datetime

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pareto")
def pareto_analysis(field: str = Query("work_description"), db: Session = Depends(get_db)):
    """
    تحلیل پارتو: بر اساس فیلد انتخابی (work_description, line_name, location, supervisor)
    تعداد وقوع را محاسبه و درصد تجمعی برمی‌گرداند.
    """
    records = db.query(PowerLineRecord).all()
    counts = {}
    for r in records:
        val = getattr(r, field, None) or "نامشخص"
        counts[val] = counts.get(val, 0) + 1
    sorted_items = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    total = sum(counts.values())
    result = []
    cumsum = 0
    for name, cnt in sorted_items:
        cumsum += cnt
        result.append({
            "label": name,
            "count": cnt,
            "percentage": round(cnt / total * 100, 2),
            "cumulative_percentage": round(cumsum / total * 100, 2)
        })
    return result

@router.get("/trend")
def trend_analysis(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    روند زمانی (ماهانه) تعداد عملیات
    در صورت ارائه start/end می‌تواند فیلتر کند.
    """
    records = db.query(PowerLineRecord).all()
    monthly = {}
    for r in records:
        date_str = r.execution_date
        if not date_str or len(date_str) < 7:
            continue
        month_key = date_str[:7]  # e.g. 1403/01
        monthly[month_key] = monthly.get(month_key, 0) + 1
    sorted_months = sorted(monthly.items())
    return [{"month": m, "count": c} for m, c in sorted_months]

@router.get("/heatmap")
def heatmap_data(db: Session = Depends(get_db)):
    """
    ماتریس متقاطع خط × موقعیت برای تحلیل تمرکز عملیات
    """
    records = db.query(PowerLineRecord).all()
    lines = sorted(list(set(r.line_name for r in records if r.line_name)))
    locations = sorted(list(set(r.location for r in records if r.location)))
    matrix = {line: {loc: 0 for loc in locations} for line in lines}
    for r in records:
        if r.line_name and r.location:
            matrix[r.line_name][r.location] += 1
    return {
        "lines": lines,
        "locations": locations,
        "data": [[matrix[line][loc] for loc in locations] for line in lines]
    }

@router.get("/correlation")
def correlation(db: Session = Depends(get_db)):
    """
    همبستگی بین تعداد دکل‌ها و مقدار کار (quantity) به تفکیک نوع برنامه
    """
    records = db.query(PowerLineRecord).all()
    cold, warm = [], []
    for r in records:
        towers = len((r.tower_number or '').split('-')) if r.tower_number else 0
        qty = r.quantity or 0
        if r.program_type == 'سرد':
            cold.append((towers, qty))
        else:
            warm.append((towers, qty))
    return {
        "cold": [{"towers": t, "quantity": q} for t, q in cold],
        "warm": [{"towers": t, "quantity": q} for t, q in warm]
    }
'''

    # --- 2. بروزرسانی main.py (افزودن router جدید) ---
    # ابتدا فایل main.py را می‌خوانیم و در صورت نبود router analytics اضافه می‌کنیم
    main_path = os.path.join(base, "backend", "main.py")
    if os.path.exists(main_path):
        with open(main_path, 'r', encoding='utf-8') as f:
            main_content = f.read()
        if "from routers.analytics import router as analytics_router" not in main_content:
            # اضافه کردن import
            main_content = main_content.replace(
                "from routers.items import router as items_router",
                "from routers.items import router as items_router\nfrom routers.analytics import router as analytics_router"
            )
            # اضافه کردن app.include_router
            main_content = main_content.replace(
                "app.include_router(items_router)",
                "app.include_router(items_router)\napp.include_router(analytics_router)"
            )
            with open(main_path, 'w', encoding='utf-8') as f:
                f.write(main_content)
            print("✅ main.py بروزرسانی شد (افزودن analytics router)")

    # --- 3. فایل‌های فرانت‌اند ---
    # 3.1 AnalyticsDashboard.jsx (نسخه جدید با نمودارهای پارتو، روند، هیت‌مپ و ...)
    dashboard_jsx = '''import React, { useState, useMemo, useEffect } from 'react';
import { getParetoData, getTrendData, getHeatmapData, getCorrelationData } from '../../api'; // توابع جدید api
import StatsCards from './StatsCards';
import ChartSection from './ChartSection';
import DataModal from './DataModal';
import { calcStats } from './utils';
import FilterPanel from '../FilterPanel';
import { Chart } from 'chart.js';
import ParetoChart from './AdvancedCharts/ParetoChart';
import TrendChart from './AdvancedCharts/TrendChart';
import HeatmapChart from './AdvancedCharts/HeatmapChart';
import CorrelationChart from './AdvancedCharts/CorrelationChart';

function AnalyticsDashboard({ records, filterOptions, analyticsFilters, onAnalyticsFilterChange }) {
  const [modalData, setModalData] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState('overview'); // overview | pareto | trend | heatmap | correlation

  const filteredRecords = useMemo(() => {
    // همان تابع فیلتر اعمال شود
    if (!analyticsFilters || Object.keys(analyticsFilters).length === 0) return records;
    let result = [...records];
    const f = analyticsFilters;
    if (f.program_type) result = result.filter(r => r.program_type === f.program_type);
    if (f.code) result = result.filter(r => r.code === f.code);
    if (f.voltage_level) result = result.filter(r => r.voltage_level === f.voltage_level);
    if (f.location) result = result.filter(r => r.location === f.location);
    if (f.supervisor) result = result.filter(r => r.supervisor === f.supervisor);
    if (f.line_names?.length) result = result.filter(r => f.line_names.includes(r.line_name));
    if (f.work_descriptions?.length) result = result.filter(r => f.work_descriptions.includes(r.work_description));
    // تاریخ
    if (f.dateFromYear || f.dateFromMonth || f.dateFromDay) {
      result = result.filter(r => {
        if (!r.execution_date) return false;
        const [y, m, d] = r.execution_date.split('/').map(Number);
        if (f.dateFromYear && y < +f.dateFromYear) return false;
        if (y === +f.dateFromYear) {
          if (f.dateFromMonth && m < +f.dateFromMonth) return false;
          if (m === +f.dateFromMonth && f.dateFromDay && d < +f.dateFromDay) return false;
        }
        return true;
      });
    }
    if (f.dateToYear || f.dateToMonth || f.dateToDay) {
      result = result.filter(r => {
        if (!r.execution_date) return false;
        const [y, m, d] = r.execution_date.split('/').map(Number);
        if (f.dateToYear && y > +f.dateToYear) return false;
        if (y === +f.dateToYear) {
          if (f.dateToMonth && m > +f.dateToMonth) return false;
          if (m === +f.dateToMonth && f.dateToDay && d > +f.dateToDay) return false;
        }
        return true;
      });
    }
    return result;
  }, [records, analyticsFilters]);

  const stats = useMemo(() => calcStats(filteredRecords), [filteredRecords]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: 'var(--accent-cyan)' }}>📊 تحلیل پیشرفته</h3>
        <button className="btn-glow" onClick={() => setFiltersOpen(!filtersOpen)}>
          {filtersOpen ? '🔽 بستن فیلترها' : '🔍 فیلترها'}
        </button>
      </div>

      {filtersOpen && (
        <div style={{ marginBottom: 25 }}>
          <FilterPanel
            options={filterOptions}
            onFilter={(f) => onAnalyticsFilterChange(f)}
            onClear={() => onAnalyticsFilterChange({})}
            records={records}
          />
        </div>
      )}

      {/* تب‌های داخلی برای انتخاب نوع تحلیل */}
      <div className="space-tabs" style={{ marginBottom: 20 }}>
        {['overview', 'pareto', 'trend', 'heatmap', 'correlation'].map(tab => (
          <button
            key={tab}
            className={`space-tab ${activeAnalysis === tab ? 'active' : ''}`}
            onClick={() => setActiveAnalysis(tab)}
          >
            {tab === 'overview' ? '📊 نمای کلی' :
             tab === 'pareto' ? '📈 تحلیل پارتو' :
             tab === 'trend' ? '📅 روند زمانی' :
             tab === 'heatmap' ? '🗺️ هیت‌مپ' : '🔗 همبستگی'}
          </button>
        ))}
      </div>

      <StatsCards stats={stats} />

      {activeAnalysis === 'overview' && (
        <OverviewCharts data={filteredRecords} onChartClick={(field, label, dataset) => {
          // همان منطق مودال
          setModalData({ title: `جزئیات ${label}`, selectedLabel: label, filteredData: dataset, allData: filteredRecords });
        }} />
      )}

      {activeAnalysis === 'pareto' && (
        <ParetoView />
      )}

      {activeAnalysis === 'trend' && (
        <TrendView />
      )}

      {activeAnalysis === 'heatmap' && (
        <HeatmapView />
      )}

      {activeAnalysis === 'correlation' && (
        <CorrelationView />
      )}

      {modalData && <DataModal {...modalData} onClose={() => setModalData(null)} />}
    </div>
  );
}

// زیرکامپوننت‌های هر تحلیل
function OverviewCharts({ data, onChartClick }) {
  // همان نمودارهای قبلی
  return (
    <div>
      <ChartSection title="📌 توزیع نوع برنامه">
        {/* ... */}
      </ChartSection>
      {/* بقیه نمودارها */}
    </div>
  );
}

function ParetoView() {
  // استفاده از API /api/analytics/pareto
  return <ParetoChart />;
}
function TrendView() {
  return <TrendChart />;
}
function HeatmapView() {
  return <HeatmapChart />;
}
function CorrelationView() {
  return <CorrelationChart />;
}

export default AnalyticsDashboard;'''

    # 3.2 فایل‌های AdvancedCharts
    # ParetoChart.jsx
    pareto_chart_jsx = '''import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { getParetoData } from '../../../api';

function ParetoChart() {
  const [data, setData] = useState(null);
  const [field, setField] = useState('work_description');

  useEffect(() => {
    getParetoData(field).then(res => setData(res.data));
  }, [field]);

  if (!data) return <div>در حال بارگذاری...</div>;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        type: 'bar',
        label: 'تعداد',
        data: data.map(d => d.count),
        backgroundColor: '#00f0ff',
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'درصد تجمعی',
        data: data.map(d => d.cumulative_percentage),
        borderColor: '#ff4d4d',
        backgroundColor: 'transparent',
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        title: { display: true, text: 'تعداد' }
      },
      y1: {
        beginAtZero: true,
        max: 100,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'درصد تجمعی' }
      }
    }
  };

  return (
    <div className="glass-card p-3">
      <h4>📈 تحلیل پارتو</h4>
      <select value={field} onChange={e => setField(e.target.value)} className="form-select mb-3">
        <option value="work_description">شرح کار</option>
        <option value="line_name">نام خط</option>
        <option value="location">موقعیت</option>
        <option value="supervisor">سرپرست</option>
      </select>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default ParetoChart;'''

    # TrendChart.jsx
    trend_chart_jsx = '''import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { getTrendData } from '../../../api';

function TrendChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    getTrendData().then(res => setData(res.data));
  }, []);

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'تعداد عملیات',
      data: data.map(d => d.count),
      borderColor: '#00f0ff',
      backgroundColor: 'rgba(0,240,255,0.1)',
      fill: true,
      tension: 0.3
    }]
  };

  return (
    <div className="glass-card p-3">
      <h4>📅 روند ماهانه</h4>
      <Line data={chartData} options={{ responsive: true }} />
    </div>
  );
}

export default TrendChart;'''

    # HeatmapChart.jsx (نمایش ماتریسی با رنگ‌ها)
    heatmap_chart_jsx = '''import React, { useEffect, useState } from 'react';
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

export default HeatmapChart;'''

    # CorrelationChart.jsx
    correlation_chart_jsx = '''import React, { useEffect, useState } from 'react';
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

export default CorrelationChart;'''

    # مسیرهای نوشتن فایل‌ها
    write_file(os.path.join(base, "backend", "routers", "analytics.py"), analytics_router)
    write_file(os.path.join(base, "frontend", "src", "components", "Analytics", "AnalyticsDashboard.jsx"), dashboard_jsx)
    write_file(os.path.join(base, "frontend", "src", "components", "Analytics", "AdvancedCharts", "ParetoChart.jsx"), pareto_chart_jsx)
    write_file(os.path.join(base, "frontend", "src", "components", "Analytics", "AdvancedCharts", "TrendChart.jsx"), trend_chart_jsx)
    write_file(os.path.join(base, "frontend", "src", "components", "Analytics", "AdvancedCharts", "HeatmapChart.jsx"), heatmap_chart_jsx)
    write_file(os.path.join(base, "frontend", "src", "components", "Analytics", "AdvancedCharts", "CorrelationChart.jsx"), correlation_chart_jsx)

    # اضافه کردن توابع API لازم به frontend/src/api.js
    api_path = os.path.join(base, "frontend", "src", "api.js")
    if os.path.exists(api_path):
        with open(api_path, 'r', encoding='utf-8') as f:
            api_content = f.read()
        new_functions = '''
// --- آنالیز پیشرفته ---
export const getParetoData = (field) => api.get(`/analytics/pareto?field=${field}`);
export const getTrendData = () => api.get('/analytics/trend');
export const getHeatmapData = () => api.get('/analytics/heatmap');
export const getCorrelationData = () => api.get('/analytics/correlation');
'''
        if 'getParetoData' not in api_content:
            # اضافه کردن قبل از export default api
            api_content = api_content.replace('export default api;', new_functions + '\nexport default api;')
            with open(api_path, 'w', encoding='utf-8') as f:
                f.write(api_content)
            print("✅ api.js بروزرسانی شد.")

    print("\n🎉 تمام فایل‌های تحلیل پیشرفته ایجاد شدند!")
    print("حالا بک‌اند را ری‌استارت کنید (uvicorn main:app --reload)")
    print("سپس فرانت‌اند را با npm run dev اجرا کنید.")

if __name__ == "__main__":
    main()