import React, { useState, useEffect } from 'react';
import RoomSection from './RoomSection';
import SignatureCapture from './SignatureCapture';
import { useChecklists } from '../../hooks/useChecklists';
import { supabase } from '../../supabase';
import { generateChecklistPDF } from '../../utils/generateChecklistPDF';

const DEFAULT_ITEMS = {
  'Living Room': ['Walls & Paint', 'Ceiling', 'Flooring/Carpet', 'Windows & Screens', 'Window Coverings/Blinds', 'Light Fixtures', 'Electrical Outlets', 'Doors', 'Smoke Detector'],
  'Kitchen': ['Walls & Paint', 'Ceiling', 'Flooring', 'Countertops', 'Cabinets', 'Sink & Faucet', 'Garbage Disposal', 'Dishwasher', 'Refrigerator', 'Stove/Oven', 'Range Hood/Vent', 'Microwave', 'Light Fixtures'],
  'Primary Bedroom': ['Walls & Paint', 'Ceiling', 'Flooring/Carpet', 'Windows & Screens', 'Window Coverings/Blinds', 'Closet', 'Closet Doors', 'Light Fixtures', 'Electrical Outlets', 'Smoke Detector'],
  'Bedroom 2': ['Walls & Paint', 'Ceiling', 'Flooring/Carpet', 'Windows & Screens', 'Closet', 'Light Fixtures', 'Electrical Outlets'],
  'Primary Bathroom': ['Walls & Paint', 'Ceiling', 'Flooring', 'Toilet', 'Sink & Faucet', 'Vanity/Cabinet', 'Mirror', 'Bathtub/Shower', 'Shower Door/Curtain Rod', 'Tile & Grout', 'Exhaust Fan', 'Light Fixtures'],
  'Bathroom 2': ['Walls & Paint', 'Flooring', 'Toilet', 'Sink & Faucet', 'Mirror', 'Bathtub/Shower', 'Exhaust Fan'],
  'Laundry Area': ['Walls & Paint', 'Flooring', 'Washer Hookups', 'Dryer Hookups/Vent', 'Utility Sink', 'Cabinets/Shelving'],
  'Garage': ['Garage Door', 'Garage Door Opener', 'Flooring', 'Walls', 'Light Fixtures', 'Electrical Outlets'],
  'Exterior': ['Front Door', 'Back Door', 'Patio/Deck', 'Landscaping', 'Sprinkler System', 'Fencing/Gates', 'Exterior Lighting'],
  'General': ['HVAC System', 'Water Heater', 'Thermostat', 'Keys Provided', 'Garage Remotes', 'Mailbox Keys']
};

// Helper function to generate temp IDs
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initialize default items for new checklist
const initializeDefaultItems = () => {
  const items = [];
  let sortOrder = 0;
  
  Object.keys(DEFAULT_ITEMS).forEach(room => {
    DEFAULT_ITEMS[room].forEach(itemName => {
      items.push({
        id: generateTempId(),
        room: room,
        item_name: itemName,
        condition: null,
        notes: '',
        photos: [],
        sort_order: sortOrder++
      });
    });
  });
  
  return items;
};

