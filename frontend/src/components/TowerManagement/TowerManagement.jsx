import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../api';
import TowerTree from './TowerTree';
import TowerDetail from './TowerDetail';
import TowerModals from './TowerModals';
import TowerFilterPanel from './TowerFilterPanel';
import UrgentMaintTable from './UrgentMaintTable';
import PlannedTasksTable from './PlannedTasksTable';

const BOUNDS = {
  latMin: 36.5, latMax: 39.5,
  lngMin: 45.5, lngMax: 48.5,
};

function schematicToLatLng(x, y) {
  const lat = BOUNDS.latMin + (y / 550) * (BOUNDS.latMax - BOUNDS.latMin);
  const lng = BOUNDS.lngMin + (x / 900) * (BOUNDS.lngMax - BOUNDS.lngMin);
  return { lat, lng };
}

function towerPosition(tower) {
  if (tower.latitude && tower.longitude && tower.latitude !== 0 && tower.longitude !== 0) {
    return { lat: tower.latitude, lng: tower.longitude, isGps: true };
  }
  return { ...schematicToLatLng(tower.x ?? 0, tower.y ?? 0), isGps: false };
}

function towerIcon(isSelected, isUrgent, isGps) {
  const size = isSelected ? 22 : 15;
  const cls  = isSelected ? 'selected' : isUrgent ? 'urgent' : 'normal';
  const dot  = isGps
    ? `<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);
         width:6px;height:6px;border-radius:50%;background:#4ade80;border:1px solid #166534;"></div>`
    : '';
  return L.divIcon({
    className: 'tower-marker',
    html: `<div class="tower-icon-html ${cls}" style="width:${size}px;height:${size}px;position:relative;">⚡${dot}</div>`,
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -12],
  });
}

function FlyToSelected({ towerId, towers }) {
  const map = useMap();
  useEffect(() => {
    if (!towerId) return;
    const t = towers.find(t => t.id === towerId);
    if (!t) return;
    const pos = towerPosition(t);
    map.flyTo([pos.lat, pos.lng], pos.isGps ? 14 : 12, { duration: 1 });
  }, [towerId, towers, map]);
  return null;
}

