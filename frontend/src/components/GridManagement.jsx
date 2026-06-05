import React, { useEffect, useState, useCallback } from 'react';
import './GridManagement.css';
import {
  getGridLines, createGridLine, updateGridLine, deleteGridLine,
  getGridTowers, createGridTower, updateGridTower, deleteGridTower,
  getInsulators, createInsulator, updateInsulator, deleteInsulator,
  getConductors, createConductor, updateConductor, deleteConductor,
  getFittings, createFitting, updateFitting, deleteFitting,
  getGroundings, createGrounding, updateGrounding, deleteGrounding,
  getSpans, createSpan, updateSpan, deleteSpan,
  getInspections, createInspection, updateInspection, deleteInspection,
} from '../api';

// ─────────────── helpers ───────────────
const fmt = (v) => (v === null || v === undefined || v === '') ? '—' : v;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : '—';
const voltColor = (v) => v >= 400 ? '#f87171' : v >= 230 ? '#fb923c' : v >= 132 ? '#facc15' : '#60a5fa';
const statusBadge = (s) => {
  const map = { InService: 'active', OutOfService: 'inactive', UnderConstruction: 'construction' };
  const label = { InService: 'در سرویس', OutOfService: 'خارج از سرویس', UnderConstruction: 'در دست ساخت' };
  return <span className={`badge badge-${map[s] || 'active'}`}>{label[s] || s || '—'}</span>;
};
const inspOverdue = (d) => {
  if (!d) return true;
  return (Date.now() - new Date(d)) > 2 * 365 * 24 * 3600 * 1000;
};

// ─────────────── default empties ───────────────
const E_LINE = { id: '', name: '', voltage: 0, voltage_level: null, current_type: 'AC', total_length_km: null, line_type: 'Overhead', number_of_circuits: 1, source_substation: '', destination_substation: '', commissioning_date: '', line_status: 'InService', max_transfer_mw: null, rated_current_a: null, geo_path: '' };
const E_TOWER = { id: '', line_id: '', number: '', tower_code: '', tower_type: 'Suspension', material: 'LatticeSteel', height_meters: null, arm_width_meters: null, latitude: null, longitude: null, altitude_meters: null, foundation_type: 'Pad', anti_climbing_device: false, warning_sign: false, bird_nest_status: 'None', grounding_resistance_ohm: null, grounding_rod_count: null };
const E_INS = { tower_id: '', phase_position: '', insulator_type: 'Suspension', material: 'Glass', number_of_discs: null, mechanical_class_kn: null, condition: 'Clean', installation_date: '' };
const E_COND = { tower_id: '', phase_number: 1, conductor_type: 'ACSR', cross_section_mm2: null, strand_count: null, tension_kgf: null, sag_mm: null, clamp_type: 'SuspensionClamp' };
const E_FIT = { tower_id: '', fitting_type: 'VibrationDamper', subtype: '', quantity: 1, installation_date: '', condition: 'Tight' };
const E_GND = { tower_id: '', resistance_ohm: null, electrode_type: 'CopperRod', number_of_electrodes: 1, test_date: '', next_test_due_date: '' };
const E_SPAN = { line_id: '', from_tower_id: '', to_tower_id: '', span_length_meters: null, terrain_type: '', min_ground_clearance_meters: null, mid_span_damper_count: 0 };
const E_INSP = { tower_id: '', line_id: '', inspection_date: '', inspection_type: 'Ground', inspector_name: '', defects_found: '', action_taken: '', next_inspection_date: '' };

