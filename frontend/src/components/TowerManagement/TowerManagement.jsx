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

  return (
    <div className="tower-layout">
      <div className="tower-main-row">
        {/* پنل چپ */}
        <div className="tower-panel-left">
          <TowerFilterPanel lines={lines} onFilter={setFilters} />
          <button className="btn-glow" onClick={handleImport}>
            🔄 بارگذاری از رکوردها
          </button>
          <button className="btn-glow btn-blue" onClick={() => setShowLineModal(true)}>
            ➕ افزودن خط
          </button>
          <button
            className="btn-glow btn-amber"
            onClick={async () => {
              await api.post('/lines-towers/update-all-tower-dates');
              loadData();
            }}
          >
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

        {/* نقشه */}
        <div className="tower-map-container">
          <MapContainer
            center={[37.5, 47.0]}
            zoom={8}
            className="tower-map-fill"
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
          <div className="tower-map-hint">
            🖱️ اسکرول برای زوم | کلیک روی نشانگر برای جزئیات
          </div>
        </div>

        {/* پنل راست */}
        <div className="tower-panel-right">
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
      <div className="tower-bottom-row">
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
