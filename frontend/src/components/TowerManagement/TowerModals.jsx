import React, { useState } from 'react';
import api from '../../api';

function TowerModals({ showLineModal, setShowLineModal, showTowerModal, setShowTowerModal, lines, selectedLineId, onDataChanged }) {
  const [newLineName, setNewLineName] = useState('');
  const [newLineVoltage, setNewLineVoltage] = useState(0);
  const [newTowerNumber, setNewTowerNumber] = useState('');
  const [newTowerX, setNewTowerX] = useState(0);
  const [newTowerY, setNewTowerY] = useState(0);

  const handleAddLine = async () => {
    if (!newLineName) return;
    const colors = [
      { color_class: 'c1', color_hex: '#3b82f6' },
      { color_class: 'c2', color_hex: '#f59e0b' },
      { color_class: 'c3', color_hex: '#8b5cf6' },
      { color_class: 'c4', color_hex: '#10b981' },
    ];
    const idx = lines.length % 4;
    await api.post('/lines-towers/lines', {
      id: newLineName, name: newLineName, voltage: parseInt(newLineVoltage),
      ...colors[idx],
    });
    setShowLineModal(false);
    setNewLineName('');
    onDataChanged();
  };

  const handleAddTower = async () => {
    if (!selectedLineId || !newTowerNumber) return;
    const towerId = `${selectedLineId}||${newTowerNumber}`;
    await api.post('/lines-towers/towers', {
      id: towerId, line_id: selectedLineId, number: parseInt(newTowerNumber),
      x: parseFloat(newTowerX), y: parseFloat(newTowerY),
    });
    setShowTowerModal(false);
    setNewTowerNumber('');
    onDataChanged();
  };

  return (
    <>
      {showLineModal && (
        <div style={overlayStyle} onClick={() => setShowLineModal(false)}>
          <div className="glass-card" style={modalStyle} onClick={e => e.stopPropagation()}>
            <h4>افزودن خط</h4>
            <input placeholder="نام خط" value={newLineName} onChange={e => setNewLineName(e.target.value)} style={inputStyle} />
            <input placeholder="ولتاژ (kV)" type="number" value={newLineVoltage} onChange={e => setNewLineVoltage(e.target.value)} style={inputStyle} />
            <button className="btn-glow" onClick={handleAddLine}>ذخیره</button>
          </div>
        </div>
      )}
      {showTowerModal && (
        <div style={overlayStyle} onClick={() => setShowTowerModal(false)}>
          <div className="glass-card" style={modalStyle} onClick={e => e.stopPropagation()}>
            <h4>افزودن دکل به {selectedLineId}</h4>
            <input placeholder="شماره دکل" value={newTowerNumber} onChange={e => setNewTowerNumber(e.target.value)} style={inputStyle} />
            <input placeholder="مختصات X" type="number" value={newTowerX} onChange={e => setNewTowerX(e.target.value)} style={inputStyle} />
            <input placeholder="مختصات Y" type="number" value={newTowerY} onChange={e => setNewTowerY(e.target.value)} style={inputStyle} />
            <button className="btn-glow" onClick={handleAddTower}>ذخیره</button>
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
};
const modalStyle = { padding: 20, borderRadius: 12, width: '90%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 };
const inputStyle = {
  padding: 10, background: 'rgba(10,15,25,0.8)', border: '1px solid rgba(0,240,255,0.3)',
  borderRadius: 8, color: '#e0f0ff',
};

export default TowerModals;