// ─────────────── Modal ───────────────
function Modal({ title, onClose, onSave, saving, children }) {
  return (
    <div className="gm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gm-modal">
        <div className="gm-modal-header">
          <span className="gm-modal-title">{title}</span>
          <button className="gm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gm-modal-body">{children}</div>
        <div className="gm-modal-footer">
          <button className="gm-btn gm-btn-ghost" onClick={onClose}>انصراف</button>
          <button className="gm-btn gm-btn-primary" onClick={onSave} disabled={saving}>
            {saving ? <span className="gm-spinner" /> : '💾'} ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────── FormField ───────────────
const F = ({ label, required, children, span2 }) => (
  <div className={`gm-form-group${span2 ? ' span-2' : ''}`}>
    <label className="gm-form-label">{required && <span className="req">*</span>}{label}</label>
    {children}
  </div>
);
const Inp = ({ value, onChange, type = 'text', placeholder, min, step }) => (
  <input className="gm-input" type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min} step={step} />
);
const Sel = ({ value, onChange, options }) => (
  <select className="gm-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);
const SectionLabel = ({ children }) => <div className="gm-section-label">{children}</div>;

// ─────────────── GPS field ───────────────
function GpsField({ lat, lng, onLat, onLng }) {
  const getGPS = () => {
    if (!navigator.geolocation) return alert('مرورگر شما GPS ندارد');
    navigator.geolocation.getCurrentPosition(
      (p) => { onLat(p.coords.latitude); onLng(p.coords.longitude); },
      () => alert('خطا در دریافت موقعیت')
    );
  };
  return (
    <>
      <F label="عرض جغرافیایی (Latitude)">
        <div className="gm-gps-row">
          <Inp value={lat} onChange={onLat} type="number" step="0.000001" placeholder="35.123456" />
          <button type="button" className="gm-gps-btn" onClick={getGPS} title="دریافت موقعیت فعلی">📍 GPS</button>
        </div>
      </F>
      <F label="طول جغرافیایی (Longitude)">
        <Inp value={lng} onChange={onLng} type="number" step="0.000001" placeholder="46.123456" />
      </F>
      {lat && lng && (
        <div className="gm-gps-preview span-2" style={{ gridColumn: 'span 2' }}>
          📌 موقعیت: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          &nbsp;&nbsp;
          <a href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>🗺 نمایش در نقشه</a>
        </div>
      )}
    </>
  );
}

// ─────────────── Line Form ───────────────
function LineForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <div className="gm-form-grid">
      <SectionLabel>اطلاعات پایه</SectionLabel>
      <F label="شناسه خط" required><Inp value={data.id} onChange={s('id')} placeholder="L01" /></F>
      <F label="نام خط" required><Inp value={data.name} onChange={s('name')} placeholder="خط تبریز–مراغه" /></F>
      <F label="سطح ولتاژ (kV)">
        <Sel value={data.voltage_level} onChange={(v) => onChange({ ...data, voltage_level: +v, voltage: +v })} options={[['','انتخاب'],['63','63'],['132','132'],['230','230'],['400','400'],['765','765']]} />
      </F>
      <F label="نوع جریان">
        <Sel value={data.current_type} onChange={s('current_type')} options={[['AC','AC'],['DC','DC']]} />
      </F>
      <F label="طول کل (km)"><Inp value={data.total_length_km} onChange={(v) => s('total_length_km')(v ? +v : null)} type="number" step="0.1" /></F>
      <F label="نوع خط">
        <Sel value={data.line_type} onChange={s('line_type')} options={[['Overhead','هوایی'],['Cable','کابل زمینی']]} />
      </F>
      <F label="تعداد مدار">
        <Sel value={data.number_of_circuits} onChange={(v) => s('number_of_circuits')(+v)} options={[['1','یک مداره'],['2','دو مداره']]} />
      </F>
      <F label="وضعیت خط">
        <Sel value={data.line_status} onChange={s('line_status')} options={[['InService','در سرویس'],['OutOfService','خارج از سرویس'],['UnderConstruction','در دست ساخت']]} />
      </F>
      <SectionLabel>پست‌های انتهایی</SectionLabel>
      <F label="پست مبدأ"><Inp value={data.source_substation} onChange={s('source_substation')} placeholder="پست تبریز ۴۰۰" /></F>
      <F label="پست مقصد"><Inp value={data.destination_substation} onChange={s('destination_substation')} placeholder="پست مراغه" /></F>
      <F label="تاریخ بهره‌برداری"><Inp value={data.commissioning_date} onChange={s('commissioning_date')} type="date" /></F>
      <F label="آخرین تاریخ بازرسی"><Inp value={data.last_inspection_date} onChange={s('last_inspection_date')} type="date" /></F>
      <SectionLabel>ظرفیت</SectionLabel>
      <F label="حداکثر انتقال (MW)"><Inp value={data.max_transfer_mw} onChange={(v) => s('max_transfer_mw')(v ? +v : null)} type="number" /></F>
      <F label="جریان نامی (A)"><Inp value={data.rated_current_a} onChange={(v) => s('rated_current_a')(v ? +v : null)} type="number" /></F>
    </div>
  );
}

// ─────────────── Tower Form ───────────────
function TowerForm({ data, onChange, lineId }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  const sn = (k) => (v) => onChange({ ...data, [k]: v !== '' ? +v : null });
  return (
    <div className="gm-form-grid">
      <SectionLabel>اطلاعات پایه دکل</SectionLabel>
      <F label="کد دکل"><Inp value={data.tower_code} onChange={s('tower_code')} placeholder="T-001" /></F>
      <F label="شماره دکل" required><Inp value={data.number} onChange={sn('number')} type="number" placeholder="1" /></F>
      <F label="نوع دکل">
        <Sel value={data.tower_type} onChange={s('tower_type')} options={[['Suspension','معلق'],['Tension','کشش'],['Angle','زاویه'],['DeadEnd','انتها'],['Transposition','ترانسپوزیشن']]} />
      </F>
      <F label="جنس">
        <Sel value={data.material} onChange={s('material')} options={[['LatticeSteel','فولاد خرپایی'],['TubularSteel','فولاد لوله‌ای'],['Concrete','بتن']]} />
      </F>
      <F label="ارتفاع (m)"><Inp value={data.height_meters} onChange={sn('height_meters')} type="number" step="0.1" /></F>
      <F label="عرض بازو (m)"><Inp value={data.arm_width_meters} onChange={sn('arm_width_meters')} type="number" step="0.1" /></F>
      <SectionLabel>موقعیت جغرافیایی</SectionLabel>
      <GpsField lat={data.latitude} lng={data.longitude} onLat={(v) => onChange({ ...data, latitude: v !== '' ? +v : null })} onLng={(v) => onChange({ ...data, longitude: v !== '' ? +v : null })} />
      <F label="ارتفاع از سطح دریا (m)"><Inp value={data.altitude_meters} onChange={sn('altitude_meters')} type="number" /></F>
      <SectionLabel>شالوده</SectionLabel>
      <F label="نوع پی">
        <Sel value={data.foundation_type} onChange={s('foundation_type')} options={[['Pad','صفحه'],['Strip','نواری'],['Pile','شمعی'],['Rock','سنگی']]} />
      </F>
      <F label="عمق شالوده (m)"><Inp value={data.foundation_depth_meters} onChange={sn('foundation_depth_meters')} type="number" step="0.1" /></F>
      <F label="تاریخ اجرای شالوده"><Inp value={data.foundation_date} onChange={s('foundation_date')} type="date" /></F>
      <SectionLabel>ایمنی و بازرسی</SectionLabel>
      <F label="وضعیت لانه پرنده">
        <Sel value={data.bird_nest_status} onChange={s('bird_nest_status')} options={[['None','بدون لانه'],['NeedsCleaning','نیاز به تمیزکاری']]} />
      </F>
      <F label="آخرین بازرسی"><Inp value={data.last_inspection_date} onChange={s('last_inspection_date')} type="date" /></F>
      <F label="ضد صعود" span2={false}>
        <Sel value={data.anti_climbing_device ? '1' : '0'} onChange={(v) => onChange({ ...data, anti_climbing_device: v === '1' })} options={[['1','دارد'],['0','ندارد']]} />
      </F>
      <F label="تابلو هشدار">
        <Sel value={data.warning_sign ? '1' : '0'} onChange={(v) => onChange({ ...data, warning_sign: v === '1' })} options={[['1','دارد'],['0','ندارد']]} />
      </F>
      <SectionLabel>ارت‌گذاری</SectionLabel>
      <F label="مقاومت ارت (Ω) ≤5"><Inp value={data.grounding_resistance_ohm} onChange={sn('grounding_resistance_ohm')} type="number" step="0.01" /></F>
      <F label="تعداد میله‌های ارت"><Inp value={data.grounding_rod_count} onChange={sn('grounding_rod_count')} type="number" /></F>
    </div>
  );
}

