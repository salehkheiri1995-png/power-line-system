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

// محدوده تقریبی استان آذربایجان شرقی
const BOUNDS = {
  latMin: 36.5,
  latMax: 39.5,
  lngMin: 45.5,
  lngMax: 48.5,
};

// تبدیل مختصات شماتیک (x,y) به طول/عرض جغرافیایی
function schematicToLatLng(x, y) {
  const lat = BOUNDS.latMin + (y / 550) * (BOUNDS.latMax - BOUNDS.latMin);
  const lng = BOUNDS.lngMin + (x / 900) * (BOUNDS.lngMax - BOUNDS.lngMin);
  return { lat, lng };
}

// آیکون سفارشی برای دکل‌ها
function towerIcon(isSelected, isUrgent) {
  return L.divIcon({
    className: 'tower-marker',
    html: `<div style="
      width: ${isSelected ? 20 : 14}px;
      height: ${isSelected ? 20 : 14}px;
      background: ${isSelected ? '#00f0ff' : isUrgent ? '#ef4444' : '#10b981'};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(0,0,0,0.6);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
    ">⚡</div>`,
    iconSize: [isSelected ? 20 : 14, isSelected ? 20 : 14],
    iconAnchor: [isSelected ? 10 : 7, isSelected ? 10 : 7],
    popupAnchor: [0, -10],
  });
}

// پرواز به دکل انتخاب‌شده
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
  const [lines, setLines] = useState([]);
  const [towers, setTowers] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [plannedTasks, setPlannedTasks] = useState([]);
  const [showLineModal, setShowLineModal] = useState(false);
  const [showTowerModal, setShowTowerModal] = useState(false);

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
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    return new Date(y + 621, m - 1, d);
  };

  // فیلتر دکل‌ها
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
      const to = filters.dateTo ? parseJalaliToDate(filters.dateTo) : null;
      result = result.filter(t => {
        const recs = maintenanceRecords.filter(r => r.tower_id === t.id);
        return recs.some(rec => {
          if (!rec.gregorian_date) return false;
          const d = new Date(rec.gregorian_date);
          if (from && d < from) return false;
          if (to && d > to) return false;
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
      const to = filters.dateTo ? parseJalaliToDate(filters.dateTo) : null;
      result = result.filter(p => {
        if (!p.gregorian_date) return false;
        const d = new Date(p.gregorian_date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    return result;
  }, [plannedTasks, filters]);

  const handleSelectLine = (lineId) => {
    setSelectedLineId(lineId);
    setSelectedTowerId(null);
  };

  const handleSelectTower = (towerId) => {
    setSelectedTowerId(towerId);
    const tower = towers.find(t => t.id === towerId);
    if (tower) setSelectedLineId(tower.line_id);
  };

  const getTowerUrgency = (tower) => {
    if (!tower.next_maintenance) return false;
    const next = parseJalaliToDate(tower.next_maintenance);
    if (!next) return false;
    const diffDays = (next - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', gap: '10px' }}>
      <div style={{ display: 'flex', flex: 1, gap: '10px', minHeight: 0 }}>
        {/* پنل چپ */}
        <div style={{ width: 260, background: 'rgba(15,23,42,0.9)', borderLeft: '1px solid #334155', borderRadius: 10, padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TowerFilterPanel lines={lines} onFilter={setFilters} />
          <button className="btn-glow" onClick={handleImport}>🔄 بارگذاری از رکوردها</button>
          <button className="btn-glow" style={{ background: '#3b82f6' }} onClick={() => setShowLineModal(true)}>➕ افزودن خط</button>
          <button className="btn-glow" style={{ background: '#f59e0b' }} onClick={async () => {
            await api.post('/lines-towers/update-all-tower-dates');
            loadData();
          }}>
            ⚡ محاسبه تعمیرات ضروری
          </button>
          <TowerTree
            lines={filteredLines}
            towers={filteredTowers}
            selectedLineId={selectedLineId}
            selectedTowerId={selectedTowerId}
            onSelectLine={handleSelectLine}
            onSelectTower={handleSelectTower}
          />
        </div>

        {/* پنل مرکز: نقشه */}
        <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
          <MapContainer
            center={[37.5, 47.0]}
            zoom={8}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToSelected towerId={selectedTowerId} towers={filteredTowers} />
            {filteredTowers.map(tower => {
              const pos = schematicToLatLng(tower.x, tower.y);
              const isSelected = selectedTowerId === tower.id;
              const isUrgent = getTowerUrgency(tower);
              return (
                <Marker
                  key={tower.id}
                  position={[pos.lat, pos.lng]}
                  icon={towerIcon(isSelected, isUrgent)}
                  eventHandlers={{
                    click: () => handleSelectTower(tower.id),
                  }}
                >
                  <Popup>
                    <div style={{ direction: 'rtl', fontFamily: 'Tahoma', fontSize: 13 }}>
                      <strong>🗼 دکل {tower.number}</strong><br />
                      <span>خط: {lines.find(l => l.id === tower.line_id)?.name}</span><br />
                      <span>آخرین تعمیر: {tower.last_maintenance || '—'}</span><br />
                      <span>موعد بعدی: {tower.next_maintenance || '—'}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#94a3b8', fontSize: 12, zIndex: 1000, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 6 }}>
            🖱️ اسکرول برای زوم | کلیک روی نشانگر برای جزئیات
          </div>
        </div>

        {/* پنل راست */}
        <div style={{ width: 320, background: 'rgba(15,23,42,0.9)', borderRight: '1px solid #334155', borderRadius: 10, padding: 10, overflowY: 'auto' }}>
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

      {/* جداول پایین */}
      <div style={{ display: 'flex', gap: 0, height: 220, borderTop: '2px solid #334155', marginTop: 10 }}>
        <UrgentMaintTable
          towers={filteredTowers}
          lines={filteredLines}
          plannedTasks={filteredPlannedTasks}
          viewMode={filters.viewMode}
          onDataChanged={loadData}
        />
        <PlannedTasksTable
          plannedTasks={filteredPlannedTasks}
          lines={filteredLines}
          towers={towers}
          filters={filters}
          onDataChanged={loadData}
        />
      </div>

      <TowerModals
        showLineModal={showLineModal} setShowLineModal={setShowLineModal}
        showTowerModal={showTowerModal} setShowTowerModal={setShowTowerModal}
        lines={lines} selectedLineId={selectedLineId}
        onDataChanged={loadData} />
    </div>
  );
}

export default TowerManagement;