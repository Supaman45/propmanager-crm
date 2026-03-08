import React, { useState, useEffect } from 'react';
import { useChecklists } from '../hooks/useChecklists';
import ChecklistList from '../components/checklists/ChecklistList';
import ChecklistForm from '../components/checklists/ChecklistForm';
import { supabase } from '../supabase';

const Checklists = () => {
  const { checklists, loading, error, fetchChecklists, createChecklist, updateChecklist, deleteChecklist } = useChecklists();
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'view'
  const [selectedChecklistId, setSelectedChecklistId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    loadProperties();
    loadTenants();
  }, []);

  const loadProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadTenants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const handleCreate = () => {
    setSelectedChecklistId(null);
    setView('create');
  };

  const handleEdit = (id) => {
    setSelectedChecklistId(id);
    setView('edit');
  };

  const handleView = (id) => {
    setSelectedChecklistId(id);
    setView('view');
  };

  const handleDelete = async (id) => {
    try {
      await deleteChecklist(id);
      await fetchChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      alert('Failed to delete checklist');
    }
  };

  const handleSave = async (checklistData) => {
    try {
      if (selectedChecklistId) {
        await updateChecklist(selectedChecklistId, checklistData);
      } else {
        await createChecklist(checklistData);
      }
      await fetchChecklists();
      setView('list');
      setSelectedChecklistId(null);
    } catch (error) {
      console.error('Error saving checklist:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setView('list');
    setSelectedChecklistId(null);
  };

  if (loading && checklists.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading checklists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ea4335' }}>Error: {error}</p>
        <button className="btn-primary" onClick={fetchChecklists} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (view === 'create' || view === 'edit') {
    return (
      <ChecklistForm
        checklistId={selectedChecklistId}
        onSave={handleSave}
        onCancel={handleCancel}
        properties={properties}
        tenants={tenants}
      />
    );
  }

  if (view === 'view') {
    // For now, view mode just shows the form in read-only
    // You can enhance this later with a dedicated view component
    return (
      <ChecklistForm
        checklistId={selectedChecklistId}
        onSave={handleSave}
        onCancel={handleCancel}
        properties={properties}
        tenants={tenants}
      />
    );
  }

  return (
    <ChecklistList
      checklists={checklists}
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
      properties={properties}
    />
  );
};

export default Checklists;