// ─────────────── Insulator Form ───────────────
function InsulatorForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <div className="gm-form-grid">
      <F label="موقعیت فاز"><Inp value={data.phase_position} onChange={s('phase_position')} placeholder="فاز A" /></F>
      <F label="نوع مقره">
        <Sel value={data.insulator_type} onChange={s('insulator_type')} options={[['Suspension','معلق'],['Tension','کشش'],['Post','ستونی']]} />
      </F>
      <F label="جنس">
        <Sel value={data.material} onChange={s('material')} options={[['Glass','شیشه'],['Porcelain','چینی'],['Silicone','سیلیکون']]} />
      </F>
      <F label="تعداد دیسک"><Inp value={data.number_of_discs} onChange={(v) => s('number_of_discs')(v ? +v : null)} type="number" /></F>
      <F label="کلاس مکانیکی (kN)"><Inp value={data.mechanical_class_kn} onChange={(v) => s('mechanical_class_kn')(v ? +v : null)} type="number" /></F>
      <F label="وضعیت">
        <Sel value={data.condition} onChange={s('condition')} options={[['Clean','تمیز'],['Polluted','آلوده'],['Cracked','ترک‌دار'],['NeedsWashing','نیاز به شستشو']]} />
      </F>
      <F label="تاریخ نصب"><Inp value={data.installation_date} onChange={s('installation_date')} type="date" /></F>
    </div>
  );
}

// ─────────────── Conductor Form ───────────────
function ConductorForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  const sn = (k) => (v) => onChange({ ...data, [k]: v !== '' ? +v : null });
  return (
    <div className="gm-form-grid">
      <F label="شماره فاز">
        <Sel value={data.phase_number} onChange={(v) => s('phase_number')(+v)} options={[['1','فاز ۱'],['2','فاز ۲'],['3','فاز ۳'],['0','نول']]} />
      </F>
      <F label="نوع هادی">
        <Sel value={data.conductor_type} onChange={s('conductor_type')} options={[['ACSR','ACSR'],['AAC','AAC'],['AAAC','AAAC'],['OPGW','OPGW']]} />
      </F>
      <F label="سطح مقطع (mm²)"><Inp value={data.cross_section_mm2} onChange={sn('cross_section_mm2')} type="number" /></F>
      <F label="تعداد رشته"><Inp value={data.strand_count} onChange={sn('strand_count')} type="number" /></F>
      <F label="تنش (kgf)"><Inp value={data.tension_kgf} onChange={sn('tension_kgf')} type="number" step="0.1" /></F>
      <F label="افتادگی (mm)"><Inp value={data.sag_mm} onChange={sn('sag_mm')} type="number" step="0.1" /></F>
      <F label="نوع بست">
        <Sel value={data.clamp_type} onChange={s('clamp_type')} options={[['SuspensionClamp','بست معلق'],['TensionClamp','بست کشش'],['ArmorRod','آرمور راد']]} />
      </F>
    </div>
  );
}

// ─────────────── Fitting Form ───────────────
function FittingForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <div className="gm-form-grid">
      <F label="نوع یراق">
        <Sel value={data.fitting_type} onChange={s('fitting_type')} options={[['VibrationDamper','ضربه‌گیر'],['Spacer','فاصله‌نگه‌دار'],['ArcingHorn','شاخ تخلیه'],['CoronaRing','حلقه کرونا'],['Bolt','پیچ و مهره']]} />
      </F>
      <F label="زیرنوع"><Inp value={data.subtype} onChange={s('subtype')} placeholder="مشخصات بیشتر" /></F>
      <F label="تعداد"><Inp value={data.quantity} onChange={(v) => s('quantity')(+v)} type="number" min="1" /></F>
      <F label="وضعیت">
        <Sel value={data.condition} onChange={s('condition')} options={[['Tight','محکم'],['Loose','شل'],['Corroded','زنگ‌زده'],['Missing','مفقود']]} />
      </F>
      <F label="تاریخ نصب"><Inp value={data.installation_date} onChange={s('installation_date')} type="date" /></F>
    </div>
  );
}

// ─────────────── Grounding Form ───────────────
function GroundingForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  const sn = (k) => (v) => onChange({ ...data, [k]: v !== '' ? +v : null });
  const pct = Math.min(100, ((data.resistance_ohm || 0) / 5) * 100);
  const barColor = pct > 80 ? '#f87171' : pct > 50 ? '#fb923c' : '#4ade80';
  return (
    <div className="gm-form-grid">
      <F label="مقاومت ارت (Ω) — حداکثر ۵" required>
        <Inp value={data.resistance_ohm} onChange={sn('resistance_ohm')} type="number" step="0.01" placeholder="0.00" />
      </F>
      <F label="نوع الکترود">
        <Sel value={data.electrode_type} onChange={s('electrode_type')} options={[['CopperRod','میله مسی'],['Chemical','شیمیایی'],['DeepWell','چاه عمیق']]} />
      </F>
      {data.resistance_ohm !== null && data.resistance_ohm !== '' && (
        <div className="gm-ohm-bar-wrap">
          <div style={{ fontSize: 11, color: barColor }}>سطح مقاومت: {Number(data.resistance_ohm).toFixed(2)} Ω از ۵ Ω</div>
          <div className="gm-ohm-bar-bg"><div className="gm-ohm-bar" style={{ width: pct + '%', background: barColor }} /></div>
        </div>
      )}
      <F label="تعداد الکترودها"><Inp value={data.number_of_electrodes} onChange={sn('number_of_electrodes')} type="number" /></F>
      <F label="تاریخ آزمون"><Inp value={data.test_date} onChange={s('test_date')} type="date" /></F>
      <F label="تاریخ آزمون بعدی"><Inp value={data.next_test_due_date} onChange={s('next_test_due_date')} type="date" /></F>
    </div>
  );
}

