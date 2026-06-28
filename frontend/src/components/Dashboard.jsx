import React, { useState, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import FilterPanel from './FilterPanel';
import DashboardModal from './DashboardModal';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  RadialLinearScale, Filler,
);

const P = [
  '#01696f','#1d6fa4','#7dc452','#d4804a',
  '#3d95a3','#b52a1e','#8a6200','#5a6475',
  '#0c4e54','#2e6b0e','#7a3610','#0f3638',
];
const PA = (a='cc') => P.map(c=>c+a);

const TT = {
  rtl:true,
  backgroundColor:'rgba(249,248,245,0.97)',
  titleColor:'#01696f', bodyColor:'#28251d',
  borderColor:'#d4d1ca', borderWidth:1, padding:10,
  titleFont:{family:'Vazirmatn',weight:'700',size:13},
  bodyFont:{family:'Vazirmatn',size:12},
  callbacks:{ footer:()=>'👆 برای مشاهده جزئیات کلیک کنید' },
};
const TT_PLAIN = { ...TT, callbacks:{} };

const LEG = (pos='bottom') => ({
  position:pos,
  labels:{padding:12,boxWidth:12,boxHeight:12,font:{family:'Vazirmatn',size:11},color:'#5e5c57'},
});

const AXIS = {
  ticks:{color:'#5e5c57',font:{family:'Vazirmatn',size:11}},
  grid:{color:'rgba(40,37,29,0.07)'},
  border:{color:'#dcd9d5'},
};

const countBy = (arr, key, top=999) => {
  const m={};
  arr.forEach(r=>{ const v=r[key]||'نامشخص'; m[v]=(m[v]||0)+1; });
  return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,top);
};

const sumBy = (arr, groupKey, valKey, top=999) => {
  const m={};
  arr.forEach(r=>{ const k=r[groupKey]||'نامشخص'; m[k]=(m[k]||0)+(+r[valKey]||0); });
  return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,top);
};

const avgBy = (arr, groupKey, valKey) => {
  const m={}, cnt={};
  arr.forEach(r=>{ const k=r[groupKey]||'نامشخص'; m[k]=(m[k]||0)+(+r[valKey]||0); cnt[k]=(cnt[k]||0)+1; });
  return Object.keys(m).map(k=>([k, +(m[k]/cnt[k]).toFixed(1)]));
};

const Card = ({title,icon,children,size='normal',hint,section}) => (
  <div className={`db-chart-card${
    size==='wide'?' db-chart-wide':
    size==='half'?' db-chart-half':''
  }${section?' db-section-start':''}`}>
    <div className="db-chart-head">
      <span className="db-chart-icon">{icon}</span>
      <h4 className="db-chart-title">{title}</h4>
      {hint && <span className="db-chart-hint">{hint}</span>}
    </div>
    {children}
  </div>
);

const SectionTitle = ({title,icon}) => (
  <div className="db-section-label db-chart-wide">
    <span>{icon}</span> {title}
  </div>
);

