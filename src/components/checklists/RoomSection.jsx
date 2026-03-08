import React, { useState } from 'react';
import ChecklistItemRow from './ChecklistItemRow';

const RoomSection = ({ room, items, onItemUpdate, onItemDelete, onPhotoUpload, onPhotoDelete, onAddItem }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const roomItems = items.filter(item => item.room === room);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem({
        room,
        item_name: newItemName.trim(),
        condition: null,
        notes: null,
        photos: []
      });
      setNewItemName('');
      setShowAddItem(false);
    }
  };

  const getConditionCounts = () => {
    const counts = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      damaged: 0,
      missing: 0,
      'n/a': 0,
      unset: 0
    };

    roomItems.forEach(item => {
      if (item.condition) {
        counts[item.condition] = (counts[item.condition] || 0) + 1;
      } else {
        counts.unset += 1;
      }
    });

    return counts;
  };

  const counts = getConditionCounts();
  const totalItems = roomItems.length;
  const completedItems = totalItems - counts.unset;

  return (
    <div className="card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px',
          background: '#f8f9fa',
          borderBottom: isExpanded ? '1px solid #dadce0' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              {room}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5f6368' }}>
              {completedItems} of {totalItems} items completed
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {counts.excellent > 0 && (
            <span style={{ fontSize: '11px', color: '#10b981' }}>✓ {counts.excellent}</span>
          )}
          {counts.good > 0 && (
            <span style={{ fontSize: '11px', color: '#3b82f6' }}>✓ {counts.good}</span>
          )}
          {counts.fair > 0 && (
            <span style={{ fontSize: '11px', color: '#f59e0b' }}>⚠ {counts.fair}</span>
          )}
          {(counts.poor > 0 || counts.damaged > 0 || counts.missing > 0) && (
            <span style={{ fontSize: '11px', color: '#ef4444' }}>
              ⚠ {counts.poor + counts.damaged + counts.missing}
            </span>
          )}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: '#5f6368'
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Items */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          {roomItems.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#5f6368', textAlign: 'center', padding: '20px' }}>
              No items in this room yet
            </p>
          ) : (
            roomItems.map(item => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onUpdate={onItemUpdate}
                onDelete={onItemDelete}
                onPhotoUpload={onPhotoUpload}
                onPhotoDelete={onPhotoDelete}
              />
            ))
          )}

          {/* Add Item */}
          {showAddItem ? (
            <div className="card" style={{ marginTop: '8px', background: '#f8f9fa' }}>
              <div className="form-group">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter item name..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" onClick={handleAddItem} style={{ padding: '8px 16px' }}>
                  Add
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItemName('');
                  }}
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => setShowAddItem(true)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                marginTop: '8px'
              }}
            >
              + Add Item to {room}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomSection;