// ─────────────── Inspection Form ───────────────
function InspectionForm({ data, onChange, lines, towers }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  const scopeIsTower = !!data.tower_id && !data.line_id;
  const scopeIsLine = !!data.line_id && !data.tower_id;
  return (
    <div className="gm-form-grid">
      <SectionLabel>محدوده بازرسی (دقیقاً یکی)</SectionLabel>
      <F label="بازرسی خط">
        <Sel value={data.line_id || ''} onChange={(v) => onChange({ ...data, line_id: v, tower_id: v ? '' : data.tower_id })} options={[['','— انتخاب خط —'], ...lines.map(l => [l.id, `${l.id} – ${l.name}`])]} />
      </F>
      <F label="بازرسی دکل">
        <Sel value={data.tower_id || ''} onChange={(v) => onChange({ ...data, tower_id: v, line_id: v ? '' : data.line_id })} options={[['','— انتخاب دکل —'], ...towers.map(t => [t.id, `دکل ${t.number} (${t.id})`])]} />
      </F>
      {!scopeIsTower && !scopeIsLine && <div className="gm-alert gm-alert-warn span-2" style={{ gridColumn: 'span 2' }}>⚠ دقیقاً یکی از خط یا دکل را انتخاب کنید</div>}
      <SectionLabel>جزئیات</SectionLabel>
      <F label="تاریخ بازرسی" required><Inp value={data.inspection_date} onChange={s('inspection_date')} type="date" /></F>
      <F label="نوع بازرسی">
        <Sel value={data.inspection_type} onChange={s('inspection_type')} options={[['Ground','زمینی'],['Drone','پهپاد'],['Helicopter','هلیکوپتر'],['Automated','خودکار']]} />
      </F>
      <F label="نام بازرس" required span2><Inp value={data.inspector_name} onChange={s('inspector_name')} placeholder="نام و نام خانوادگی" /></F>
      <F label="عیوب یافت‌شده" span2>
        <textarea className="gm-textarea" value={data.defects_found} onChange={(e) => s('defects_found')(e.target.value)} placeholder="توضیح عیوب یافت‌شده..." />
      </F>
      <F label="اقدامات انجام‌شده" span2>
        <textarea className="gm-textarea" value={data.action_taken} onChange={(e) => s('action_taken')(e.target.value)} placeholder="اقدامات انجام‌شده..." />
      </F>
      <F label="تاریخ بازرسی بعدی"><Inp value={data.next_inspection_date} onChange={s('next_inspection_date')} type="date" /></F>
    </div>
  );
}