const ChecklistForm = ({ checklistId, onSave, onCancel, properties = [], tenants = [] }) => {
  const { fetchChecklist, saveChecklistItem, deleteChecklistItem, uploadPhoto, uploadSignature, deletePhoto } = useChecklists();
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState(null);
  const [formData, setFormData] = useState({
    property_id: null,
    tenant_id: null,
    unit_number: '',
    inspection_type: 'move_in',
    inspection_date: new Date().toISOString().split('T')[0],
    inspector_name: '',
    tenant_present: false,
    overall_condition: '',
    notes: '',
    status: 'draft',
    tenant_signature_url: null,
    inspector_signature_url: null
  });
  const [items, setItems] = useState(() => {
    // Initialize with default items if creating a new checklist
    if (!checklistId) {
      return initializeDefaultItems();
    }
    return [];
  });

  const standardRooms = [
    'Living Room',
    'Kitchen',
    'Primary Bedroom',
    'Bedroom 2',
    'Primary Bathroom',
    'Bathroom 2',
    'Laundry Area',
    'Garage',
    'Exterior',
    'General'
  ];

  useEffect(() => {
    if (checklistId) {
      loadChecklist();
    }
    // For new checklists, items are already initialized in useState
  }, [checklistId]);

  const loadChecklist = async () => {
    setLoading(true);
    try {
      const data = await fetchChecklist(checklistId);
      setChecklist(data);
      setFormData({
        property_id: data.property_id,
        tenant_id: data.tenant_id,
        unit_number: data.unit_number || '',
        inspection_type: data.inspection_type || 'move_in',
        inspection_date: data.inspection_date || new Date().toISOString().split('T')[0],
        inspector_name: data.inspector_name || '',
        tenant_present: data.tenant_present || false,
        overall_condition: data.overall_condition || '',
        notes: data.notes || '',
        status: data.status || 'draft',
        tenant_signature_url: data.tenant_signature_url,
        inspector_signature_url: data.inspector_signature_url
      });
      setItems(data.checklist_items || []);
    } catch (error) {
      console.error('Error loading checklist:', error);
      alert('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleItemUpdate = async (updatedItem) => {
    if (!checklistId) {
      // For new checklists, just update local state
      setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
      return;
    }

    try {
      await saveChecklistItem(checklistId, updatedItem);
      setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleItemDelete = async (itemId) => {
    if (!checklistId) {
      // For new checklists, just remove from local state
      setItems(items.filter(item => item.id !== itemId));
      return;
    }

    try {
      await deleteChecklistItem(itemId);
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleAddItem = async (newItem) => {
    if (!checklistId) {
      // For new checklists, add to local state with temp ID
      const tempItem = { 
        ...newItem, 
        id: generateTempId(),
        condition: newItem.condition || null,
        notes: newItem.notes || '',
        photos: newItem.photos || [],
        sort_order: items.length
      };
      setItems([...items, tempItem]);
      return;
    }

    try {
      await saveChecklistItem(checklistId, newItem);
      await loadChecklist();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handlePhotoUpload = async (file, itemId) => {
    if (!checklistId) {
      // For new checklists, convert to data URL and store locally
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    try {
      const photoUrl = await uploadPhoto(file, checklistId, itemId);
      return photoUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const handlePhotoDelete = async (photoUrl) => {
    if (!checklistId) {
      // For new checklists, just return (photo is only in local state)
      return;
    }

    try {
      await deletePhoto(photoUrl);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  };

  const handleSignatureSave = async (dataUrl, signatureType) => {
    if (!dataUrl) {
      setFormData({ ...formData, [signatureType]: null });
      return;
    }

    if (!checklistId) {
      setFormData({ ...formData, [signatureType]: dataUrl });
      return;
    }

    try {
      const signatureUrl = await uploadSignature(dataUrl, checklistId, signatureType);
      setFormData({ ...formData, [signatureType]: signatureUrl });
    } catch (error) {
      console.error('Error uploading signature:', error);
      alert('Failed to upload signature');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare items for saving - remove temp IDs and ensure proper structure
      const itemsToSave = items.map(item => ({
        room: item.room,
        item_name: item.item_name,
        condition: item.condition || null,
        notes: item.notes || null,
        photos: item.photos || (item.checklist_photos ? item.checklist_photos.map(p => p.photo_url) : []),
        sort_order: item.sort_order
      }));

      const checklistData = {
        ...formData,
        items: itemsToSave
      };
      await onSave(checklistData);
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Failed to save checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Prepare checklist data for PDF export
      // If checklist is loaded, use it; otherwise use form data and items
      const checklistData = checklist || {
        ...formData,
        checklist_items: items.map(item => ({
          id: item.id,
          room: item.room,
          item_name: item.item_name,
          condition: item.condition,
          notes: item.notes,
          checklist_photos: item.photos ? item.photos.map(url => ({ photo_url: url })) : (item.checklist_photos || [])
        }))
      };

      await generateChecklistPDF(checklistData, properties, tenants);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading && !checklist) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading checklist...</p>
      </div>
    );
  }

  const rooms = [...new Set(items.map(item => item.room))];
  const allRooms = [...new Set([...standardRooms, ...rooms])];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '500', color: '#202124' }}>
          {checklistId ? 'Edit Checklist' : 'New Inspection Checklist'}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>
          {formData.inspection_type === 'move_in' ? 'Move-in Inspection' : 'Move-out Inspection'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
          Basic Information
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Inspection Type</label>
            <select
              value={formData.inspection_type}
              onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value })}
            >
              <option value="move_in">Move-in</option>
              <option value="move_out">Move-out</option>
            </select>
          </div>
          <div className="form-group">
            <label>Inspection Date</label>
            <input
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Property</label>
            <select
              value={formData.property_id || ''}
              onChange={(e) => setFormData({ ...formData, property_id: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">Select property</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.address}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tenant</label>
            <select
              value={formData.tenant_id || ''}
              onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">Select tenant</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Unit Number</label>
            <input
              type="text"
              value={formData.unit_number}
              onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
              placeholder="Unit number"
            />
          </div>
          <div className="form-group">
            <label>Inspector Name</label>
            <input
              type="text"
              value={formData.inspector_name}
              onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
              placeholder="Inspector name"
            />
          </div>
          <div className="form-group">
            <label>Overall Condition</label>
            <select
              value={formData.overall_condition}
              onChange={(e) => setFormData({ ...formData, overall_condition: e.target.value })}
            >
              <option value="">Select condition</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>
              <input
                type="checkbox"
                checked={formData.tenant_present}
                onChange={(e) => setFormData({ ...formData, tenant_present: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Tenant Present
            </label>
          </div>
          <div className="form-group full-width">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
          Inspection Items by Room
        </h3>
        {allRooms.map(room => (
          <RoomSection
            key={room}
            room={room}
            items={items}
            onItemUpdate={handleItemUpdate}
            onItemDelete={handleItemDelete}
            onPhotoUpload={handlePhotoUpload}
            onPhotoDelete={handlePhotoDelete}
            onAddItem={handleAddItem}
          />
        ))}
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
          Signatures
        </h3>
        <div className="form-grid">
          <SignatureCapture
            label="Tenant Signature"
            onSave={(dataUrl) => handleSignatureSave(dataUrl, 'tenant_signature_url')}
            existingSignature={formData.tenant_signature_url}
          />
          <SignatureCapture
            label="Inspector Signature"
            onSave={(dataUrl) => handleSignatureSave(dataUrl, 'inspector_signature_url')}
            existingSignature={formData.inspector_signature_url}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          className="btn-secondary"
          onClick={handleExportPDF}
          disabled={items.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export PDF
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Checklist'}
        </button>
      </div>
    </div>
  );
};

export default ChecklistForm;
