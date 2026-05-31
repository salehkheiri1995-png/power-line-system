import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

function towerIcon(isSelected, isUrgent) {
  const size = isSelected ? 20 : 14;
  const cls  = isSelected ? 'selected' : isUrgent ? 'urgent' : 'normal';
  return L.divIcon({
    className: 'tower-marker',
    html: `<div class="tower-icon-html ${cls}" style="width:${size}px;height:${size}px;">⚡</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -10],
  });
}

function FlyToSelected({ towerId, towers }) {
  const map = useMap();
  useEffect(() => {
    if (towerId) {
      const tower = towers.find(t => t.id === towerId);
      if (tower) {
        const pos = schematicToLatLng(tower.x, tower.y);
        map.flyTo([pos.lat, pos.lng], 12, { duration: 1 });
      }
    }
  }, [towerId, towers, map]);
  return null;
}

function TowerManagement() {
  const [activeTab, setActiveTab] = useState('map');

  const [lines, setLines]                       = useState([]);
  const [towers, setTowers]                     = useState([]);
  const [selectedLineId, setSelectedLineId]     = useState(null);
  const [selectedTowerId, setSelectedTowerId]   = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [plannedTasks, setPlannedTasks]         = useState([]);
  const [showLineModal, setShowLineModal]       = useState(false);
  const [showTowerModal, setShowTowerModal]     = useState(false);

  const [filters, setFilters] = useState({
    viewMode: 'all',
    programType: '',
    lineName: '',
    voltage: '',
    location: '',
    dateFrom: '',
    dateTo: ''
  });

  const loadData = useCallback(async () => {
    try {
      const [linesRes, towersRes, recsRes, tasksRes] = await Promise.all([
        api.get('/lines-towers/lines'),
        api.get('/lines-towers/towers'),
        api.get('/lines-towers/maintenance-records'),
        api.get('/lines-towers/planned-tasks'),
      ]);
      setLines(linesRes.data);
      setTowers(towersRes.data);
      setMaintenanceRecords(recsRes.data);
      setPlannedTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleImport = async () => {
    await api.post('/lines-towers/import-from-records');
    loadData();
  };

  const parseJalaliToDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    return new Date(y + 621, m - 1, d);
  };

  const filteredTowers = useMemo(() => {
    let result = towers;
    if (filters.lineName) result = result.filter(t => t.line_id === filters.lineName);
    if (filters.voltage) {
      const lineIdsWithVoltage = lines
        .filter(l => l.voltage === parseInt(filters.voltage))
        .map(l => l.id);
      result = result.filter(t => lineIdsWithVoltage.includes(t.line_id));
    }
    if (filters.location) {
      const towerIdsWithLocation = maintenanceRecords
        .filter(rec => rec.location === filters.location)
        .map(rec => rec.tower_id);
      result = result.filter(t => towerIdsWithLocation.includes(t.id));
    }
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? parseJalaliToDate(filters.dateFrom) : null;
      const to   = filters.dateTo   ? parseJalaliToDate(filters.dateTo)   : null;
      result = result.filter(t => {
        const recs = maintenanceRecords.filter(r => r.tower_id === t.id);
        return recs.some(rec => {
          if (!rec.gregorian_date) return false;
          const d = new Date(rec.gregorian_date);
          if (from && d < from) return false;
          if (to   && d > to)   return false;
          return true;
        });
      });
    }
    return result;
  }, [towers, filters, lines, maintenanceRecords]);

  const filteredLines = useMemo(() => {
    const lineIds = new Set(filteredTowers.map(t => t.line_id));
    return lines.filter(l => lineIds.has(l.id));
  }, [lines, filteredTowers]);

  const filteredPlannedTasks = useMemo(() => {
    let result = plannedTasks;
    if (filters.lineName) result = result.filter(p => p.line_id === filters.lineName);
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? parseJalaliToDate(filters.dateFrom) : null;
      const to   = filters.dateTo   ? parseJalaliToDate(filters.dateTo)   : null;
      result = result.filter(p => {
        if (!p.gregorian_date) return false;
        const d = new Date(p.gregorian_date);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
        return true;
      });
    }
    return result;
  }, [plannedTasks, filters]);

  const handleSelectLine  = (lineId)  => { setSelectedLineId(lineId); setSelectedTowerId(null); };
  const handleSelectTower = (towerId) => {
    setSelectedTowerId(towerId);
    const tower = towers.find(t => t.id === towerId);
    if (tower) setSelectedLineId(tower.line_id);
  };

  const getTowerUrgency = (tower) => {
    if (!tower.next_maintenance) return false;
    const next = parseJalaliToDate(tower.next_maintenance);
    if (!next) return false;
    return (next - new Date()) / (1000 * 60 * 60 * 24) <= 30;
  };

  const urgentCount = useMemo(
    () => filteredTowers.filter(getTowerUrgency).length,
    [filteredTowers]
  );

  const openPlansCount = useMemo(
    () => filteredPlannedTasks.filter(p => p.status === 'planned').length,
    [filteredPlannedTasks]
  );

  return (
    <div className="tm-root">

      {/* ───── هدر + تب‌ها ───── */}
      <div className="tm-header">
        <div className="tm-header-right">
          <span className="tm-header-icon">🗺️</span>
          <div>
            <h2 className="tm-header-title">مدیریت خطوط و دکل‌ها</h2>
            <p className="tm-header-sub">
              {lines.length} خط | {towers.length} دکل
            </p>
          </div>
        </div>

        <div className="tm-header-actions">
          <button className="btn-glow btn-sm" onClick={handleImport} title="بارگذاری از رکوردها">
            🔄 بارگذاری
          </button>
          <button className="btn-glow btn-blue btn-sm" onClick={() => setShowLineModal(true)}>
            ➕ خط جدید
          </button>
          <button
            className="btn-glow btn-amber btn-sm"
            onClick={async () => {
              await api.post('/lines-towers/update-all-tower-dates');
              loadData();
            }}
          >
            ⚡ محاسبه ضروری
          </button>
        </div>
      </div>

      {/* ───── ناوبری تب ───── */}
      <div className="tm-tab-bar">
        <button
          className={`tm-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <span className="tm-tab-icon">🗺️</span>
          نقشه و درخت خطوط
        </button>
        <button
          className={`tm-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <span className="tm-tab-icon">📋</span>
          گزارش‌ها و برنامه‌ها
          {(urgentCount + openPlansCount) > 0 && (
            <span className="tm-tab-badge">{urgentCount + openPlansCount}</span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════
          تب ۱: نقشه
      ═══════════════════════════════════ */}
      {activeTab === 'map' && (
        <div className="tm-map-view">

          {/* ردیف فیلتر بالای نقشه */}
          <div className="tm-map-toolbar">
            <TowerFilterPanel lines={lines} onFilter={setFilters} compact />
          </div>

          {/* بدنه اصلی: درخت | نقشه | جزئیات */}
          <div className="tm-map-body">

            {/* پنل درخت خطوط */}
            <div className="tm-side-panel tm-side-left">
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

            {/* نقشه لیفلت */}
            <div className="tm-map-wrap">
              <MapContainer
                center={[37.5, 47.0]}
                zoom={8}
                className="tm-map-fill"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToSelected towerId={selectedTowerId} towers={filteredTowers} />
                {filteredTowers.map(tower => {
                  const pos        = schematicToLatLng(tower.x, tower.y);
                  const isSelected = selectedTowerId === tower.id;
                  const isUrgent   = getTowerUrgency(tower);
                  return (
                    <Marker
                      key={tower.id}
                      position={[pos.lat, pos.lng]}
                      icon={towerIcon(isSelected, isUrgent)}
                      eventHandlers={{ click: () => handleSelectTower(tower.id) }}
                    >
                      <Popup>
                        <div className="tower-popup-content">
                          <strong>🗼 دکل {tower.number}</strong>
                          <span>خط: {lines.find(l => l.id === tower.line_id)?.name}</span>
                          <span>آخرین تعمیر: {tower.last_maintenance || '—'}</span>
                          <span>موعد بعدی: {tower.next_maintenance || '—'}</span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              <div className="tm-map-hint">
                🖱️ اسکرول برای زوم &nbsp;|&nbsp; کلیک روی نشانگر برای جزئیات
              </div>
            </div>

            {/* پنل جزئیات دکل */}
            <div className="tm-side-panel tm-side-right">
              <div className="tm-side-header">
                <span>🔍 جزئیات</span>
              </div>
              <div className="tm-side-scroll">
                <TowerDetail
                  selectedLineId={selectedLineId}
                  selectedTowerId={selectedTowerId}
                  lines={filteredLines}
                  towers={filteredTowers}
                  maintenanceRecords={maintenanceRecords}
                  plannedTasks={filteredPlannedTasks}
                  onAddTower={(lineId) => { setSelectedLineId(lineId); setShowTowerModal(true); }}
                  onDataChanged={loadData}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          تب ۲: گزارش‌ها
      ═══════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="tm-reports-view">

          {/* کارت‌های خلاصه */}
          <div className="tm-kpi-row">
            <div className="tm-kpi-card tm-kpi-primary">
              <div className="tm-kpi-icon">🗼</div>
              <div className="tm-kpi-body">
                <div className="tm-kpi-val">{towers.length}</div>
                <div className="tm-kpi-label">کل دکل‌ها</div>
              </div>
            </div>
            <div className="tm-kpi-card tm-kpi-warning">
              <div className="tm-kpi-icon">⚠️</div>
              <div className="tm-kpi-body">
                <div className="tm-kpi-val">{urgentCount}</div>
                <div className="tm-kpi-label">تعمیر ضروری</div>
              </div>
            </div>
            <div className="tm-kpi-card tm-kpi-info">
              <div className="tm-kpi-icon">📅</div>
              <div className="tm-kpi-body">
                <div className="tm-kpi-val">{openPlansCount}</div>
                <div className="tm-kpi-label">برنامه باز</div>
              </div>
            </div>
            <div className="tm-kpi-card tm-kpi-success">
              <div className="tm-kpi-icon">⚡</div>
              <div className="tm-kpi-body">
                <div className="tm-kpi-val">{lines.length}</div>
                <div className="tm-kpi-label">خط انتقال</div>
              </div>
            </div>
          </div>

          {/* فیلتر گزارش */}
          <div className="tm-reports-filter">
            <TowerFilterPanel lines={lines} onFilter={setFilters} />
          </div>

          {/* جداول */}
          <div className="tm-reports-tables">
            <div className="tm-report-block">
              <UrgentMaintTable
                towers={filteredTowers}
                lines={filteredLines}
                plannedTasks={filteredPlannedTasks}
                viewMode={filters.viewMode}
                onDataChanged={loadData}
              />
            </div>
            <div className="tm-report-block">
              <PlannedTasksTable
                plannedTasks={filteredPlannedTasks}
                lines={filteredLines}
                towers={towers}
                filters={filters}
                onDataChanged={loadData}
              />
            </div>
          </div>
        </div>
      )}

      <TowerModals
        showLineModal={showLineModal}   setShowLineModal={setShowLineModal}
        showTowerModal={showTowerModal} setShowTowerModal={setShowTowerModal}
        lines={lines}
        selectedLineId={selectedLineId}
        onDataChanged={loadData}
      />
    </div>
  );
}

export default TowerManagement;
