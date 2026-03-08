import React, { useState, useEffect } from 'react';
import { useApplications } from '../hooks/useApplications';
import ApplicationList from '../components/applications/ApplicationList';
import ApplicationForm from '../components/applications/ApplicationForm';
import ApplicationDetail from '../components/applications/ApplicationDetail';
import { supabase } from '../supabase';
import { runTenantScreening } from '../utils/runTenantScreening';

const Applications = () => {
  const {
    applications,
    loading,
    error,
    getApplications,
    getApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    uploadDocument,
    deleteDocument,
    getDocuments,
    getScreeningResults,
    saveScreeningResults
  } = useApplications();

  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'detail'
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [screeningResults, setScreeningResults] = useState(null);
  const [screeningLoading, setScreeningLoading] = useState(false);

  useEffect(() => {
    loadProperties();
    loadTenants();
  }, []);

  useEffect(() => {
    if (view === 'detail' && selectedApplicationId) {
      loadApplicationDetail();
    }
  }, [view, selectedApplicationId]);

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

  const loadApplicationDetail = async () => {
    try {
      const app = await getApplication(selectedApplicationId);
      setCurrentApplication(app);

      const docs = await getDocuments(selectedApplicationId);
      setDocuments(docs);

      const results = await getScreeningResults(selectedApplicationId);
      setScreeningResults(results);
    } catch (error) {
      console.error('Error loading application detail:', error);
    }
  };

  const handleCreate = () => {
    setSelectedApplicationId(null);
    setView('create');
  };

  const handleEdit = (id) => {
    setSelectedApplicationId(id);
    setView('edit');
  };

  const handleView = (id) => {
    setSelectedApplicationId(id);
    setView('detail');
  };

  const handleDelete = async (id) => {
    try {
      await deleteApplication(id);
      await getApplications();
      if (view === 'detail' && selectedApplicationId === id) {
        setView('list');
        setSelectedApplicationId(null);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const handleSave = async (applicationData) => {
    try {
      if (selectedApplicationId) {
        await updateApplication(selectedApplicationId, applicationData);
      } else {
        const newApp = await createApplication(applicationData);
        setSelectedApplicationId(newApp.id);
      }
      await getApplications();
      setView('list');
      setSelectedApplicationId(null);
    } catch (error) {
      console.error('Error saving application:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setView('list');
    setSelectedApplicationId(null);
  };

  const handleScreen = async (id) => {
    setScreeningLoading(true);
    try {
      // Run AI screening via Supabase Edge Function
      const screeningResult = await runTenantScreening(id);
      
      // Refresh applications list
      await getApplications();
      
      // Reload detail view if currently viewing this application
      if (view === 'detail' && selectedApplicationId === id) {
        await loadApplicationDetail();
      }

      // Show success message
      alert('Screening completed successfully!');
    } catch (error) {
      console.error('Error running screening:', error);
      alert(`Failed to run screening: ${error.message}`);
    } finally {
      setScreeningLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, notes) => {
    try {
      await updateApplication(id, { status, notes });
      await getApplications();
      if (view === 'detail' && selectedApplicationId === id) {
        await loadApplicationDetail();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleUploadDocument = async (file, applicationId, documentType) => {
    try {
      await uploadDocument(file, applicationId, documentType);
      await loadApplicationDetail();
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleDeleteDocument = async (documentId, fileUrl) => {
    try {
      await deleteDocument(documentId, fileUrl);
      await loadApplicationDetail();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  const handleRunScreening = async () => {
    await handleScreen(selectedApplicationId);
  };

  if (loading && applications.length === 0 && view === 'list') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading applications...</p>
      </div>
    );
  }

  if (error && view === 'list') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ea4335' }}>Error: {error}</p>
        <button className="btn-primary" onClick={getApplications} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (view === 'create' || view === 'edit') {
    return (
      <ApplicationForm
        applicationId={selectedApplicationId}
        onSave={handleSave}
        onCancel={handleCancel}
        properties={properties}
        tenants={tenants}
      />
    );
  }

  if (view === 'detail') {
    return (
      <ApplicationDetail
        application={currentApplication}
        properties={properties}
        tenants={tenants}
        documents={documents}
        screeningResults={screeningResults}
        onUpdateStatus={handleUpdateStatus}
        onUploadDocument={handleUploadDocument}
        onDeleteDocument={handleDeleteDocument}
        onRunScreening={handleRunScreening}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <ApplicationList
      applications={applications}
      onView={handleView}
      onScreen={handleScreen}
      onDelete={handleDelete}
      onCreate={handleCreate}
      properties={properties}
    />
  );
};

export default Applications;
