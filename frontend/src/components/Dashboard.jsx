import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import FilterPanel from './FilterPanel';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
);

/* ─── پالت ─── */
const P = [
  '#01696f','#1d6fa4','#7dc452','#d4804a',
  '#3d95a3','#b52a1e','#8a6200','#5a6475',
  '#0c4e54','#2e6b0e','#7a3610','#0f3638',
];
const PA = (a = 'cc') => P.map(c => c + a);

/* ─── shared tooltip ─── */
const TT = {
  rtl: true,
  backgroundColor: 'rgba(249,248,245,0.97)',
  titleColor: '#01696f', bodyColor: '#28251d',
  borderColor: '#d4d1ca', borderWidth: 1, padding: 10,
  titleFont: { family: 'Vazirmatn', weight: '700', size: 13 },
  bodyFont:  { family: 'Vazirmatn', size: 12 },
};

const LEG = (pos = 'bottom', maxItems = 999) => ({
  position: pos,
  labels: {
    padding: 12, boxWidth: 12, boxHeight: 12,
    font: { family: 'Vazirmatn', size: 11 }, color: '#5e5c57',
    filter: (item, chart) => item.index < maxItems,
  },
});

const AXIS = {
  ticks: { color: '#5e5c57', font: { family: 'Vazirmatn', size: 11 } },
  grid:  { color: 'rgba(40,37,29,0.07)' },
  border:{ color: '#dcd9d5' },
};