// ─────────────── Main ───────────────
export default function GridManagement() {
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedLine, setSelectedLine] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // entity lists for selected line/tower
  const [towers, setTowers] = useState([]);
  const [selectedTower, setSelectedTower] = useState(null);
  const [insulators, setInsulators] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [fittings, setFittings] = useState([]);
  const [groundings, setGroundings] = useState([]);
  const [spans, setSpans] = useState([]);
  const [inspections, setInspections] = useState([]);

  // modal state
  const [modal, setModal] = useState(null); // { type, data, editId }
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── loaders ──
  const loadLines = useCallback(async () => {
    try { const r = await getGridLines(); setLines(r.data || []); } catch {}
  }, []);

  const loadTowers = useCallback(async (lineId) => {
    if (!lineId) { setTowers([]); return; }
    try { const r = await getGridTowers(lineId); setTowers(r.data || []); } catch {}
  }, []);

  const loadComponents = useCallback(async (towerId, lineId) => {
    if (!towerId && !lineId) return;
    setLoading(true);
    try {
      if (towerId) {
        const [ins, cond, fit, gnd, insp] = await Promise.all([
          getInsulators(towerId), getConductors(towerId), getFittings(towerId),
          getGroundings(), getInspections('', towerId),
        ]);
        setInsulators(ins.data || []);
        setConductors(cond.data || []);
        setFittings(fit.data || []);
        setGroundings((gnd.data || []).filter(g => g.tower_id === towerId));
        setInspections(insp.data || []);
      } else {
        const [insp, sp] = await Promise.all([
          getInspections(lineId, ''), getSpans(lineId),
        ]);
        setInspections(insp.data || []);
        setSpans(sp.data || []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLines(); }, [loadLines]);
  useEffect(() => { if (selectedLine) { loadTowers(selectedLine.id); loadComponents(null, selectedLine.id); } }, [selectedLine, loadTowers, loadComponents]);
  useEffect(() => { if (selectedTower) loadComponents(selectedTower.id, null); }, [selectedTower, loadComponents]);

  // ── modal helpers ──
  const openModal = (type, data, editId = null) => setModal({ type, data: { ...data }, editId });
  const closeModal = () => setModal(null);
  const showAlert = (msg, kind = 'success') => { setAlert({ msg, kind }); setTimeout(() => setAlert(null), 3500); };

  // ── save ──
  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const { type, data, editId } = modal;
      const op = async () => {
        switch (type) {
          case 'line':    return editId ? updateGridLine(editId, data) : createGridLine(data);
          case 'tower':   return editId ? updateGridTower(editId, data) : createGridTower({ ...data, line_id: selectedLine.id });
          case 'ins':     return editId ? updateInsulator(editId, data) : createInsulator({ ...data, tower_id: selectedTower.id });
          case 'cond':    return editId ? updateConductor(editId, data) : createConductor({ ...data, tower_id: selectedTower.id });
          case 'fit':     return editId ? updateFitting(editId, data) : createFitting({ ...data, tower_id: selectedTower.id });
          case 'gnd':     return editId ? updateGrounding(editId, data) : createGrounding({ ...data, tower_id: selectedTower.id });
          case 'span':    return editId ? updateSpan(editId, data) : createSpan({ ...data, line_id: selectedLine.id });
          case 'insp':    return editId ? updateInspection(editId, data) : createInspection(data);
          default: return;
        }
      };
      await op();
      closeModal();
      showAlert('با موفقیت ذخیره شد ✓');
      if (type === 'line') { await loadLines(); }
      if (type === 'tower') { await loadTowers(selectedLine?.id); }
      if (['ins','cond','fit','gnd','insp'].includes(type) && selectedTower) await loadComponents(selectedTower.id, null);
      if (['span','insp'].includes(type) && selectedLine) await loadComponents(null, selectedLine.id);
    } catch (e) {
      showAlert(e.response?.data?.detail || 'خطا در ذخیره', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('حذف شود؟')) return;
    try {
      const ops = { line: deleteGridLine, tower: deleteGridTower, ins: deleteInsulator, cond: deleteConductor, fit: deleteFitting, gnd: deleteGrounding, span: deleteSpan, insp: deleteInspection };
      await ops[type](id);
      showAlert('حذف شد');
      if (type === 'line') { setSelectedLine(null); setTowers([]); await loadLines(); }
      if (type === 'tower') { setSelectedTower(null); await loadTowers(selectedLine?.id); }
      if (['ins','cond','fit','gnd','insp'].includes(type) && selectedTower) await loadComponents(selectedTower.id, null);
      if (['span','insp'].includes(type) && selectedLine) await loadComponents(null, selectedLine.id);
    } catch (e) { showAlert(e.response?.data?.detail || 'خطا در حذف', 'error'); }
  };

  const filteredLines = lines.filter(l =>
    !search || l.id.includes(search) || (l.name || '').includes(search) || (l.source_substation || '').includes(search)
  );

  // ── Tab content ──
  const tabContent = () => {
    if (!selectedLine && activeTab !== 'lines-all') return (
      <div className="gm-no-select">
        <div className="gm-no-select-icon">⚡</div>
        <div className="gm-no-select-text">یک خط انتقال از پانل چپ انتخاب کنید</div>
      </div>
    );

    if (activeTab === 'overview' && selectedLine) return (
      <>
        <div className="gm-info-grid">
          {[
            ['ولتاژ', `${selectedLine.voltage_level || selectedLine.voltage || '—'} kV`,'highlight'],
            ['نوع جریان', selectedLine.current_type || '—'],
            ['طول کل', selectedLine.total_length_km ? selectedLine.total_length_km + ' km' : '—'],
            ['نوع خط', selectedLine.line_type === 'Overhead' ? 'هوایی' : selectedLine.line_type === 'Cable' ? 'کابل زمینی' : '—'],
            ['مدار', selectedLine.number_of_circuits === 2 ? 'دو مداره' : 'یک مداره'],
            ['پست مبدأ', selectedLine.source_substation || '—'],
            ['پست مقصد', selectedLine.destination_substation || '—'],
            ['بهره‌برداری', fmtDate(selectedLine.commissioning_date)],
            ['آخرین بازرسی', fmtDate(selectedLine.last_inspection_date), inspOverdue(selectedLine.last_inspection_date) ? 'danger' : 'ok'],
            ['حداکثر انتقال', selectedLine.max_transfer_mw ? selectedLine.max_transfer_mw + ' MW' : '—'],
            ['جریان نامی', selectedLine.rated_current_a ? selectedLine.rated_current_a + ' A' : '—'],
            ['تعداد دکل', towers.length, 'highlight'],
            ['تعداد بازرسی', inspections.length],
            ['تعداد دهانه', spans.length],
          ].map(([label, val, cls]) => (
            <div className="gm-info-card" key={label}>
              <div className="gm-info-label">{label}</div>
              <div className={`gm-info-value${cls ? ' ' + cls : ''}`}>{val}</div>
            </div>
          ))}
        </div>
        {inspOverdue(selectedLine.last_inspection_date) && (
          <div className="gm-alert gm-alert-warn">⚠ آخرین بازرسی این خط بیش از ۲ سال پیش بوده است!</div>
        )}
      </>
    );

    if (activeTab === 'towers') return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{towers.length} دکل در این خط</span>
          <button className="gm-btn gm-btn-success" onClick={() => openModal('tower', { ...E_TOWER, line_id: selectedLine?.id })}>+ افزودن دکل</button>
        </div>
        {towers.length === 0 ? <div className="gm-empty"><div className="gm-empty-icon">🗼</div><div className="gm-empty-text">هیچ دکلی ثبت نشده</div></div> : (
          <div className="gm-tower-grid">
            {towers.sort((a, b) => (a.number || 0) - (b.number || 0)).map(t => (
              <div key={t.id} className={`gm-tower-card${selectedTower?.id === t.id ? ' selected' : ''}`} onClick={() => { setSelectedTower(t); setActiveTab('tower-detail'); }}>
                {inspOverdue(t.last_inspection_date) && <div className="gm-warn-badge">⚠ بازرسی</div>}
                <div className="gm-tower-card-header">
                  <div className="gm-tower-num">#{t.number}</div>
                  <div className="gm-tower-type-badge">{t.tower_type || t.type || '—'}</div>
                </div>
                <div className="gm-tower-info">
                  <span>🏗 {t.material || t.tower_code || '—'}</span>
                  {t.height_meters && <span>📏 {t.height_meters} m</span>}
                  {t.latitude && t.longitude && <span>📍 {Number(t.latitude).toFixed(4)}, {Number(t.longitude).toFixed(4)}</span>}
                  <span>🔌 ارت: {t.grounding_resistance_ohm ? t.grounding_resistance_ohm + ' Ω' : '—'}</span>
                  <span>🔎 بازرسی: {fmtDate(t.last_inspection_date)}</span>
                </div>
                <div className="gm-tower-actions">
                  <button className="gm-btn gm-btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={(e) => { e.stopPropagation(); openModal('tower', t, t.id); }}>✏ ویرایش</button>
                  <button className="gm-btn gm-btn-danger" style={{ fontSize: 11, padding: '5px 10px' }} onClick={(e) => { e.stopPropagation(); handleDelete('tower', t.id); }}>✕ حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );

    if (activeTab === 'tower-detail' && selectedTower) return (
      <TowerDetail
        tower={selectedTower}
        insulators={insulators}
        conductors={conductors}
        fittings={fittings}
        groundings={groundings}
        inspections={inspections}
        onEdit={(type, d, id) => openModal(type, d, id)}
        onAdd={(type, d) => openModal(type, d)}
        onDelete={handleDelete}
      />
    );

    if (activeTab === 'spans') return (
      <EntityTable
        title="دهانه‌ها"
        rows={spans}
        cols={['from_tower_id','to_tower_id','span_length_meters','terrain_type','min_ground_clearance_meters','mid_span_damper_count']}
        headers={['از دکل','تا دکل','طول (m)','نوع زمین','ارتفاع آزاد (m)','تعداد میراگر']}
        onAdd={() => openModal('span', { ...E_SPAN, line_id: selectedLine?.id })}
        onEdit={(r) => openModal('span', r, r.id)}
        onDelete={(r) => handleDelete('span', r.id)}
      />
    );

    if (activeTab === 'inspections') return (
      <EntityTable
        title="بازرسی‌های خط"
        rows={inspections}
        cols={['inspection_date','inspection_type','inspector_name','defects_found','next_inspection_date']}
        headers={['تاریخ','نوع','بازرس','عیوب','بازرسی بعدی']}
        onAdd={() => openModal('insp', { ...E_INSP, line_id: selectedLine?.id })}
        onEdit={(r) => openModal('insp', r, r.id)}
        onDelete={(r) => handleDelete('insp', r.id)}
      />
    );

    return null;
  };

  const tabs = [
    { id: 'overview', label: '📋 خلاصه' },
    { id: 'towers',   label: '🗼 دکل‌ها', count: towers.length },
    ...(selectedTower ? [{ id: 'tower-detail', label: `🔎 دکل #${selectedTower.number}` }] : []),
    { id: 'spans',       label: '↔ دهانه‌ها', count: spans.length },
    { id: 'inspections', label: '🔍 بازرسی‌ها', count: inspections.length },
  ];

  return (
    <div className="gm-root">
      {/* ── sidebar ── */}
      <div className="gm-sidebar">
        <div className="gm-sidebar-header">
          <div className="gm-sidebar-title">خطوط انتقال</div>
          <div className="gm-search-wrap">
            <span className="gm-search-icon">🔍</span>
            <input placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="gm-line-list">
          {filteredLines.length === 0 && <div className="gm-empty" style={{ height: 120 }}><div style={{ fontSize: 32 }}>📭</div><div className="gm-empty-text">یافت نشد</div></div>}
          {filteredLines.map(l => (
            <div key={l.id} className={`gm-line-card${selectedLine?.id === l.id ? ' active' : ''}`} onClick={() => { setSelectedLine(l); setSelectedTower(null); setActiveTab('overview'); }}>
              <div className="gm-line-card-top">
                <span className="gm-line-name">{l.name || l.id}</span>
                {l.voltage_level && <span className="gm-line-volt" style={{ background: voltColor(l.voltage_level) + '33', color: voltColor(l.voltage_level) }}>{l.voltage_level} kV</span>}
              </div>
              <div className="gm-line-meta">
                {l.source_substation && <span>⚡ {l.source_substation}</span>}
                {l.total_length_km && <span>📏 {l.total_length_km} km</span>}
                {statusBadge(l.line_status)}
              </div>
            </div>
          ))}
        </div>
        <button className="gm-add-line-btn" onClick={() => openModal('line', { ...E_LINE })}>+ خط جدید</button>
      </div>

      {/* ── main ── */}
      <div className="gm-main">
        {selectedLine ? (
          <>
            <div className="gm-main-header">
              <div className="gm-main-title">
                ⚡ {selectedLine.name || selectedLine.id}
                {statusBadge(selectedLine.line_status)}
              </div>
              <div className="gm-main-actions">
                <button className="gm-btn gm-btn-ghost" onClick={() => openModal('line', selectedLine, selectedLine.id)}>✏ ویرایش خط</button>
                <button className="gm-btn gm-btn-danger" onClick={() => handleDelete('line', selectedLine.id)}>🗑 حذف خط</button>
              </div>
            </div>
            <div className="gm-tabs">
              {tabs.map(t => (
                <button key={t.id} className={`gm-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
                  {t.label}
                  {t.count !== undefined && <span className="gm-tab-count">{t.count}</span>}
                </button>
              ))}
            </div>
            <div className="gm-tab-content">
              {alert && <div className={`gm-alert gm-alert-${alert.kind}`}>{alert.kind === 'success' ? '✅' : '❌'} {alert.msg}</div>}
              {loading && <div style={{ textAlign: 'center', padding: 20 }}><span className="gm-spinner" /></div>}
              {!loading && tabContent()}
            </div>
          </>
        ) : (
          <div className="gm-no-select">
            <div className="gm-no-select-icon">🌐</div>
            <div className="gm-no-select-text">یک خط انتقال از پانل چپ انتخاب کنید</div>
            <button className="gm-btn gm-btn-primary" onClick={() => openModal('line', { ...E_LINE })}>+ افزودن اولین خط</button>
          </div>
        )}
      </div>

      {/* ── modals ── */}
      {modal && (
        <Modal
          title={{
            line: modal.editId ? 'ویرایش خط' : 'خط جدید',
            tower: modal.editId ? 'ویرایش دکل' : 'افزودن دکل',
            ins:  modal.editId ? 'ویرایش مقره' : 'افزودن مقره',
            cond: modal.editId ? 'ویرایش هادی' : 'افزودن هادی',
            fit:  modal.editId ? 'ویرایش یراق‌آلات' : 'افزودن یراق‌آلات',
            gnd:  modal.editId ? 'ویرایش سیستم ارت' : 'افزودن سیستم ارت',
            span: modal.editId ? 'ویرایش دهانه' : 'افزودن دهانه',
            insp: modal.editId ? 'ویرایش بازرسی' : 'بازرسی جدید',
          }[modal.type]}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        >
          {modal.type === 'line'  && <LineForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />}
          {modal.type === 'tower' && <TowerForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} lineId={selectedLine?.id} />}
          {modal.type === 'ins'   && <InsulatorForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />}
          {modal.type === 'cond'  && <ConductorForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />}
          {modal.type === 'fit'   && <FittingForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />}
          {modal.type === 'gnd'   && <GroundingForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />}
          {modal.type === 'span'  && <SpanForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} towers={towers} />}
          {modal.type === 'insp'  && <InspectionForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} lines={lines} towers={towers} />}
        </Modal>
      )}
    </div>
  );
}

// ─────────────── Span Form ───────────────
function SpanForm({ data, onChange, towers }) {
  const s = (k) => (v) => onChange({ ...data, [k]: v });
  const sn = (k) => (v) => onChange({ ...data, [k]: v !== '' ? +v : null });
  const towerOpts = [['', '— انتخاب —'], ...towers.map(t => [t.id, `دکل #${t.number}`])];
  return (
    <div className="gm-form-grid">
      <F label="از دکل" required><Sel value={data.from_tower_id} onChange={s('from_tower_id')} options={towerOpts} /></F>
      <F label="تا دکل" required><Sel value={data.to_tower_id} onChange={s('to_tower_id')} options={towerOpts} /></F>
      <F label="طول دهانه (m)"><Inp value={data.span_length_meters} onChange={sn('span_length_meters')} type="number" step="0.1" /></F>
      <F label="نوع زمین"><Inp value={data.terrain_type} onChange={s('terrain_type')} placeholder="کوهستانی / جلگه..." /></F>
      <F label="حداقل ارتفاع آزاد (m)"><Inp value={data.min_ground_clearance_meters} onChange={sn('min_ground_clearance_meters')} type="number" step="0.1" /></F>
      <F label="تعداد میراگر میان‌دهانه"><Inp value={data.mid_span_damper_count} onChange={sn('mid_span_damper_count')} type="number" /></F>
    </div>
  );
}

// ─────────────── Entity Table ───────────────
function EntityTable({ title, rows, cols, headers, onAdd, onEdit, onDelete }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{rows.length} رکورد</span>
        <button className="gm-btn gm-btn-success" onClick={onAdd}>+ افزودن</button>
      </div>
      {rows.length === 0 ? (
        <div className="gm-empty"><div className="gm-empty-icon">📭</div><div className="gm-empty-text">هیچ رکوردی یافت نشد</div></div>
      ) : (
        <div className="gm-table-wrap">
          <table className="gm-table">
            <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th>عملیات</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  {cols.map(c => <td key={c}>{fmt(r[c])}</td>)}
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="gm-btn gm-btn-ghost" style={{ fontSize: 11, padding: '4px 9px' }} onClick={() => onEdit(r)}>✏</button>
                      <button className="gm-btn gm-btn-danger" style={{ fontSize: 11, padding: '4px 9px' }} onClick={() => onDelete(r)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─────────────── Tower Detail ───────────────
function TowerDetail({ tower, insulators, conductors, fittings, groundings, inspections, onEdit, onAdd, onDelete }) {
  const [sub, setSub] = useState('info');
  const gnd = groundings[0];
  const subTabs = [
    { id: 'info',       label: '📋 مشخصات', count: null },
    { id: 'insulators', label: '🔴 مقره‌ها', count: insulators.length },
    { id: 'conductors', label: '⚡ هادی‌ها', count: conductors.length },
    { id: 'fittings',   label: '🔩 یراق‌آلات', count: fittings.length },
    { id: 'grounding',  label: '🌍 سیستم ارت', count: null },
    { id: 'inspections',label: '🔍 بازرسی‌ها', count: inspections.length },
  ];
  const E_INS2 = { tower_id: tower.id, phase_position: '', insulator_type: 'Suspension', material: 'Glass', number_of_discs: null, mechanical_class_kn: null, condition: 'Clean', installation_date: '' };
  const E_COND2 = { tower_id: tower.id, phase_number: 1, conductor_type: 'ACSR', cross_section_mm2: null, strand_count: null, tension_kgf: null, sag_mm: null, clamp_type: 'SuspensionClamp' };
  const E_FIT2 = { tower_id: tower.id, fitting_type: 'VibrationDamper', subtype: '', quantity: 1, installation_date: '', condition: 'Tight' };
  const E_GND2 = { tower_id: tower.id, resistance_ohm: null, electrode_type: 'CopperRod', number_of_electrodes: 1, test_date: '', next_test_due_date: '' };
  const E_INSP2 = { tower_id: tower.id, line_id: '', inspection_date: '', inspection_type: 'Ground', inspector_name: '', defects_found: '', action_taken: '', next_inspection_date: '' };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#60a5fa' }}>دکل #{tower.number}</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>{tower.tower_code || tower.id}</div>
        {inspOverdue(tower.last_inspection_date) && <div className="gm-alert gm-alert-warn" style={{ margin: 0 }}>⚠ بازرسی بیش از ۲ سال</div>}
        <button className="gm-btn gm-btn-ghost" style={{ marginRight: 'auto' }} onClick={() => onEdit('tower', tower, tower.id)}>✏ ویرایش دکل</button>
      </div>
      <div className="gm-tabs" style={{ padding: '0 0 0' }}>
        {subTabs.map(t => (
          <button key={t.id} className={`gm-tab${sub === t.id ? ' active' : ''}`} onClick={() => setSub(t.id)}>
            {t.label}
            {t.count !== null && <span className="gm-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: 16 }}>
        {sub === 'info' && (
          <div className="gm-info-grid">
            {[
              ['نوع دکل', tower.tower_type || tower.type || '—'],
              ['جنس', tower.material || '—'],
              ['ارتفاع', tower.height_meters ? tower.height_meters + ' m' : '—'],
              ['عرض بازو', tower.arm_width_meters ? tower.arm_width_meters + ' m' : '—'],
              ['موقعیت GPS', tower.latitude && tower.longitude ? `${Number(tower.latitude).toFixed(5)}, ${Number(tower.longitude).toFixed(5)}` : '—', 'highlight'],
              ['ارتفاع از دریا', tower.altitude_meters ? tower.altitude_meters + ' m' : '—'],
              ['نوع پی', tower.foundation_type || '—'],
              ['عمق پی', tower.foundation_depth_meters ? tower.foundation_depth_meters + ' m' : '—'],
              ['ضد صعود', tower.anti_climbing_device ? '✓ دارد' : '✗ ندارد', tower.anti_climbing_device ? 'ok' : 'warn'],
              ['لانه پرنده', tower.bird_nest_status === 'NeedsCleaning' ? '⚠ نیاز به تمیزکاری' : 'بدون لانه', tower.bird_nest_status === 'NeedsCleaning' ? 'warn' : 'ok'],
              ['مقاومت ارت', tower.grounding_resistance_ohm ? tower.grounding_resistance_ohm + ' Ω' : '—', tower.grounding_resistance_ohm > 5 ? 'danger' : 'ok'],
              ['آخرین بازرسی', fmtDate(tower.last_inspection_date), inspOverdue(tower.last_inspection_date) ? 'danger' : 'ok'],
            ].map(([l, v, c]) => (
              <div className="gm-info-card" key={l}>
                <div className="gm-info-label">{l}</div>
                <div className={`gm-info-value${c ? ' ' + c : ''}`}>{v}</div>
              </div>
            ))}
            {tower.latitude && tower.longitude && (
              <div className="gm-info-card" style={{ gridColumn: 'span 2' }}>
                <div className="gm-info-label">نقشه</div>
                <a href={`https://maps.google.com/?q=${tower.latitude},${tower.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 13 }}>🗺 نمایش در Google Maps</a>
              </div>
            )}
          </div>
        )}
        {sub === 'insulators' && <EntityTable title="مقره‌ها" rows={insulators} cols={['phase_position','insulator_type','material','number_of_discs','condition']} headers={['فاز','نوع','جنس','دیسک','وضعیت']} onAdd={() => onAdd('ins', E_INS2)} onEdit={(r) => onEdit('ins', r, r.id)} onDelete={(r) => onDelete('ins', r.id)} />}
        {sub === 'conductors' && <EntityTable title="هادی‌ها" rows={conductors} cols={['phase_number','conductor_type','cross_section_mm2','strand_count','tension_kgf','sag_mm']} headers={['فاز','نوع','مقطع mm²','رشته','تنش kgf','افتادگی mm']} onAdd={() => onAdd('cond', E_COND2)} onEdit={(r) => onEdit('cond', r, r.id)} onDelete={(r) => onDelete('cond', r.id)} />}
        {sub === 'fittings' && <EntityTable title="یراق‌آلات" rows={fittings} cols={['fitting_type','subtype','quantity','condition']} headers={['نوع','زیرنوع','تعداد','وضعیت']} onAdd={() => onAdd('fit', E_FIT2)} onEdit={(r) => onEdit('fit', r, r.id)} onDelete={(r) => onDelete('fit', r.id)} />}
        {sub === 'grounding' && (
          <>
            {gnd ? (
              <>
                <div className="gm-info-grid">
                  {[
                    ['مقاومت ارت', gnd.resistance_ohm ? gnd.resistance_ohm + ' Ω' : '—', gnd.resistance_ohm > 5 ? 'danger' : 'ok'],
                    ['نوع الکترود', gnd.electrode_type || '—'],
                    ['تعداد الکترود', gnd.number_of_electrodes || '—'],
                    ['تاریخ آزمون', fmtDate(gnd.test_date)],
                    ['آزمون بعدی', fmtDate(gnd.next_test_due_date)],
                  ].map(([l, v, c]) => (
                    <div className="gm-info-card" key={l}>
                      <div className="gm-info-label">{l}</div>
                      <div className={`gm-info-value${c ? ' ' + c : ''}`}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="gm-btn gm-btn-ghost" onClick={() => onEdit('gnd', gnd, gnd.id)}>✏ ویرایش</button>
                  <button className="gm-btn gm-btn-danger" onClick={() => onDelete('gnd', gnd.id)}>🗑 حذف</button>
                </div>
              </>
            ) : (
              <div className="gm-empty">
                <div className="gm-empty-icon">🌍</div>
                <div className="gm-empty-text">سیستم ارت ثبت نشده</div>
                <button className="gm-btn gm-btn-success" onClick={() => onAdd('gnd', E_GND2)}>+ افزودن سیستم ارت</button>
              </div>
            )}
          </>
        )}
        {sub === 'inspections' && <EntityTable title="بازرسی‌ها" rows={inspections} cols={['inspection_date','inspection_type','inspector_name','defects_found']} headers={['تاریخ','نوع','بازرس','عیوب']} onAdd={() => onAdd('insp', E_INSP2)} onEdit={(r) => onEdit('insp', r, r.id)} onDelete={(r) => onDelete('insp', r.id)} />}
      </div>
    </>
  );
}
