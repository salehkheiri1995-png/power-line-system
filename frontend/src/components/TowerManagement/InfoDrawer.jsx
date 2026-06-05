import React from 'react';
import '../GridManagement.css';

const fmt = (v) => (v === null || v === undefined || v === '') ? '—' : String(v);
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fa-IR'); } catch { return d; }
};
const inspOverdue = (d) => {
  if (!d) return true;
  return (Date.now() - new Date(d)) > 2 * 365 * 24 * 3600 * 1000;
};

const statusLabel = {
  InService: 'در سرویس',
  OutOfService: 'خارج از سرویس',
  UnderConstruction: 'در دست ساخت',
};
const statusClass = {
  InService: 'active',
  OutOfService: 'inactive',
  UnderConstruction: 'construction',
};

function InfoCard({ label, value, cls }) {
  return (
    <div className="gm-info-card">
      <div className="gm-info-label">{label}</div>
      <div className={`gm-info-value${cls ? ' ' + cls : ''}`}>{value}</div>
    </div>
  );
}

function LineDrawerContent({ line, towerCount }) {
  const vl = line.voltage_level || line.voltage;
  const overdue = inspOverdue(line.last_inspection_date);

  const lineTypeLabel =
    line.line_type === 'Overhead' ? 'هوایی' :
    line.line_type === 'Cable'    ? 'کابل زمینی' :
    fmt(line.line_type);

  const circuitsLabel =
    line.number_of_circuits === 2 ? 'دو مداره' :
    line.number_of_circuits === 1 ? 'یک مداره' :
    '—';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>⚡</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{line.name || line.id}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{line.id}</div>
        </div>
        {line.line_status && (
          <span
            className={`badge badge-${statusClass[line.line_status] || 'active'}`}
            style={{ marginRight: 'auto' }}
          >
            {statusLabel[line.line_status] || line.line_status}
          </span>
        )}
      </div>

      {overdue && (
        <div className="gm-alert gm-alert-warn" style={{ marginBottom: 14 }}>
          ⚠ آخرین بازرسی بیش از ۲ سال پیش بوده!
        </div>
      )}

      <div className="gm-section-label" style={{ gridColumn: 'unset', marginTop: 0 }}>اطلاعات فنی</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        {vl && <InfoCard label="سطح ولتاژ" value={`${vl} kV`} cls="highlight" />}
        <InfoCard label="نوع جریان" value={fmt(line.current_type)} />
        <InfoCard label="طول کل" value={line.total_length_km ? line.total_length_km + ' km' : '—'} />
        <InfoCard label="نوع خط" value={lineTypeLabel} />
        <InfoCard label="مدار" value={circuitsLabel} />
        <InfoCard label="تعداد دکل" value={towerCount} cls="highlight" />
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>پست‌ها</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        <InfoCard label="پست مبدأ" value={fmt(line.source_substation)} />
        <InfoCard label="پست مقصد" value={fmt(line.destination_substation)} />
        <InfoCard label="بهره‌برداری" value={fmtDate(line.commissioning_date)} />
        <InfoCard label="آخرین بازرسی" value={fmtDate(line.last_inspection_date)} cls={overdue ? 'danger' : 'ok'} />
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>ظرفیت</div>
      <div className="gm-info-grid">
        <InfoCard label="حداکثر انتقال" value={line.max_transfer_mw ? line.max_transfer_mw + ' MW' : '—'} />
        <InfoCard label="جریان نامی" value={line.rated_current_a ? line.rated_current_a + ' A' : '—'} />
      </div>
    </>
  );
}