// دکمه‌ای که داخل Popup رندر می‌شه و GPS رو ذخیره می‌کنه
function SaveGpsButton({ tower, lat, lng, onSaved }) {
  const [status, setStatus] = useState(null); // null | 'saving' | 'ok' | 'err'

  const save = async () => {
    setStatus('saving');
    try {
      await api.put(`/lines-towers/towers/${tower.id}/gps`, {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
      });
      setStatus('ok');
      setTimeout(() => onSaved(), 600);
    } catch {
      setStatus('err');
    }
  };

  if (status === 'ok')  return <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✓ GPS ذخیره شد!</span>;
  if (status === 'err') return <span style={{ color: '#dc2626', fontSize: 12 }}>❌ خطا</span>;

  return (
    <button
      onClick={save}
      disabled={status === 'saving'}
      style={{
        marginTop: 6, width: '100%',
        background: '#16a34a', color: '#fff',
        border: 'none', borderRadius: 6,
        padding: '5px 0', fontSize: 12,
        cursor: status === 'saving' ? 'wait' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {status === 'saving' ? 'ذخیره...' : '📍 ثبت این مکان به‌عنوان GPS'}
    </button>
  );
}

function TowerManagement() {
  const [activeTab, setActiveTab] = useState('map');
  const [reportsTab, setReportsTab] = useState('urgent');
  const [lines, setLines] = useState([]);
  const [towers, setTowers] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [plannedTasks, setPlannedTasks] = useState([]);
  const [showLineModal, setShowLineModal] = useState(false);
  const [showTowerModal, setShowTowerModal] = useState(false);
  const [filters, setFilters] = useState({
    viewMode: 'all', programType: '', lineName: '',
    voltage: '', location: '', dateFrom: '', dateTo: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [lR, tR, rR, pR] = await Promise.all([
        api.get('/lines-towers/lines'),
        api.get('/lines-towers/towers'),
        api.get('/lines-towers/maintenance-records'),
        api.get('/lines-towers/planned-tasks'),
      ]);
      setLines(lR.data);
      setTowers(tR.data);
      setMaintenanceRecords(rR.data);
      setPlannedTasks(pR.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const parseJalaliToDate = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split('/').map(Number);
    return new Date(y + 621, m - 1, d);
  };

  const filteredTowers = useMemo(() => {
    let r = towers;
    if (filters.lineName) r = r.filter(t => t.line_id === filters.lineName);
    if (filters.voltage) {
      const ids = lines.filter(l => l.voltage === parseInt(filters.voltage)).map(l => l.id);
      r = r.filter(t => ids.includes(t.line_id));
    }
    if (filters.location) {
      const ids = maintenanceRecords.filter(x => x.location === filters.location).map(x => x.tower_id);
      r = r.filter(t => ids.includes(t.id));
    }
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? parseJalaliToDate(filters.dateFrom) : null;
      const to   = filters.dateTo   ? parseJalaliToDate(filters.dateTo)   : null;
      r = r.filter(t => maintenanceRecords.filter(x => x.tower_id === t.id).some(x => {
        if (!x.gregorian_date) return false;
        const d = new Date(x.gregorian_date);
        return (!from || d >= from) && (!to || d <= to);
      }));
    }
    return r;
  }, [towers, filters, lines, maintenanceRecords]);

  const filteredLines = useMemo(() => {
    const ids = new Set(filteredTowers.map(t => t.line_id));
    return lines.filter(l => ids.has(l.id));
  }, [lines, filteredTowers]);

  const filteredPlannedTasks = useMemo(() => {
    let r = plannedTasks;
    if (filters.lineName) r = r.filter(p => p.line_id === filters.lineName);
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? parseJalaliToDate(filters.dateFrom) : null;
      const to   = filters.dateTo   ? parseJalaliToDate(filters.dateTo)   : null;
      r = r.filter(p => {
        if (!p.gregorian_date) return false;
        const d = new Date(p.gregorian_date);
        return (!from || d >= from) && (!to || d <= to);
      });
    }
    return r;
  }, [plannedTasks, filters]);

  const handleSelectLine   = id => { setSelectedLineId(id); setSelectedTowerId(null); };
  const handleSelectTower  = id => {
    setSelectedTowerId(id);
    const t = towers.find(t => t.id === id);
    if (t) setSelectedLineId(t.line_id);
  };

  const getTowerUrgency = t => {
    if (!t.next_maintenance) return false;
    const n = parseJalaliToDate(t.next_maintenance);
    return n && (n - new Date()) / 86400000 <= 30;
  };

  const urgentCount    = useMemo(() => filteredTowers.filter(getTowerUrgency).length, [filteredTowers]);
  const openPlansCount = useMemo(() => filteredPlannedTasks.filter(p => p.status === 'planned').length, [filteredPlannedTasks]);
  const gpsCount       = useMemo(() => towers.filter(t => t.latitude && t.latitude !== 0).length, [towers]);

  return (
    <div className="tm-root">
      <div className="tm-header">
        <div className="tm-header-right">
          <span className="tm-header-icon">🗺️</span>
          <div>
            <h2 className="tm-header-title">مدیریت خطوط و دکل‌ها</h2>
            <p className="tm-header-sub">
              {lines.length} خط | {towers.length} دکل
              {gpsCount > 0 && <span style={{ marginRight: 8, color: '#4ade80', fontSize: 11 }}>📍 {gpsCount} GPS واقعی</span>}
            </p>
          </div>
        </div>
        <div className="tm-header-actions">
          <button className="btn-glow btn-sm" onClick={async () => { await api.post('/lines-towers/import-from-records'); loadData(); }}>
            🔄 بارگذاری
          </button>
          <button className="btn-glow btn-blue btn-sm" onClick={() => setShowLineModal(true)}>➕ خط جدید</button>
          <button className="btn-glow btn-amber btn-sm" onClick={async () => { await api.post('/lines-towers/update-all-tower-dates'); loadData(); }}>
            ⚡ محاسبه ضروری
          </button>
        </div>
      </div>

      <div className="tm-tab-bar">
        <button className={`tm-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
          <span className="tm-tab-icon">🗺️</span>نقشه و درخت خطوط
        </button>
        <button className={`tm-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <span className="tm-tab-icon">📋</span>گزارش‌ها و برنامه‌ها
          {(urgentCount + openPlansCount) > 0 && <span className="tm-tab-badge">{urgentCount + openPlansCount}</span>}
        </button>
      </div>

      {activeTab === 'map' && (
        <div className="tm-map-view">
          <div className="tm-map-toolbar">
            <TowerFilterPanel lines={lines} onFilter={setFilters} compact />
          </div>

          {/* راهنما */}
          <div style={{
            display: 'flex', gap: 16, padding: '5px 14px',
            background: 'rgba(59,130,246,0.06)', borderBottom: '1px solid rgba(59,130,246,0.12)',
            fontSize: 11, color: '#94a3b8', alignItems: 'center',
          }}>
            <span>📍 نقطه سبز = GPS واقعی</span>
            <span>⚠️ بدون نقطه = تقریبی</span>
            <span style={{ color: '#4ade80' }}>← روی دکل کلیک کن و با دکمه سبز GPS رو ثبت کن</span>
          </div>

          <div className="tm-map-shell">
            <div className="tm-map-main">
              <div className="tm-map-wrap">
                <MapContainer center={[37.5, 47.0]} zoom={8} className="tm-map-fill" scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FlyToSelected towerId={selectedTowerId} towers={filteredTowers} />

                  {filteredTowers.map(tower => {
                    const pos        = towerPosition(tower);
                    const isSelected = selectedTowerId === tower.id;
                    const isUrgent   = getTowerUrgency(tower);
                    const line       = lines.find(l => l.id === tower.line_id);

                    return (
                      <Marker
                        key={tower.id}
                        position={[pos.lat, pos.lng]}
                        icon={towerIcon(isSelected, isUrgent, pos.isGps)}
                        eventHandlers={{ click: () => handleSelectTower(tower.id) }}
                      >
                        <Popup minWidth={180}>
                          <div style={{ fontFamily: 'inherit', direction: 'rtl', minWidth: 170 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>🗼 دکل {tower.number}</div>
                            <div style={{ fontSize: 11, color: '#475569' }}>خط: {line?.name || tower.line_id}</div>

                            {pos.isGps ? (
                              <div style={{ color: '#16a34a', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                                📍 GPS: {Number(tower.latitude).toFixed(5)}, {Number(tower.longitude).toFixed(5)}
                              </div>
                            ) : (
                              <div style={{ marginTop: 4 }}>
                                <div style={{ color: '#92400e', fontSize: 11, marginBottom: 4 }}>
                                  ⚠️ مکان تقریبی — برای ثبت GPS کلیک کن:
                                </div>
                                <SaveGpsButton
                                  tower={tower}
                                  lat={pos.lat}
                                  lng={pos.lng}
                                  onSaved={loadData}
                                />
                              </div>
                            )}

                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, borderTop: '1px solid #e2e8f0', paddingTop: 4 }}>
                              <div>آخرین تعمیر: {tower.last_maintenance || '—'}</div>
                              <div>موعد بعدی: {tower.next_maintenance || '—'}</div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
                <div className="tm-map-hint">🖱️ اسکرول برای زوم &nbsp;|&nbsp; کلیک روی دکل برای جزئیات</div>
              </div>

              <div className="tm-detail-bottom">
                <div className="tm-side-header"><span>🔍 جزئیات کامل دکل / خط</span></div>
                <div className="tm-side-scroll tm-detail-scroll">
                  <TowerDetail
                    selectedLineId={selectedLineId}
                    selectedTowerId={selectedTowerId}
                    lines={filteredLines}
                    towers={filteredTowers}
                    maintenanceRecords={maintenanceRecords}
                    plannedTasks={filteredPlannedTasks}
                    onAddTower={lineId => { setSelectedLineId(lineId); setShowTowerModal(true); }}
                    onDataChanged={loadData}
                  />
                </div>
              </div>
            </div>

            <aside className="tm-control-rail">
              <div className="tm-side-panel tm-side-right tm-side-compact">
                <div className="tm-side-header">
                  <span>📡 خطوط و دکل‌ها</span>
                  <span className="tm-side-count">{filteredTowers.length}</span>
                </div>
                <div className="tm-side-scroll">
                  <TowerTree
                    lines={filteredLines}
                    towers={filteredTowers}
                    selectedLineId={selectedLineId}
                    selectedTowerId={selectedTowerId}
                    onSelectLine={handleSelectLine}
                    onSelectTower={handleSelectTower}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="tm-reports-view">
          <div className="tm-kpi-row">
            <div className="tm-kpi-card tm-kpi-primary">
              <div className="tm-kpi-icon">🗼</div>
              <div className="tm-kpi-body"><div className="tm-kpi-val">{towers.length}</div><div className="tm-kpi-label">کل دکل‌ها</div></div>
            </div>
            <div className="tm-kpi-card tm-kpi-warning">
              <div className="tm-kpi-icon">⚠️</div>
              <div className="tm-kpi-body"><div className="tm-kpi-val">{urgentCount}</div><div className="tm-kpi-label">تعمیر ضروری</div></div>
            </div>
            <div className="tm-kpi-card tm-kpi-info">
              <div className="tm-kpi-icon">📅</div>
              <div className="tm-kpi-body"><div className="tm-kpi-val">{openPlansCount}</div><div className="tm-kpi-label">برنامه باز</div></div>
            </div>
            <div className="tm-kpi-card tm-kpi-success">
              <div className="tm-kpi-icon">⚡</div>
              <div className="tm-kpi-body"><div className="tm-kpi-val">{lines.length}</div><div className="tm-kpi-label">خط انتقال</div></div>
            </div>
          </div>
          <div className="tm-reports-filter"><TowerFilterPanel lines={lines} onFilter={setFilters} /></div>
          <div className="tm-report-switcher">
            <button className={`tm-report-switch ${reportsTab === 'urgent' ? 'active' : ''}`} onClick={() => setReportsTab('urgent')}>⚠️ تعمیرات ضروری</button>
            <button className={`tm-report-switch ${reportsTab === 'planned' ? 'active' : ''}`} onClick={() => setReportsTab('planned')}>📅 برنامه‌ریزی شده</button>
          </div>
          <div className="tm-report-single">
            <div className="tm-report-block tm-report-block-single">
              {reportsTab === 'urgent'
                ? <UrgentMaintTable towers={filteredTowers} lines={filteredLines} plannedTasks={filteredPlannedTasks} viewMode={filters.viewMode} onDataChanged={loadData} />
                : <PlannedTasksTable plannedTasks={filteredPlannedTasks} lines={filteredLines} towers={towers} filters={filters} onDataChanged={loadData} />
              }
            </div>
          </div>
        </div>
      )}

      <TowerModals
        showLineModal={showLineModal} setShowLineModal={setShowLineModal}
        showTowerModal={showTowerModal} setShowTowerModal={setShowTowerModal}
        lines={lines} selectedLineId={selectedLineId} onDataChanged={loadData}
      />
    </div>
  );
}

export default TowerManagement;
