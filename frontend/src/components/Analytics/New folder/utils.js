
export const persianMonths = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند'
];

export function calcStats(data) {
  let total = data.length, cold = 0, warm = 0, totalTowers = 0;
  const unitQuantities = {};
  data.forEach(r => {
    if (r.program_type === 'سرد') cold++; else if (r.program_type === 'گرم') warm++;
    const towers = (r.tower_number || '').split('-').filter(Boolean);
    totalTowers += towers.length;
    const u = r.unit || 'عدد';
    unitQuantities[u] = (unitQuantities[u] || 0) + (parseFloat(r.quantity) || 0);
  });
  return { total, cold, warm, totalTowers, avgTowers: total ? totalTowers/total : 0, unitQuantities };
}

export function aggregateData(data, field, aggregate) {
  const counts = {};
  data.forEach(r => {
    let key = r[field];
    if (field === 'month') {
      const m = (r.execution_date || '').substring(5,7);
      key = persianMonths[parseInt(m)-1] || m;
    }
    if (!key) key = 'نامشخص';
    if (aggregate === 'quantity') {
      counts[key] = (counts[key] || 0) + (parseFloat(r.quantity) || 0);
    } else {
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  return counts;
}