/* ─── helpers ─── */
const countBy = (arr, key, top = 999) => {
  const m = {};
  arr.forEach(r => { const v = r[key] || 'نامشخص'; m[v] = (m[v] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, top);
};

/* ==========================================================
   Dashboard
   ========================================================== */
function Dashboard({ records, filterOptions }) {
  const [filtered, setFiltered] = useState(records);

  const handleFilter = (filters) => {
    let r = [...records];
    if (filters.program_type)              r = r.filter(x => x.program_type === filters.program_type);
    if (filters.code)                      r = r.filter(x => x.code === filters.code);
    if (filters.voltage_level)             r = r.filter(x => x.voltage_level === filters.voltage_level);
    if (filters.location)                  r = r.filter(x => x.location === filters.location);
    if (filters.supervisor)                r = r.filter(x => x.supervisor === filters.supervisor);
    if (filters.line_names?.length)        r = r.filter(x => filters.line_names.includes(x.line_name));
    if (filters.work_descriptions?.length) r = r.filter(x => filters.work_descriptions.includes(x.work_description));
    const inRange = (rec, fy, fm, fd, ty, tm, td) => {
      if (!rec.execution_date) return false;
      const [y, m, d] = rec.execution_date.split('/').map(Number);
      if (fy && (y < +fy || (y === +fy && fm && (m < +fm || (m === +fm && fd && d < +fd))))) return false;
      if (ty && (y > +ty || (y === +ty && tm && (m > +tm || (m === +tm && td && d > +td))))) return false;
      return true;
    };
    if (filters.dateFromYear||filters.dateFromMonth||filters.dateFromDay||
        filters.dateToYear  ||filters.dateToMonth  ||filters.dateToDay) {
      r = r.filter(x => inRange(x,
        filters.dateFromYear,filters.dateFromMonth,filters.dateFromDay,
        filters.dateToYear,  filters.dateToMonth,  filters.dateToDay));
    }
    setFiltered(r);
  };
  const handleClear = () => setFiltered(records);

  /* ─── دیتا ─── */
  const D = useMemo(() => {
    const total      = filtered.length;
    const totalPers  = filtered.reduce((s,r) => s + (+r.personnel_count||0), 0);
    const totalTeams = filtered.reduce((s,r) => s + (+r.team_count||0), 0);
    const uniqueLines= [...new Set(filtered.map(r=>r.line_name).filter(Boolean))].length;
    const uniqueLocs = [...new Set(filtered.map(r=>r.location).filter(Boolean))].length;

    /* 1. Doughnut — نوع برنامه (top 8) */
    const pt = countBy(filtered,'program_type',8);
    const dProg = {
      labels: pt.map(e=>e[0]),
      datasets:[{ data:pt.map(e=>e[1]), backgroundColor:PA(), borderColor:P, borderWidth:2, hoverOffset:10 }],
    };

    /* 2. Doughnut — سطح ولتاژ */
    const vl = countBy(filtered,'voltage_level',8);
    const dVolt = {
      labels: vl.map(e=>e[0]),
      datasets:[{ data:vl.map(e=>e[1]), backgroundColor:PA(), borderColor:P, borderWidth:2, hoverOffset:10 }],
    };

    /* 3. Doughnut — سرپرست (top 8) */
    const sv = countBy(filtered,'supervisor',8);
    const dSupervisor = {
      labels: sv.map(e=>e[0]),
      datasets:[{ data:sv.map(e=>e[1]), backgroundColor:PA(), borderColor:P, borderWidth:2, hoverOffset:10 }],
    };

    /* 4. HBar — نوع کار (top 12, عریض بزرگ) */
    const wd = countBy(filtered,'work_description',12).reverse();
    const hbarWork = {
      labels: wd.map(e=>e[0]),
      datasets:[{
        label:'تعداد',
        data: wd.map(e=>e[1]),
        backgroundColor: wd.map((_,i)=>P[i%P.length]+'bb'),
        borderColor:     wd.map((_,i)=>P[i%P.length]),
        borderWidth:1.5, borderRadius:5, borderSkipped:false,
      }],
    };

    /* 5. HBar — top 10 خطوط */
    const ln = countBy(filtered,'line_name',10).reverse();
    const hbarLine = {
      labels: ln.map(e=>e[0]),
      datasets:[{
        label:'تعداد عملیات',
        data: ln.map(e=>e[1]),
        backgroundColor: P[0]+'bb', borderColor:P[0],
        borderWidth:1.5, borderRadius:5, borderSkipped:false,
        hoverBackgroundColor:P[1]+'cc',
      }],
    };

    /* 6. Bar — top 10 موقعیت */
    const loc = countBy(filtered,'location',10);
    const barLoc = {
      labels: loc.map(e=>e[0]),
      datasets:[{
        label:'تعداد',
        data: loc.map(e=>e[1]),
        backgroundColor: P[1]+'bb', borderColor:P[1],
        borderWidth:1.5, borderRadius:6, borderSkipped:false,
        hoverBackgroundColor:P[2]+'cc',
      }],
    };

    /* 7. Line — روند سالانه */
    const byYear={};
    filtered.forEach(r=>{
      if(!r.execution_date) return;
      const y=r.execution_date.split('/')[0];
      if(y&&y.length===4) byYear[y]=(byYear[y]||0)+1;
    });
    const years=Object.keys(byYear).sort();
    const lineTrend = {
      labels:years,
      datasets:[{
        label:'تعداد عملیات',
        data:years.map(y=>byYear[y]),
        borderColor:P[0], backgroundColor:P[0]+'22',
        borderWidth:2.5, fill:true, tension:0.38,
        pointRadius:5, pointHoverRadius:7,
        pointBackgroundColor:P[0], pointBorderColor:'#fff', pointBorderWidth:2,
      }],
    };

    /* 8. Line — روند ماهانه (آخرین ۲ سال) */
    const byMonth={};
    filtered.forEach(r=>{
      if(!r.execution_date) return;
      const parts=r.execution_date.split('/');
      if(parts.length<2) return;
      const key=`${parts[0]}/${parts[1].padStart(2,'0')}`;
      byMonth[key]=(byMonth[key]||0)+1;
    });
    const months=Object.keys(byMonth).sort().slice(-24);
    const lineMonthly = {
      labels:months,
      datasets:[{
        label:'تعداد عملیات (ماهانه)',
        data:months.map(m=>byMonth[m]),
        borderColor:P[1], backgroundColor:P[1]+'22',
        borderWidth:2.5, fill:true, tension:0.35,
        pointRadius:4, pointHoverRadius:6,
        pointBackgroundColor:P[1], pointBorderColor:'#fff', pointBorderWidth:2,
      }],
    };

    /* 9. Stacked Bar — نفرات + اکیپ به تفکیک خط (top 8) */
    const topLines=[...new Set(filtered.map(r=>r.line_name).filter(Boolean))]
      .map(l=>({l,cnt:filtered.filter(r=>r.line_name===l).length}))
      .sort((a,b)=>b.cnt-a.cnt).slice(0,8).map(x=>x.l);
    const stacked = {
      labels:topLines,
      datasets:[
        {
          label:'جمع نفرات', stack:'s',
          data:topLines.map(l=>filtered.filter(r=>r.line_name===l).reduce((s,r)=>s+(+r.personnel_count||0),0)),
          backgroundColor:P[0]+'cc', borderColor:P[0], borderWidth:1.5, borderRadius:4,
        },
        {
          label:'جمع اکیپ', stack:'s',
          data:topLines.map(l=>filtered.filter(r=>r.line_name===l).reduce((s,r)=>s+(+r.team_count||0),0)),
          backgroundColor:P[3]+'cc', borderColor:P[3], borderWidth:1.5, borderRadius:4,
        },
      ],
    };

    /* 10. Bar grouped — میانگین نفر و اکیپ به تفکیک سطح ولتاژ */
    const voltLevels=[...new Set(filtered.map(r=>r.voltage_level).filter(Boolean))];
    const grouped = {
      labels:voltLevels,
      datasets:[
        {
          label:'میانگین نفر',
          data:voltLevels.map(v=>{
            const sub=filtered.filter(r=>r.voltage_level===v);
            return sub.length ? +(sub.reduce((s,r)=>s+(+r.personnel_count||0),0)/sub.length).toFixed(1) : 0;
          }),
          backgroundColor:P[0]+'cc', borderColor:P[0], borderWidth:1.5, borderRadius:5,
        },
        {
          label:'میانگین اکیپ',
          data:voltLevels.map(v=>{
            const sub=filtered.filter(r=>r.voltage_level===v);
            return sub.length ? +(sub.reduce((s,r)=>s+(+r.team_count||0),0)/sub.length).toFixed(1) : 0;
          }),
          backgroundColor:P[1]+'cc', borderColor:P[1], borderWidth:1.5, borderRadius:5,
        },
      ],
    };

    return { total,totalPers,totalTeams,uniqueLines,uniqueLocs,
             dProg,dVolt,dSupervisor,hbarWork,hbarLine,barLoc,
             lineTrend,lineMonthly,stacked,grouped };
  }, [filtered]);

  /* ─── options ─── */
  const dOpts = (rightLeg=true) => ({
    responsive:true, maintainAspectRatio:false, cutout:'62%',
    animation:{duration:600},
    plugins:{ legend: rightLeg ? LEG('right',6) : LEG('bottom',6), tooltip:TT },
  });

  const hbarOpts = (showLeg=false) => ({
    responsive:true, maintainAspectRatio:false, indexAxis:'y',
    animation:{duration:500},
    plugins:{ legend:{display:showLeg,...(showLeg?LEG('bottom'):{})}, tooltip:TT },
    scales:{
      x:{...AXIS, beginAtZero:true, ticks:{...AXIS.ticks,precision:0}},
      y:{...AXIS, ticks:{...AXIS.ticks,autoSkip:false, font:{family:'Vazirmatn',size:11}}},
    },
  });

  const barOpts = (stacked=false, showLeg=false) => ({
    responsive:true, maintainAspectRatio:false,
    animation:{duration:500},
    plugins:{ legend: showLeg ? LEG('bottom') : {display:false}, tooltip:TT },
    scales:{
      x:{...AXIS, stacked, ticks:{...AXIS.ticks,maxRotation:30,autoSkip:true,maxTicksLimit:10}},
      y:{...AXIS, stacked, beginAtZero:true, ticks:{...AXIS.ticks,precision:0}},
    },
  });

  const lineOpts = {
    responsive:true, maintainAspectRatio:false, animation:{duration:700},
    plugins:{ legend:LEG('bottom'), tooltip:TT },
    scales:{
      x:{...AXIS, ticks:{...AXIS.ticks,maxRotation:30,autoSkip:true,maxTicksLimit:14}},
      y:{...AXIS, beginAtZero:true, ticks:{...AXIS.ticks,precision:0}},
    },
  };

  /* ─── کارت ─── */
  const Card = ({title,icon,children,size='normal'}) => (
    <div className={`db-chart-card ${
      size==='wide' ? 'db-chart-wide' :
      size==='half' ? 'db-chart-half' :
      size==='xwide'? 'db-chart-xwide' : ''
    }`}>
      <div className="db-chart-head">
        <span className="db-chart-icon">{icon}</span>
        <h4 className="db-chart-title">{title}</h4>
      </div>
      {children}
    </div>
  );

  return (
    <div className="db-root">
      <FilterPanel options={filterOptions} onFilter={handleFilter} onClear={handleClear} records={records} />

      {/* KPI */}
      <div className="db-kpi-row">
        {[
          {icon:'📄', val:D.total,       label:'جمع رکورد',          cls:'db-kpi-primary'},
          {icon:'⚡',  val:D.uniqueLines,  label:'خط منحصربهفرد',        cls:'db-kpi-info'},
          {icon:'📍', val:D.uniqueLocs,  label:'موقعیت منحصربهفرد',     cls:'db-kpi-success'},
          {icon:'👥', val:D.totalPers,   label:'جمع نفرات',            cls:'db-kpi-warning'},
          {icon:'🛠️', val:D.totalTeams,  label:'جمع اکیپ',             cls:'db-kpi-teams'},
        ].map(({icon,val,label,cls})=>(
          <div key={label} className={`db-kpi-card ${cls}`}>
            <span className="db-kpi-icon">{icon}</span>
            <div>
              <div className="db-kpi-val">{val.toLocaleString('fa-IR')}</div>
              <div className="db-kpi-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {D.total > 0 ? (
        <div className="db-charts-grid">

          {/* ردیف A: سه Doughnut کنار هم */}
          <Card title="توزیع نوع برنامه" icon="📋">
            <div className="db-chart-wrap"><Doughnut data={D.dProg} options={dOpts()} /></div>
          </Card>

          <Card title="توزیع سطح ولتاژ" icon="⚡">
            <div className="db-chart-wrap"><Doughnut data={D.dVolt} options={dOpts()} /></div>
          </Card>

          <Card title="توزیع سرپرستان (Top 8)" icon="👤">
            <div className="db-chart-wrap"><Doughnut data={D.dSupervisor} options={dOpts()} /></div>
          </Card>

          {/* ردیف B: نوع کار — عریض بزرگ با ارتفاع دینامیک */}
          <Card title="توزیع نوع کار (Top 12)" icon="🔧" size="wide">
            <div className="db-chart-wrap" style={{height: Math.max(260, D.hbarWork.labels.length * 34) + 'px'}}>
              <Bar data={D.hbarWork} options={hbarOpts(false)} />
            </div>
          </Card>

          {/* ردیف C: روند سالانه + ماهانه */}
          <Card title="روند سالانه عملیات" icon="📈" size="half">
            <div className="db-chart-wrap db-chart-wrap-md"><Line data={D.lineTrend} options={lineOpts} /></div>
          </Card>

          <Card title="روند ماهانه (24 ماه اخیر)" icon="📉" size="half">
            <div className="db-chart-wrap db-chart-wrap-md"><Line data={D.lineMonthly} options={lineOpts} /></div>
          </Card>

          {/* ردیف D: top خطوط + موقعیت */}
          <Card title="پرفعال‌ترین خطوط (Top 10)" icon="⚡" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.hbarLine} options={hbarOpts()} /></div>
          </Card>

          <Card title="توزیع موقعیت‌ها (Top 10)" icon="📍" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.barLoc} options={barOpts()} /></div>
          </Card>

          {/* ردیف E: stacked + grouped */}
          <Card title="نفرات و اکیپ به تفکیک خط (Top 8)" icon="👥" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.stacked} options={barOpts(true,true)} /></div>
          </Card>

          <Card title="میانگین نفر و اکیپ به تفکیک ولتاژ" icon="📊" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.grouped} options={barOpts(false,true)} /></div>
          </Card>

        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p>داده‌ای با فیلترهای انتخاب‌شده یافت نشد</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