function Dashboard({ records, filterOptions }) {
  const [filtered, setFiltered] = useState(records);
  const [modal, setModal] = useState(null);

  const handleFilter = (filters) => {
    let r = [...records];
    if (filters.program_type)              r=r.filter(x=>x.program_type===filters.program_type);
    if (filters.code)                      r=r.filter(x=>x.code===filters.code);
    if (filters.voltage_level)             r=r.filter(x=>x.voltage_level===filters.voltage_level);
    if (filters.location)                  r=r.filter(x=>x.location===filters.location);
    if (filters.supervisor)                r=r.filter(x=>x.supervisor===filters.supervisor);
    if (filters.line_names?.length)        r=r.filter(x=>filters.line_names.includes(x.line_name));
    if (filters.work_descriptions?.length) r=r.filter(x=>filters.work_descriptions.includes(x.work_description));
    const inRange=(rec,fy,fm,fd,ty,tm,td)=>{
      if(!rec.execution_date) return false;
      const [y,m,d]=rec.execution_date.split('/').map(Number);
      if(fy&&(y<+fy||(y===+fy&&fm&&(m<+fm||(m===+fm&&fd&&d<+fd))))) return false;
      if(ty&&(y>+ty||(y===+ty&&tm&&(m>+tm||(m===+tm&&td&&d>+td))))) return false;
      return true;
    };
    if(filters.dateFromYear||filters.dateFromMonth||filters.dateFromDay||
       filters.dateToYear  ||filters.dateToMonth  ||filters.dateToDay){
      r=r.filter(x=>inRange(x,
        filters.dateFromYear,filters.dateFromMonth,filters.dateFromDay,
        filters.dateToYear,  filters.dateToMonth,  filters.dateToDay));
    }
    setFiltered(r);
  };
  const handleClear = () => setFiltered(records);

  const openModal = useCallback((field, label) => {
    const rows = filtered.filter(r=>(r[field]||'نامشخص')===label);
    setModal({ field, label, rows });
  }, [filtered]);

  const onChartClick = useCallback((field, entries, labels) => {
    if (!entries||!entries.length) return;
    openModal(field, labels[entries[0].index]);
  }, [openModal]);

  const D = useMemo(() => {
    const total      = filtered.length;
    const totalPers  = filtered.reduce((s,r)=>s+(+r.personnel_count||0),0);
    const totalTeams = filtered.reduce((s,r)=>s+(+r.team_count||0),0);
    const totalQty   = filtered.reduce((s,r)=>s+(+r.quantity||0),0);
    const uniqueLines= [...new Set(filtered.map(r=>r.line_name).filter(Boolean))].length;
    const uniqueLocs = [...new Set(filtered.map(r=>r.location).filter(Boolean))].length;
    const uniqueSups = [...new Set(filtered.map(r=>r.supervisor).filter(Boolean))].length;
    const uniqueTowers=[...new Set(filtered.map(r=>r.tower_number).filter(Boolean))].length;
    const uniqueUnits= [...new Set(filtered.map(r=>r.unit).filter(Boolean))].length;

    /* ── A: توزیع کلی ── */
    const pt=countBy(filtered,'program_type',8);
    const dProg={labels:pt.map(e=>e[0]),datasets:[{data:pt.map(e=>e[1]),backgroundColor:PA(),borderColor:P,borderWidth:2,hoverOffset:10}]};
    const vl=countBy(filtered,'voltage_level',8);
    const dVolt={labels:vl.map(e=>e[0]),datasets:[{data:vl.map(e=>e[1]),backgroundColor:PA(),borderColor:P,borderWidth:2,hoverOffset:10}]};

    /* ── B: سرپرستان ── */
    const sv=countBy(filtered,'supervisor',20).reverse();
    const hbarSup={labels:sv.map(e=>e[0]),datasets:[{label:'تعداد عملیات',data:sv.map(e=>e[1]),
      backgroundColor:sv.map((_,i)=>P[i%P.length]+'bb'),borderColor:sv.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* ── C: روند زمانی ── */
    const byY={};
    filtered.forEach(r=>{ if(!r.execution_date)return; const y=r.execution_date.split('/')[0]; if(y&&y.length===4) byY[y]=(byY[y]||0)+1; });
    const years=Object.keys(byY).sort();
    const lineTrend={labels:years,datasets:[{label:'تعداد عملیات',data:years.map(y=>byY[y]),
      borderColor:P[0],backgroundColor:P[0]+'22',borderWidth:2.5,fill:true,tension:0.38,
      pointRadius:5,pointHoverRadius:7,pointBackgroundColor:P[0],pointBorderColor:'#fff',pointBorderWidth:2}]};

    const byM={};
    filtered.forEach(r=>{
      if(!r.execution_date)return;
      const p=r.execution_date.split('/'); if(p.length<2)return;
      const k=`${p[0]}/${p[1].padStart(2,'0')}`; byM[k]=(byM[k]||0)+1;
    });
    const mons=Object.keys(byM).sort().slice(-24);
    const lineMonthly={labels:mons,datasets:[{label:'تعداد عملیات',data:mons.map(m=>byM[m]),
      borderColor:P[1],backgroundColor:P[1]+'22',borderWidth:2.5,fill:true,tension:0.35,
      pointRadius:4,pointHoverRadius:6,pointBackgroundColor:P[1],pointBorderColor:'#fff',pointBorderWidth:2}]};

    /* روند نفرات در طول سال */
    const persByY={};
    filtered.forEach(r=>{ if(!r.execution_date)return; const y=r.execution_date.split('/')[0]; if(y&&y.length===4) persByY[y]=(persByY[y]||0)+(+r.personnel_count||0); });
    const linePersTrend={labels:Object.keys(persByY).sort(),datasets:[{label:'جمع نفرات',data:Object.keys(persByY).sort().map(y=>persByY[y]),
      borderColor:P[3],backgroundColor:P[3]+'22',borderWidth:2.5,fill:true,tension:0.38,
      pointRadius:5,pointHoverRadius:7,pointBackgroundColor:P[3],pointBorderColor:'#fff',pointBorderWidth:2}]};

    /* روند اکیپ در طول سال */
    const teamsByY={};
    filtered.forEach(r=>{ if(!r.execution_date)return; const y=r.execution_date.split('/')[0]; if(y&&y.length===4) teamsByY[y]=(teamsByY[y]||0)+(+r.team_count||0); });
    const lineTeamsTrend={labels:Object.keys(teamsByY).sort(),datasets:[{label:'جمع اکیپ',data:Object.keys(teamsByY).sort().map(y=>teamsByY[y]),
      borderColor:P[2],backgroundColor:P[2]+'22',borderWidth:2.5,fill:true,tension:0.38,
      pointRadius:5,pointHoverRadius:7,pointBackgroundColor:P[2],pointBorderColor:'#fff',pointBorderWidth:2}]};

    /* توزیع ماه اجرا (فارغ از سال) */
    const MNAMES=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    const mCount=Array(12).fill(0);
    filtered.forEach(r=>{ if(!r.execution_date)return; const p=r.execution_date.split('/'); if(p.length>=2){ const m=+p[1]-1; if(m>=0&&m<12) mCount[m]++; } });
    const barMonth={labels:MNAMES,datasets:[{label:'تعداد عملیات',data:mCount,
      backgroundColor:MNAMES.map((_,i)=>P[i%P.length]+'bb'),borderColor:MNAMES.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:6}]};

    /* ── D: نوع کار ── */
    const wd=countBy(filtered,'work_description',15).reverse();
    const hbarWork={labels:wd.map(e=>e[0]),datasets:[{label:'تعداد',data:wd.map(e=>e[1]),
      backgroundColor:wd.map((_,i)=>P[i%P.length]+'bb'),borderColor:wd.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* عنوان کار گرم top 12 */
    const tw=countBy(filtered.filter(r=>r.title_of_work),'title_of_work',12).reverse();
    const hbarTitle={labels:tw.map(e=>e[0]),datasets:[{label:'تعداد',data:tw.map(e=>e[1]),
      backgroundColor:tw.map((_,i)=>P[i%P.length]+'bb'),borderColor:tw.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* ── E: خطوط و موقعیت ── */
    const ln=countBy(filtered,'line_name',10).reverse();
    const hbarLine={labels:ln.map(e=>e[0]),datasets:[{label:'تعداد عملیات',data:ln.map(e=>e[1]),
      backgroundColor:P[0]+'bb',borderColor:P[0],borderWidth:1.5,borderRadius:5,borderSkipped:false}]};
    const loc=countBy(filtered,'location',10);
    const barLoc={labels:loc.map(e=>e[0]),datasets:[{label:'تعداد',data:loc.map(e=>e[1]),
      backgroundColor:P[1]+'bb',borderColor:P[1],borderWidth:1.5,borderRadius:6,borderSkipped:false}]};

    /* جمع نفرات به تفکیک خط top 10 */
    const persByLine=sumBy(filtered,'line_name','personnel_count',10).reverse();
    const hbarPersLine={labels:persByLine.map(e=>e[0]),datasets:[{label:'جمع نفرات',data:persByLine.map(e=>e[1]),
      backgroundColor:P[2]+'bb',borderColor:P[2],borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* جمع اکیپ به تفکیک خط top 10 */
    const teamsByLine=sumBy(filtered,'line_name','team_count',10).reverse();
    const hbarTeamsLine={labels:teamsByLine.map(e=>e[0]),datasets:[{label:'جمع اکیپ',data:teamsByLine.map(e=>e[1]),
      backgroundColor:P[3]+'bb',borderColor:P[3],borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* ── F: Stacked/Grouped ── */
    const topL=[...new Set(filtered.map(r=>r.line_name).filter(Boolean))]
      .map(l=>({l,cnt:filtered.filter(r=>r.line_name===l).length}))
      .sort((a,b)=>b.cnt-a.cnt).slice(0,8).map(x=>x.l);
    const stacked={labels:topL,datasets:[
      {label:'جمع نفرات',stack:'s',data:topL.map(l=>filtered.filter(r=>r.line_name===l).reduce((s,r)=>s+(+r.personnel_count||0),0)),backgroundColor:P[0]+'cc',borderColor:P[0],borderWidth:1.5,borderRadius:4},
      {label:'جمع اکیپ',stack:'s',data:topL.map(l=>filtered.filter(r=>r.line_name===l).reduce((s,r)=>s+(+r.team_count||0),0)),backgroundColor:P[3]+'cc',borderColor:P[3],borderWidth:1.5,borderRadius:4},
    ]};

    const vLevels=[...new Set(filtered.map(r=>r.voltage_level).filter(Boolean))];
    const grouped={labels:vLevels,datasets:[
      {label:'میانگین نفر',data:vLevels.map(v=>{ const s=filtered.filter(r=>r.voltage_level===v); return s.length?+(s.reduce((a,r)=>a+(+r.personnel_count||0),0)/s.length).toFixed(1):0; }),backgroundColor:P[0]+'cc',borderColor:P[0],borderWidth:1.5,borderRadius:5},
      {label:'میانگین اکیپ',data:vLevels.map(v=>{ const s=filtered.filter(r=>r.voltage_level===v); return s.length?+(s.reduce((a,r)=>a+(+r.team_count||0),0)/s.length).toFixed(1):0; }),backgroundColor:P[1]+'cc',borderColor:P[1],borderWidth:1.5,borderRadius:5},
    ]};

    const ptNames=[...new Set(filtered.map(r=>r.program_type).filter(Boolean))];
    const avgPT={labels:ptNames,datasets:[
      {label:'میانگین نفر',data:ptNames.map(p=>{ const s=filtered.filter(r=>r.program_type===p); return s.length?+(s.reduce((a,r)=>a+(+r.personnel_count||0),0)/s.length).toFixed(1):0; }),backgroundColor:P[2]+'cc',borderColor:P[2],borderWidth:1.5,borderRadius:5},
      {label:'میانگین اکیپ',data:ptNames.map(p=>{ const s=filtered.filter(r=>r.program_type===p); return s.length?+(s.reduce((a,r)=>a+(+r.team_count||0),0)/s.length).toFixed(1):0; }),backgroundColor:P[3]+'cc',borderColor:P[3],borderWidth:1.5,borderRadius:5},
    ]};

    /* ── G: دکل‌ها ── */
    const tw2=countBy(filtered.filter(r=>r.tower_number),'tower_number',15).reverse();
    const hbarTower={labels:tw2.map(e=>e[0]),datasets:[{label:'تعداد عملیات',data:tw2.map(e=>e[1]),
      backgroundColor:tw2.map((_,i)=>P[i%P.length]+'bb'),borderColor:tw2.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* توزیع عملیات به تفکیک نوع کار × نوع برنامه — stacked */
    const wdTop8=countBy(filtered,'work_description',8).map(e=>e[0]);
    const ptAll=[...new Set(filtered.map(r=>r.program_type).filter(Boolean))];
    const stackedWD={labels:wdTop8,datasets:ptAll.map((pt,i)=>({
      label:pt, stack:'s',
      data:wdTop8.map(w=>filtered.filter(r=>r.work_description===w&&r.program_type===pt).length),
      backgroundColor:P[i%P.length]+'cc',borderColor:P[i%P.length],borderWidth:1.5,borderRadius:3,
    }))};

    /* ── H: نفرات و اکیپ ── */
    /* توزیع مقادیر نفر (histogram ساده) */
    const persBuckets={1:0,2:0,3:0,4:0,5:0,'6-10':0,'+10':0};
    filtered.forEach(r=>{
      const v=+r.personnel_count||0;
      if(v<=0)return;
      if(v<=5) persBuckets[v]++;
      else if(v<=10) persBuckets['6-10']++;
      else persBuckets['+10']++;
    });
    const barPersDist={labels:Object.keys(persBuckets),datasets:[{label:'تعداد عملیات',data:Object.values(persBuckets),
      backgroundColor:P.slice(0,7).map(c=>c+'bb'),borderColor:P.slice(0,7),borderWidth:1.5,borderRadius:6}]};

    /* توزیع اکیپ */
    const teamBuckets={1:0,2:0,3:0,'+3':0};
    filtered.forEach(r=>{
      const v=+r.team_count||0;
      if(v<=0)return;
      if(v<=3) teamBuckets[v]++;
      else teamBuckets['+3']++;
    });
    const barTeamDist={labels:Object.keys(teamBuckets),datasets:[{label:'تعداد عملیات',data:Object.values(teamBuckets),
      backgroundColor:P.slice(2,6).map(c=>c+'bb'),borderColor:P.slice(2,6),borderWidth:1.5,borderRadius:6}]};

    /* نسبت نفر به اکیپ به تفکیک ولتاژ */
    const ratioVolt={labels:vLevels,datasets:[{label:'نسبت نفر/اکیپ',data:vLevels.map(v=>{
      const s=filtered.filter(r=>r.voltage_level===v&&(+r.team_count||0)>0);
      if(!s.length)return 0;
      const tp=s.reduce((a,r)=>a+(+r.personnel_count||0),0);
      const tt=s.reduce((a,r)=>a+(+r.team_count||0),0);
      return tt?+(tp/tt).toFixed(2):0;
    }),backgroundColor:vLevels.map((_,i)=>P[i%P.length]+'bb'),borderColor:vLevels.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:6}]};

    /* نسبت نفر به اکیپ به تفکیک سرپرست top 10 */
    const supTop10=countBy(filtered,'supervisor',10).map(e=>e[0]);
    const ratioSup={labels:supTop10,datasets:[{label:'نسبت نفر/اکیپ',data:supTop10.map(s=>{
      const rows=filtered.filter(r=>r.supervisor===s&&(+r.team_count||0)>0);
      if(!rows.length)return 0;
      const tp=rows.reduce((a,r)=>a+(+r.personnel_count||0),0);
      const tt=rows.reduce((a,r)=>a+(+r.team_count||0),0);
      return tt?+(tp/tt).toFixed(2):0;
    }),backgroundColor:supTop10.map((_,i)=>P[i%P.length]+'bb'),borderColor:supTop10.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* ── I: مقدار و واحد ── */
    const units=countBy(filtered.filter(r=>r.unit),'unit',10);
    const dUnit={labels:units.map(e=>e[0]),datasets:[{data:units.map(e=>e[1]),backgroundColor:PA(),borderColor:P,borderWidth:2,hoverOffset:10}]};

    /* جمع مقدار به تفکیک نوع کار top 10 */
    const qtyByWD=sumBy(filtered.filter(r=>r.quantity&&r.work_description),'work_description','quantity',10).reverse();
    const barQtyWD={labels:qtyByWD.map(e=>e[0]),datasets:[{label:'جمع مقدار',data:qtyByWD.map(e=>e[1]),
      backgroundColor:qtyByWD.map((_,i)=>P[i%P.length]+'bb'),borderColor:qtyByWD.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* جمع مقدار به تفکیک خط top 10 */
    const qtyByLine=sumBy(filtered.filter(r=>r.quantity&&r.line_name),'line_name','quantity',10).reverse();
    const barQtyLine={labels:qtyByLine.map(e=>e[0]),datasets:[{label:'جمع مقدار',data:qtyByLine.map(e=>e[1]),
      backgroundColor:P[4]+'bb',borderColor:P[4],borderWidth:1.5,borderRadius:5,borderSkipped:false}]};

    /* ── J: مقایسه سرد/گرم ── */
    const coldHot=countBy(filtered,'program_type');
    const coldHotByYear={};
    filtered.forEach(r=>{
      if(!r.execution_date)return;
      const y=r.execution_date.split('/')[0]; if(!y||y.length!==4)return;
      if(!coldHotByYear[y]) coldHotByYear[y]={};
      const pt=r.program_type||'نامشخص';
      coldHotByYear[y][pt]=(coldHotByYear[y][pt]||0)+1;
    });
    const chYears=Object.keys(coldHotByYear).sort();
    const ptAllTypes=[...new Set(filtered.map(r=>r.program_type).filter(Boolean))];
    const stackedCH={labels:chYears,datasets:ptAllTypes.map((p,i)=>({
      label:p,stack:'s',
      data:chYears.map(y=>(coldHotByYear[y]||{})[p]||0),
      backgroundColor:P[i%P.length]+'cc',borderColor:P[i%P.length],borderWidth:1.5,borderRadius:3,
    }))};

    /* ── K: PM vs اجرا ── */
    /* فاصله PM تا اجرا (تعداد ماه) histogram */
    const delays=[];
    filtered.forEach(r=>{
      if(!r.pm_date||!r.execution_date)return;
      const parse=s=>{ const p=s.split('/'); return p.length>=2?+p[0]*12+(+p[1]):null; };
      const pm=parse(r.pm_date), ex=parse(r.execution_date);
      if(pm!==null&&ex!==null){ const d=ex-pm; if(d>=0&&d<24) delays.push(d); }
    });
    const delayBuckets={};
    delays.forEach(d=>{ delayBuckets[d]=(delayBuckets[d]||0)+1; });
    const delayKeys=Object.keys(delayBuckets).map(Number).sort((a,b)=>a-b).map(String);
    const barDelay={labels:delayKeys.map(k=>k===0?'همان ماه':k+' ماه'),datasets:[{label:'تعداد',data:delayKeys.map(k=>delayBuckets[k]),
      backgroundColor:delayKeys.map((_,i)=>P[i%P.length]+'bb'),borderColor:delayKeys.map((_,i)=>P[i%P.length]),borderWidth:1.5,borderRadius:5}]};

    /* ── L: سرپرست × نوع کار heatmap style (grouped) ── */
    const sup5=countBy(filtered,'supervisor',5).map(e=>e[0]);
    const wd5=countBy(filtered,'work_description',5).map(e=>e[0]);
    const supXWD={labels:sup5,datasets:wd5.map((w,i)=>({
      label:w,
      data:sup5.map(s=>filtered.filter(r=>r.supervisor===s&&r.work_description===w).length),
      backgroundColor:P[i%P.length]+'cc',borderColor:P[i%P.length],borderWidth:1.5,borderRadius:4,
    }))};

    /* ── M: خطوط × ولتاژ (stacked) ── */
    const ln6=countBy(filtered,'line_name',6).map(e=>e[0]);
    const stackedLineVolt={labels:ln6,datasets:vLevels.map((v,i)=>({
      label:v,stack:'s',
      data:ln6.map(l=>filtered.filter(r=>r.line_name===l&&r.voltage_level===v).length),
      backgroundColor:P[i%P.length]+'cc',borderColor:P[i%P.length],borderWidth:1.5,borderRadius:3,
    }))};

    return {
      total,totalPers,totalTeams,totalQty,uniqueLines,uniqueLocs,uniqueSups,uniqueTowers,uniqueUnits,
      dProg,dVolt,hbarSup,lineTrend,lineMonthly,linePersTrend,lineTeamsTrend,barMonth,
      hbarWork,hbarTitle,hbarLine,barLoc,hbarPersLine,hbarTeamsLine,
      stacked,grouped,avgPT,hbarTower,stackedWD,
      barPersDist,barTeamDist,ratioVolt,ratioSup,
      dUnit,barQtyWD,barQtyLine,
      stackedCH,barDelay,supXWD,stackedLineVolt,
      /* labels */
      svLabels:sv.map(e=>e[0]), ptLabels:pt.map(e=>e[0]), vlLabels:vl.map(e=>e[0]),
      lnLabels:ln.map(e=>e[0]), locLabels:loc.map(e=>e[0]), wdLabels:wd.map(e=>e[0]),
      topLLabels:topL, vLevelLabels:vLevels, ptNamesLabels:ptNames,
      tw2Labels:tw2.map(e=>e[0]), unitLabels:units.map(e=>e[0]),
      persByLineLabels:persByLine.map(e=>e[0]), teamsByLineLabels:teamsByLine.map(e=>e[0]),
      qtyByWDLabels:qtyByWD.map(e=>e[0]), qtyByLineLabels:qtyByLine.map(e=>e[0]),
      twLabels:tw.map(e=>e[0]), supTop10,
      hasDelay:delayKeys.length>0, hasTitleWork:tw.length>0, hasUnit:units.length>0, hasQty:qtyByWD.length>0,
    };
  }, [filtered]);

  /* ── options factories ── */
  const dOpts = (field, labels) => ({
    responsive:true, maintainAspectRatio:false, cutout:'62%', animation:{duration:600},
    plugins:{legend:LEG('bottom'), tooltip:TT},
    onClick:(_,els)=>onChartClick(field,els,labels),
  });
  const hbarOpts = (field, labels, showLeg=false) => ({
    responsive:true, maintainAspectRatio:false, indexAxis:'y', animation:{duration:500},
    plugins:{legend:showLeg?LEG('bottom'):{display:false}, tooltip:TT},
    onClick:(_,els)=>onChartClick(field,els,labels),
    scales:{
      x:{...AXIS,beginAtZero:true,ticks:{...AXIS.ticks,precision:0}},
      y:{...AXIS,ticks:{...AXIS.ticks,autoSkip:false,font:{family:'Vazirmatn',size:11}}},
    },
  });
  const barOpts = (field, labels, stacked=false, showLeg=false) => ({
    responsive:true, maintainAspectRatio:false, animation:{duration:500},
    plugins:{legend:showLeg?LEG('bottom'):{display:false}, tooltip:TT},
    onClick:(_,els)=>onChartClick(field,els,labels),
    scales:{
      x:{...AXIS,stacked,ticks:{...AXIS.ticks,maxRotation:30,autoSkip:true,maxTicksLimit:10}},
      y:{...AXIS,stacked,beginAtZero:true,ticks:{...AXIS.ticks,precision:0}},
    },
  });
  const barOptsNoClick = (stacked=false, showLeg=false) => ({
    responsive:true, maintainAspectRatio:false, animation:{duration:500},
    plugins:{legend:showLeg?LEG('bottom'):{display:false}, tooltip:TT_PLAIN},
    scales:{
      x:{...AXIS,stacked,ticks:{...AXIS.ticks,maxRotation:30,autoSkip:true,maxTicksLimit:12}},
      y:{...AXIS,stacked,beginAtZero:true,ticks:{...AXIS.ticks,precision:0}},
    },
  });
  const lineOpts = {
    responsive:true, maintainAspectRatio:false, animation:{duration:700},
    plugins:{legend:LEG('bottom'), tooltip:TT_PLAIN},
    scales:{
      x:{...AXIS,ticks:{...AXIS.ticks,maxRotation:30,autoSkip:true,maxTicksLimit:14}},
      y:{...AXIS,beginAtZero:true,ticks:{...AXIS.ticks,precision:0}},
    },
  };

  const dynH = (n, rowH=32, min=240) => Math.max(min, n*rowH)+'px';

  return (
    <div className="db-root">
      <FilterPanel options={filterOptions} onFilter={handleFilter} onClear={handleClear} records={records} />

      {/* KPI */}
      <div className="db-kpi-row">
        {[
          {icon:'📄',val:D.total,        label:'جمع رکورد',            cls:'db-kpi-primary'},
          {icon:'⚡', val:D.uniqueLines,  label:'خط منحصربهفرد',        cls:'db-kpi-info'},
          {icon:'📍',val:D.uniqueLocs,   label:'موقعیت منحصربهفرد',    cls:'db-kpi-success'},
          {icon:'👥',val:D.totalPers,    label:'جمع نفرات',            cls:'db-kpi-warning'},
          {icon:'🛠️',val:D.totalTeams,   label:'جمع اکیپ',             cls:'db-kpi-teams'},
          {icon:'👤',val:D.uniqueSups,   label:'سرپرست منحصربهفرد',    cls:'db-kpi-sups'},
          {icon:'🗳️',val:D.uniqueTowers, label:'دکل منحصربهفرد',     cls:'db-kpi-info'},
          {icon:'📦',val:D.totalQty,     label:'جمع مقدار',            cls:'db-kpi-primary'},
        ].map(({icon,val,label,cls})=>(
          <div key={label} className={`db-kpi-card ${cls}`}>
            <span className="db-kpi-icon">{icon}</span>
            <div><div className="db-kpi-val">{(+val||0).toLocaleString('fa-IR')}</div><div className="db-kpi-label">{label}</div></div>
          </div>
        ))}
      </div>

      {D.total > 0 ? (
        <div className="db-charts-grid">

          {/* ════ بخش ۱: توزیع کلی ════ */}
          <SectionTitle title="توزیع کلی عملیات" icon="📊" />

          <Card title="توزیع‌های کلی" icon="🧩" size="wide" hint="کلیک‌پذیر">
            <div className="db-duo-grid">
              <div><p className="db-duo-label">📋 نوع برنامه</p><div className="db-chart-wrap"><Doughnut data={D.dProg} options={dOpts('program_type',D.ptLabels)} /></div></div>
              <div><p className="db-duo-label">⚡ سطح ولتاژ</p><div className="db-chart-wrap"><Doughnut data={D.dVolt} options={dOpts('voltage_level',D.vlLabels)} /></div></div>
            </div>
          </Card>

          <Card title="توزیع عملیات به تفکیک ماه" icon="📆" size="wide" hint="">
            <div className="db-chart-wrap db-chart-wrap-md"><Bar data={D.barMonth} options={barOptsNoClick()} /></div>
          </Card>

          <Card title="نوع کار در برابر نوع برنامه (Top 8)" icon="🔀" size="wide">
            <div className="db-chart-wrap" style={{height:dynH(D.hbarWork.labels.length,28,240)}}>
              <Bar data={D.stackedWD} options={barOptsNoClick(true,true)} />
            </div>
          </Card>

          {/* ════ بخش ۲: روند زمانی ════ */}
          <SectionTitle title="روند زمانی" icon="📈" />

          <Card title="روند سالانه تعداد عملیات" icon="📈" size="half">
            <div className="db-chart-wrap db-chart-wrap-md"><Line data={D.lineTrend} options={lineOpts} /></div>
          </Card>
          <Card title="روند ماهانه (24 ماه اخیر)" icon="📉" size="half">
            <div className="db-chart-wrap db-chart-wrap-md"><Line data={D.lineMonthly} options={lineOpts} /></div>
          </Card>
          <Card title="روند سالانه جمع نفرات" icon="👥" size="half">
            <div className="db-chart-wrap db-chart-wrap-md"><Line data={D.linePersTrend} options={lineOpts} /></div>
          </Card>
          <Card title="روند سالانه جمع اکیپ" icon="🛠️" size="half">
            <div className="db-chart-wrap db-chart-wrap-md"><Line data={D.lineTeamsTrend} options={lineOpts} /></div>
          </Card>

          <Card title="سرد و گرم به تفکیک سال (Stacked)" icon="🔥" size="wide">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.stackedCH} options={barOptsNoClick(true,true)} /></div>
          </Card>

          {/* ════ بخش ۳: سرپرستان ════ */}
          <SectionTitle title="سرپرستان" icon="👤" />

          <Card title="پرفعال‌ترین سرپرستان (Top 20)" icon="👤" size="wide" hint="کلیک‌پذیر">
            <div className="db-chart-wrap" style={{height:dynH(D.hbarSup.labels.length,32)}}>
              <Bar data={D.hbarSup} options={hbarOpts('supervisor',D.svLabels)} />
            </div>
          </Card>

          <Card title="نسبت نفر به اکیپ به تفکیک سرپرست (Top 10)" icon="⚖️" size="wide">
            <div className="db-chart-wrap" style={{height:dynH(D.supTop10.length,32)}}>
              <Bar data={D.ratioSup} options={hbarOpts('supervisor',D.supTop10)} />
            </div>
          </Card>

          <Card title="سرپرست × نوع کار (Top 5×5)" icon="🗓️" size="wide">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.supXWD} options={barOptsNoClick(false,true)} /></div>
          </Card>

          {/* ════ بخش ۴: خطوط و موقعیت ════ */}
          <SectionTitle title="خطوط و موقعیت" icon="⚡" />

          <Card title="پرفعال‌ترین خطوط (Top 10)" icon="⚡" size="half" hint="کلیک‌پذیر">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.hbarLine} options={hbarOpts('line_name',D.lnLabels)} /></div>
          </Card>
          <Card title="توزیع موقعیت‌ها (Top 10)" icon="📍" size="half" hint="کلیک‌پذیر">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.barLoc} options={barOpts('location',D.locLabels)} /></div>
          </Card>

          <Card title="جمع نفرات به تفکیک خط (Top 10)" icon="👥" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.hbarPersLine} options={hbarOpts('line_name',D.persByLineLabels)} /></div>
          </Card>
          <Card title="جمع اکیپ به تفکیک خط (Top 10)" icon="🛠️" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.hbarTeamsLine} options={hbarOpts('line_name',D.teamsByLineLabels)} /></div>
          </Card>

          <Card title="نفرات و اکیپ به تفکیک خط - Stacked (Top 8)" icon="📊" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.stacked} options={barOpts('line_name',D.topLLabels,true,true)} /></div>
          </Card>
          <Card title="خط × سطح ولتاژ - Stacked (Top 6)" icon="⚡" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.stackedLineVolt} options={barOptsNoClick(true,true)} /></div>
          </Card>

          {/* ════ بخش ۵: نوع کار و دکل ════ */}
          <SectionTitle title="نوع کار و دکل‌ها" icon="🔧" />

          <Card title="توزیع نوع کار (Top 15)" icon="🔧" size="wide" hint="کلیک‌پذیر">
            <div className="db-chart-wrap" style={{height:dynH(D.hbarWork.labels.length,34)}}>
              <Bar data={D.hbarWork} options={hbarOpts('work_description',D.wdLabels)} />
            </div>
          </Card>

          {D.hasTitleWork && (
            <Card title="عنوان کار گرم (Top 12)" icon="🔥" size="wide">
              <div className="db-chart-wrap" style={{height:dynH(D.hbarTitle.labels.length,34)}}>
                <Bar data={D.hbarTitle} options={hbarOpts('title_of_work',D.twLabels)} />
              </div>
            </Card>
          )}

          <Card title="پرفعال‌ترین دکل‌ها (Top 15)" icon="🗳️" size="wide" hint="کلیک‌پذیر">
            <div className="db-chart-wrap" style={{height:dynH(D.hbarTower.labels.length,32)}}>
              <Bar data={D.hbarTower} options={hbarOpts('tower_number',D.tw2Labels)} />
            </div>
          </Card>

          {/* ════ بخش ۶: نفرات، اکیپ و ولتاژ ════ */}
          <SectionTitle title="تحلیل نفرات و اکیپ" icon="👥" />

          <Card title="توزیع تعداد نفر در عملیات" icon="👥" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.barPersDist} options={barOptsNoClick()} /></div>
          </Card>
          <Card title="توزیع تعداد اکیپ در عملیات" icon="🛠️" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.barTeamDist} options={barOptsNoClick()} /></div>
          </Card>

          <Card title="میانگین نفر و اکیپ به تفکیک ولتاژ" icon="📊" size="half" hint="کلیک‌پذیر">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.grouped} options={barOpts('voltage_level',D.vLevelLabels,false,true)} /></div>
          </Card>
          <Card title="نسبت نفر/اکیپ به تفکیک ولتاژ" icon="⚖️" size="half">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.ratioVolt} options={barOptsNoClick()} /></div>
          </Card>

          <Card title="میانگین نفر و اکیپ به تفکیک نوع برنامه" icon="📋" size="wide" hint="کلیک‌پذیر">
            <div className="db-chart-wrap db-chart-wrap-tall"><Bar data={D.avgPT} options={barOpts('program_type',D.ptNamesLabels,false,true)} /></div>
          </Card>

          {/* ════ بخش ۷: مقدار و واحد ════ */}
          {(D.hasUnit || D.hasQty) && (
            <>
              <SectionTitle title="مقدار و واحد" icon="📦" />
              {D.hasUnit && (
                <Card title="توزیع واحدها" icon="🎷" size="half">
                  <div className="db-chart-wrap"><Doughnut data={D.dUnit} options={{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:LEG('right'),tooltip:TT_PLAIN}}} /></div>
                </Card>
              )}
              {D.hasQty && (
                <>
                  <Card title="جمع مقدار به تفکیک نوع کار (Top 10)" icon="📏" size={D.hasUnit?'half':'wide'}>
                    <div className="db-chart-wrap" style={{height:dynH(D.barQtyWD.labels.length,32)}}>
                      <Bar data={D.barQtyWD} options={hbarOpts('work_description',D.qtyByWDLabels)} />
                    </div>
                  </Card>
                  <Card title="جمع مقدار به تفکیک خط (Top 10)" icon="⚡" size="wide">
                    <div className="db-chart-wrap" style={{height:dynH(D.barQtyLine.labels.length,32)}}>
                      <Bar data={D.barQtyLine} options={hbarOpts('line_name',D.qtyByLineLabels)} />
                    </div>
                  </Card>
                </>
              )}
            </>
          )}

          {/* ════ بخش ۸: PM vs اجرا ════ */}
          {D.hasDelay && (
            <>
              <SectionTitle title="فاصله PM تا اجرا" icon="🗓️" />
              <Card title="توزیع فاصله PM تا اجرا (ماه)" icon="⏱️" size="wide">
                <div className="db-chart-wrap db-chart-wrap-md"><Bar data={D.barDelay} options={barOptsNoClick()} /></div>
              </Card>
            </>
          )}

        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p>داده‌ای با فیلترهای انتخاب‌شده یافت نشد</p>
        </div>
      )}

      {modal && <DashboardModal field={modal.field} label={modal.label} rows={modal.rows} onClose={()=>setModal(null)} />}
    </div>
  );
}

export default Dashboard;
