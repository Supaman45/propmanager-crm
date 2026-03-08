import React, { useState } from 'react';

const ChecklistItemRow = ({ item, onUpdate, onDelete, onPhotoUpload, onPhotoDelete }) => {
  const [condition, setCondition] = useState(item.condition || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', color: '#10b981' },
    { value: 'good', label: 'Good', color: '#3b82f6' },
    { value: 'fair', label: 'Fair', color: '#f59e0b' },
    { value: 'poor', label: 'Poor', color: '#ef4444' },
    { value: 'damaged', label: 'Damaged', color: '#dc2626' },
    { value: 'missing', label: 'Missing', color: '#7c3aed' },
    { value: 'n/a', label: 'N/A', color: '#94a3b8' }
  ];

  const handleConditionChange = (newCondition) => {
    setCondition(newCondition);
    if (onUpdate) {
      onUpdate({
        ...item,
        condition: newCondition
      });
    }
  };

  const handleNotesChange = (newNotes) => {
    setNotes(newNotes);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...item,
        condition,
        notes
      });
    }
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const photoUrl = await onPhotoUpload(file, item.id);
      const existingPhotos = item.checklist_photos ? item.checklist_photos.map(p => p.photo_url) : [];
      const updatedPhotos = [...existingPhotos, photoUrl];
      if (onUpdate) {
        onUpdate({
          ...item,
          photos: updatedPhotos
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePhotoDelete = async (photoUrl) => {
    if (window.confirm('Delete this photo?')) {
      try {
        await onPhotoDelete(photoUrl);
        const existingPhotos = item.checklist_photos ? item.checklist_photos.map(p => p.photo_url) : [];
        const updatedPhotos = existingPhotos.filter(p => p !== photoUrl);
        if (onUpdate) {
          onUpdate({
            ...item,
            photos: updatedPhotos
          });
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Failed to delete photo');
      }
    }
  };

  const selectedCondition = conditionOptions.find(opt => opt.value === condition);
  const photos = item.checklist_photos || (item.photos ? item.photos.map(p => ({ photo_url: p })) : []);

  return (
    <div className="card" style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#202124' }}>
            {item.item_name}
          </p>
        </div>
        <select
          value={condition}
          onChange={(e) => handleConditionChange(e.target.value)}
          className="form-group"
          style={{
            padding: '8px 12px',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            fontSize: '13px',
            minWidth: '140px',
            background: 'white',
            color: '#202124',
            cursor: 'pointer'
          }}
        >
          <option value="">Select condition</option>
          {conditionOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {selectedCondition && (
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: selectedCondition.color
          }} />
        )}
      </div>

      {isEditing ? (
        <div style={{ marginTop: '8px' }}>
          <div className="form-group">
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes..."
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn-primary" onClick={handleSave} style={{ padding: '8px 16px' }}>
              Save
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setNotes(item.notes || '');
              }}
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          {notes && (
            <p style={{ margin: 0, fontSize: '13px', color: '#5f6368', flex: 1 }}>
              {notes}
            </p>
          )}
          <button
            className="btn-text"
            onClick={() => setIsEditing(true)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            {notes ? 'Edit' : 'Add Notes'}
          </button>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {photos.map((photo, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img
                  src={photo.photo_url}
                  alt={`Photo ${idx + 1}`}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #dadce0'
                  }}
                />
                <button
                  onClick={() => handlePhotoDelete(photo.photo_url)}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ea4335',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '12px' }}>
        <label
          className="btn-secondary"
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.5 : 1
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? 'Uploading...' : '+ Add Photo'}
        </label>
      </div>

      {onDelete && (
        <button
          onClick={() => {
            if (window.confirm('Delete this item?')) {
              onDelete(item.id);
            }
          }}
          className="btn-text"
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            fontSize: '12px',
            color: '#ea4335'
          }}
        >
          Delete Item
        </button>
      )}
    </div>
  );
};

export default ChecklistItemRow;
