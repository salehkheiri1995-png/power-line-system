import React from 'react';
import '../GridManagement.css';

const fmt = (v) => (v === null || v === undefined || v === '') ? '\u2014' : String(v);
const fmtDate = (d) => {
  if (!d) return '\u2014';
  try { return new Date(d).toLocaleDateString('fa-IR'); } catch { return d; }
};
const inspOverdue = (d) => {
  if (!d) return true;
  return (Date.now() - new Date(d)) > 2 * 365 * 24 * 3600 * 1000;
};

const voltColor = (v) => v >= 400 ? '#f87171' : v >= 230 ? '#fb923c' : v >= 132 ? '#facc15' : '#60a5fa';

const statusLabel = { InService: '\u062f\u0631 \u0633\u0631\u0648\u06cc\u0633', OutOfService: '\u062e\u0627\u0631\u062c \u0627\u0632 \u0633\u0631\u0648\u06cc\u0633', UnderConstruction: '\u062f\u0631 \u062f\u0633\u062a \u0633\u0627\u062e\u062a' };
const statusClass = { InService: 'active', OutOfService: 'inactive', UnderConstruction: 'construction' };

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
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>\u26a1</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{line.name || line.id}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{line.id}</div>
        </div>
        {line.line_status && (
          <span className={`badge badge-${statusClass[line.line_status] || 'active'}`} style={{ marginRight: 'auto' }}>
            {statusLabel[line.line_status] || line.line_status}
          </span>
        )}
      </div>

      {overdue && (
        <div className="gm-alert gm-alert-warn" style={{ marginBottom: 14 }}>
          \u26a0 \u0622\u062e\u0631\u06cc\u0646 \u0628\u0627\u0632\u0631\u0633\u06cc \u0628\u06cc\u0634 \u0627\u0632 \u06f2 \u0633\u0627\u0644 \u067e\u06cc\u0634 \u0628\u0648\u062f\u0647!
        </div>
      )}

      <div className="gm-section-label" style={{ gridColumn: 'unset', marginTop: 0 }}>\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0641\u0646\u06cc</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        {vl && <InfoCard label="\u0633\u0637\u062d \u0648\u0644\u062a\u0627\u0698" value={`${vl} kV`} cls="highlight" />}
        <InfoCard label="\u0646\u0648\u0639 \u062c\u0631\u06cc\u0627\u0646" value={fmt(line.current_type)} />
        <InfoCard label="\u0637\u0648\u0644 \u06a9\u0644" value={line.total_length_km ? line.total_length_km + ' km' : '\u2014'} />
        <InfoCard label="\u0646\u0648\u0639 \u062e\u0637" value={line.line_type === 'Overhead' ? '\u0647\u0648\u0627\u06cc\u06cc' : line.line_type === 'Cable' ? '\u06a9\u0627\u0628\u0644 \u0632\u0645\u06cc\u0646\u06cc' : fmt(line.line_type)} />
        <InfoCard label="\u0645\u062f\u0627\u0631" value={line.number_of_circuits === 2 ? '\u062f\u0648 \u0645\u062f\u0627\u0631\u0647' : line.number_of_circuits === 1 ? '\u06cc\u06a9 \u0645\u062f\u0627\u0631\u0647' : '\u2014'} />
        <InfoCard label="\u062a\u0639\u062f\u0627\u062f \u062f\u06a9\u0644" value={towerCount} cls="highlight" />
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>\u067e\u0633\u062a\u200c\u0647\u0627</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        <InfoCard label="\u067e\u0633\u062a \u0645\u0628\u062f\u0623" value={fmt(line.source_substation)} />
        <InfoCard label="\u067e\u0633\u062a \u0645\u0642\u0635\u062f" value={fmt(line.destination_substation)} />
        <InfoCard label="\u0628\u0647\u0631\u0647\u200c\u0628\u0631\u062f\u0627\u0631\u06cc" value={fmtDate(line.commissioning_date)} />
        <InfoCard label="\u0622\u062e\u0631\u06cc\u0646 \u0628\u0627\u0632\u0631\u0633\u06cc" value={fmtDate(line.last_inspection_date)} cls={overdue ? 'danger' : 'ok'} />
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>\u0638\u0631\u0641\u06cc\u062a</div>
      <div className="gm-info-grid">
        <InfoCard label="\u062d\u062f\u0627\u06a9\u062b\u0631 \u0627\u0646\u062a\u0642\u0627\u0644" value={line.max_transfer_mw ? line.max_transfer_mw + ' MW' : '\u2014'} />
        <InfoCard label="\u062c\u0631\u06cc\u0627\u0646 \u0646\u0627\u0645\u06cc" value={line.rated_current_a ? line.rated_current_a + ' A' : '\u2014'} />
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
        <span style={{ marginRight: 'auto', fontSize: 11, background: '#1e293b', border: '1px solid #334155', padding: '3px 8px', borderRadius: 6, color: '#94a3b8' }}>
          {tower.tower_type || tower.type || '\u2014'}
        </span>
      </div>

      {overdue && (
        <div className="gm-alert gm-alert-warn" style={{ marginBottom: 14 }}>
          \u26a0 \u0622\u062e\u0631\u06cc\u0646 \u0628\u0627\u0632\u0631\u0633\u06cc \u0628\u06cc\u0634 \u0627\u0632 \u06f2 \u0633\u0627\u0644 \u067e\u06cc\u0634 \u0628\u0648\u062f\u0647!
        </div>
      )}

      <div className="gm-section-label" style={{ gridColumn: 'unset', marginTop: 0 }}>\u0645\u0634\u062e\u0635\u0627\u062a \u0633\u0627\u0632\u0647</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        <InfoCard label="\u062c\u0646\u0633" value={fmt(tower.material)} />
        <InfoCard label="\u0627\u0631\u062a\u0641\u0627\u0639" value={tower.height_meters ? tower.height_meters + ' m' : fmt(tower.height ? tower.height + ' m' : null)} />
        <InfoCard label="\u0639\u0631\u0636 \u0628\u0627\u0632\u0648" value={tower.arm_width_meters ? tower.arm_width_meters + ' m' : '\u2014'} />
        <InfoCard label="\u0646\u0648\u0639 \u067e\u06cc" value={fmt(tower.foundation_type)} />
        <InfoCard label="\u0639\u0645\u0642 \u067e\u06cc" value={tower.foundation_depth_meters ? tower.foundation_depth_meters + ' m' : '\u2014'} />
        <InfoCard label="\u062a\u0627\u0631\u06cc\u062e \u0627\u062c\u0631\u0627\u06cc \u067e\u06cc" value={fmtDate(tower.foundation_date)} />
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>\u0645\u0648\u0642\u0639\u06cc\u062a \u062c\u063a\u0631\u0627\u0641\u06cc\u0627\u06cc\u06cc</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        {tower.latitude && tower.longitude ? (
          <>
            <InfoCard label="\u0639\u0631\u0636" value={Number(tower.latitude).toFixed(6)} cls="highlight" />
            <InfoCard label="\u0637\u0648\u0644" value={Number(tower.longitude).toFixed(6)} cls="highlight" />
            {tower.altitude_meters && <InfoCard label="\u0627\u0631\u062a\u0641\u0627\u0639 \u0627\u0632 \u062f\u0631\u06cc\u0627" value={tower.altitude_meters + ' m'} />}
            <div className="gm-info-card" style={{ gridColumn: 'span 2' }}>
              <div className="gm-info-label">\u0646\u0642\u0634\u0647</div>
              <a href={`https://maps.google.com/?q=${tower.latitude},${tower.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 13 }}>\ud83d\uddfa \u0646\u0645\u0627\u06cc\u0634 \u062f\u0631 Google Maps</a>
            </div>
          </>
        ) : (
          <InfoCard label="GPS" value="\u062b\u0628\u062a \u0646\u0634\u062f\u0647" cls="warn" />
        )}
      </div>

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>\u0627\u06cc\u0645\u0646\u06cc \u0648 \u0628\u0627\u0632\u0631\u0633\u06cc</div>
      <div className="gm-info-grid" style={{ marginBottom: 12 }}>
        <InfoCard label="\u0636\u062f \u0635\u0639\u0648\u062f" value={tower.anti_climbing_device ? '\u2713 \u062f\u0627\u0631\u062f' : '\u2717 \u0646\u062f\u0627\u0631\u062f'} cls={tower.anti_climbing_device ? 'ok' : 'warn'} />
        <InfoCard label="\u062a\u0627\u0628\u0644\u0648 \u0647\u0634\u062f\u0627\u0631" value={tower.warning_sign ? '\u2713 \u062f\u0627\u0631\u062f' : '\u2717 \u0646\u062f\u0627\u0631\u062f'} cls={tower.warning_sign ? 'ok' : 'warn'} />
        <InfoCard label="\u0644\u0627\u0646\u0647 \u067e\u0631\u0646\u062f\u0647" value={tower.bird_nest_status === 'NeedsCleaning' ? '\u26a0 \u0646\u06cc\u0627\u0632 \u062a\u0645\u06cc\u0632' : '\u0628\u062f\u0648\u0646 \u0644\u0627\u0646\u0647'} cls={tower.bird_nest_status === 'NeedsCleaning' ? 'warn' : 'ok'} />
        <InfoCard label="\u0622\u062e\u0631\u06cc\u0646 \u0628\u0627\u0632\u0631\u0633\u06cc" value={fmtDate(tower.last_inspection_date)} cls={overdue ? 'danger' : 'ok'} />
      </div>

      {(tower.last_maintenance || tower.next_maintenance) && (
        <>
          <div className="gm-section-label" style={{ gridColumn: 'unset' }}>\u062a\u0639\u0645\u06cc\u0631\u0627\u062a</div>
          <div className="gm-info-grid" style={{ marginBottom: 12 }}>
            <InfoCard label="\u0622\u062e\u0631\u06cc\u0646 \u062a\u0639\u0645\u06cc\u0631" value={fmt(tower.last_maintenance)} />
            <InfoCard label="\u062a\u0639\u0645\u06cc\u0631 \u0628\u0639\u062f\u06cc" value={fmt(tower.next_maintenance)} />
          </div>
        </>
      )}

      <div className="gm-section-label" style={{ gridColumn: 'unset' }}>\u0627\u0631\u062a\u200c\u06af\u0630\u0627\u0631\u06cc</div>
      <div className="gm-info-grid">
        {ohm !== null && ohm !== undefined ? (
          <>
            <InfoCard label="\u0645\u0642\u0627\u0648\u0645\u062a \u0627\u0631\u062a" value={ohm + ' \u03a9'} cls={ohm > 5 ? 'danger' : 'ok'} />
            <InfoCard label="\u062a\u0639\u062f\u0627\u062f \u0645\u06cc\u0644\u0647" value={fmt(tower.grounding_rod_count)} />
            <div className="gm-info-card" style={{ gridColumn: 'span 2' }}>
              <div className="gm-info-label">\u0633\u0637\u062d \u0645\u0642\u0627\u0648\u0645\u062a (\u062d\u062f\u0627\u06a9\u062b\u0631 \u06f5 \u03a9)</div>
              <div className="gm-ohm-bar-bg" style={{ marginTop: 6 }}>
                <div className="gm-ohm-bar" style={{ width: pct + '%', background: barColor }} />
              </div>
              <div style={{ fontSize: 11, color: barColor, marginTop: 4 }}>{ohm} \u03a9</div>
            </div>
          </>
        ) : (
          <InfoCard label="\u0627\u0631\u062a" value="\u062b\u0628\u062a \u0646\u0634\u062f\u0647" cls="warn" />
        )}
      </div>
    </>
  );
}

export default function InfoDrawer({ open, onClose, type, data, extra }) {
  if (!open || !data) return null;
  const title = type === 'line' ? `\u062e\u0637: ${data.name || data.id}` : `\u062f\u06a9\u0644 #${data.number}`;

  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: '#00000055',
          zIndex: 8000, backdropFilter: 'blur(2px)',
        }}
      />
      {/* drawer */}
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
        `}</style>

        {/* header */}
        <div style={{
          padding: '16px 18px', borderBottom: '1px solid #334155',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #1e3a5f, #1e293b)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
            {type === 'line' ? '\u26a1' : '\ud83d\uddfc'} {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#64748b',
              fontSize: 20, cursor: 'pointer', width: 32, height: 32,
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >\u00d7</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          <style>{`.gm-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }`}</style>
          {type === 'line'
            ? <LineDrawerContent line={data} towerCount={extra?.towerCount ?? 0} />
            : <TowerDrawerContent tower={data} line={extra?.line} />
          }
        </div>
      </div>
    </>
  );
}
