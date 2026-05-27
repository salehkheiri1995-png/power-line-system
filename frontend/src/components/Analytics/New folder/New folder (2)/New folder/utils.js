export const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const COLORS = [
  '#00f0ff', '#ff4d4d', '#b366ff', '#ffaa00',
  '#00e676', '#ff4081', '#69f0ae', '#40c4ff',
  '#ff9f40', '#c9cbcf'
];

export function calcStats(data) {
  let total = data.length, cold = 0, warm = 0, totalTowers = 0;
  const unitQuantities = {}, locationCounts = {}, lineCounts = {};
  data.forEach(r => {
    if (r.program_type === 'سرد') cold++; else if (r.program_type === 'گرم') warm++;
    const towers = (r.tower_number || '').split('-').filter(Boolean);
    totalTowers += towers.length;

    const u = r.unit || 'عدد';
    unitQuantities[u] = (unitQuantities[u] || 0) + (parseFloat(r.quantity) || 0);

    const loc = r.location || 'نامشخص';
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;

    const line = r.line_name || 'نامشخص';
    lineCounts[line] = (lineCounts[line] || 0) + 1;
  });
  return {
    total, cold, warm, totalTowers,
    avgTowers: total ? (totalTowers / total).toFixed(2) : 0,
    unitQuantities, locationCounts, lineCounts
  };
}

// محاسبات روند ماهانه
export function calcMonthlyTrends(data) {
  const monthly = {};
  data.forEach(r => {
    const d = r.execution_date || '';
    const m = d.substring(5, 7);
    if (m) {
      const key = persianMonths[parseInt(m)-1] || m;
      monthly[key] = (monthly[key] || 0) + 1;
    }
  });
  return monthly;
}

// تحلیل خرابی - پرتکرارترین خطوط
export function calcTopFailureLines(data) {
  const lines = {};
  data.forEach(r => {
    const l = r.line_name || 'نامشخص';
    lines[l] = (lines[l] || 0) + 1;
  });
  return Object.entries(lines).sort((a,b)=>b[1]-a[1]).slice(0,10);
}

// تحلیل کارایی - تعداد کار به ازای هر سرپرست
export function calcSupervisorWorkload(data) {
  const supervisors = {};
  data.forEach(r => {
    const s = r.supervisor || 'نامشخص';
    if (!supervisors[s]) supervisors[s] = { total: 0, teams: 0 };
    supervisors[s].total++;
    supervisors[s].teams += parseFloat(r.team_count) || 0;
  });
  return Object.entries(supervisors).sort((a,b)=>b[1].total-a[1].total).slice(0,10);
}

// فیلترها (از داشبورد اصلی)
export function applyFilters(records, filters) {
  if (!filters || Object.keys(filters).length === 0) return records;
  let result = [...records];
  // ... همان منطق فیلتر (نوع برنامه، کد، ولتاژ، موقعیت، سرپرست، نام خطوط و غیره)
  return result;
}