function TowerDrawerContent({ tower, line }) {
  const overdue = inspOverdue(tower.last_inspection_date);
  const ohm = tower.grounding_resistance_ohm;
  const pct = Math.min(100, ((ohm || 0) / 5) * 100);
  const barColor = pct > 80 ? '#f87171' : pct > 50 ? '#fb923c' : '#4ade80';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa' }}>#{tower.number}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
            {tower.tower_code || tower.id}
          </div>
          {line && <div style={{ fontSize: 12, color: '#64748b' }}>{line.name}</div>}
        </div>
        <span style={{
          marginRight: 'auto', fontSize: 11,
          background: '#1e293b', border: '1px solid #334155',
          padding: '3px 8px', borderRadius: 6, color: '#94a3b8',
        }}>
          {tower.tower_type || tower.type || '—'}
        </span>
      </div>

      {overdue && (
        <div className="gm-alert gm-alert-warn" style={{ marginBottom: 14 }}>
          ⚠ آخرین بازرسی بیش از ۲ سال پیش بوده!
        </div>
      )}

      <div className="gm-section-label" style={{ gridColumn: 'unset', marginTop: 0 }}>مشخصات سازه</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        <InfoCard label="جنس" value={fmt(tower.material)} />
        <InfoCard label="ارتفاع" value={tower.height_meters ? tower.height_meters + ' m' : (tower.height ? tower.height + ' m' : '—')} />
        <InfoCard label="عرض بازو" value={tower.arm_width_meters ? tower.arm_width_meters + ' m' : '—'} />
        <InfoCard label="نوع پی" value={fmt(tower.foundation_type)} />
        <InfoCard label="عمق پی" value={tower.foundation_depth_meters ? tower.foundation_depth_meters + ' m' : '—'} />
        <InfoCard label="تاریخ اجرای پی" value={fmtDate(tower.foundation_date)} />
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>موقعیت جغرافیایی</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        {tower.latitude && tower.longitude ? (
          <>
            <InfoCard label="عرض" value={Number(tower.latitude).toFixed(6)} cls="highlight" />
            <InfoCard label="طول" value={Number(tower.longitude).toFixed(6)} cls="highlight" />
            {tower.altitude_meters && (
              <InfoCard label="ارتفاع از دریا" value={tower.altitude_meters + ' m'} />
            )}
            <div className="gm-info-card" style={{ gridColumn: 'span 2' }}>
              <div className="gm-info-label">نقشه</div>
              <a
                href={`https://maps.google.com/?q=${tower.latitude},${tower.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#60a5fa', fontSize: 13 }}
              >
                🗺 نمایش در Google Maps
              </a>
            </div>
          </>
        ) : (
          <InfoCard label="GPS" value="ثبت نشده" cls="warn" />
        )}
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>ایمنی و بازرسی</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        <InfoCard label="ضد صعود" value={tower.anti_climbing_device ? '✓ دارد' : '✗ ندارد'} cls={tower.anti_climbing_device ? 'ok' : 'warn'} />
        <InfoCard label="تابلو هشدار" value={tower.warning_sign ? '✓ دارد' : '✗ ندارد'} cls={tower.warning_sign ? 'ok' : 'warn'} />
        <InfoCard label="لانه پرنده" value={tower.bird_nest_status === 'NeedsCleaning' ? '⚠ نیاز تمیز' : 'بدون لانه'} cls={tower.bird_nest_status === 'NeedsCleaning' ? 'warn' : 'ok'} />
        <InfoCard label="آخرین بازرسی" value={fmtDate(tower.last_inspection_date)} cls={overdue ? 'danger' : 'ok'} />
      </div>

      {(tower.last_maintenance || tower.next_maintenance) && (
        <>
          <div className="gm-section-label" style={{ gridColumn: 'unset' }}>تعمیرات</div>
          <div className="gm-info-grid" style={{ marginBottom: 12 }}>
            <InfoCard label="آخرین تعمیر" value={fmt(tower.last_maintenance)} />
            <InfoCard label="تعمیر بعدی" value={fmt(tower.next_maintenance)} />
          </div>
        </>
      )}

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>ارت‌گذاری</div>
      <div className="gm-info-grid">
        {ohm !== null && ohm !== undefined ? (
          <>
            <InfoCard label="مقاومت ارت" value={ohm + ' Ω'} cls={ohm > 5 ? 'danger' : 'ok'} />
            <InfoCard label="تعداد میله" value={fmt(tower.grounding_rod_count)} />
            <div className="gm-info-card" style={{ gridColumn: 'span 2' }}>
              <div className="gm-info-label">سطح مقاومت (حداکثر ۵ Ω)</div>
              <div className="gm-ohm-bar-bg" style={{ marginTop: 6 }}>
                <div className="gm-ohm-bar" style={{ width: pct + '%', background: barColor }} />
              </div>
              <div style={{ fontSize: 11, color: barColor, marginTop: 4 }}>{ohm} Ω</div>
            </div>
          </>
        ) : (
          <InfoCard label="ارت" value="ثبت نشده" cls="warn" />
        )}
      </div>
    </>
  );
}

export default function InfoDrawer({ open, onClose, type, data, extra }) {
  if (!open || !data) return null;
  const title = type === 'line'
    ? `خط: ${data.name || data.id}`
    : `دکل #${data.number}`;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: '#00000055',
          zIndex: 8000, backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 400, maxWidth: '95vw',
        background: '#1e293b',
        borderRight: '1px solid #334155',
        zIndex: 8001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 30px #00000066',
        direction: 'rtl',
        animation: 'drawerSlideIn .25s ease',
      }}>
        <style>{`
          @keyframes drawerSlideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          .gm-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        `}</style>

        <div style={{
          padding: '16px 18px', borderBottom: '1px solid #334155',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #1e3a5f, #1e293b)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
            {type === 'line' ? '⚡' : '🗼'} {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#64748b',
              fontSize: 20, cursor: 'pointer', width: 32, height: 32,
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          {type === 'line'
            ? <LineDrawerContent line={data} towerCount={extra?.towerCount ?? 0} />
            : <TowerDrawerContent tower={data} line={extra?.line} />
          }
        </div>
      </div>
    </>
  );
}
