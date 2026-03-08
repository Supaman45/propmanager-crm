import React, { useState } from 'react';

const ApplicationList = ({ applications, onView, onScreen, onDelete, onCreate, properties = [] }) => {
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApplications = applications.filter(application => {
    // Filter by status
    if (statusFilter !== 'all' && application.status !== statusFilter) {
      return false;
    }

    // Filter by property
    if (propertyFilter !== 'all' && application.property_id !== parseInt(propertyFilter)) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ((application.applicant_name || `${application.first_name || ''} ${application.last_name || ''}`.trim()) && (application.applicant_name || `${application.first_name || ''} ${application.last_name || ''}`.trim()).toLowerCase().includes(query)) ||
        ((application.applicant_email || application.email) && (application.applicant_email || application.email).toLowerCase().includes(query)) ||
        ((application.applicant_phone || application.phone) && (application.applicant_phone || application.phone).includes(query)) ||
        (properties.find(p => p.id === application.property_id)?.address?.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      draft: { background: '#f3f4f6', color: '#6b7280' },
      submitted: { background: '#dbeafe', color: '#1e40af' },
      documents_pending: { background: '#fef3c7', color: '#92400e' },
      screening: { background: '#e9d5ff', color: '#6b21a8' },
      approved: { background: '#d1fae5', color: '#065f46' },
      conditionally_approved: { background: '#fed7aa', color: '#9a3412' },
      denied: { background: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.draft;
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        ...style
      }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '500', marginBottom: '4px', margin: 0, color: '#202124' }}>Tenant Applications</h1>
          <p style={{ color: '#5f6368', fontSize: '14px', margin: '4px 0 0' }}>
            {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={onCreate}>
          + New Application
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 16px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'All Status' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'documents_pending', label: 'Documents Pending' },
            { value: 'screening', label: 'Screening' },
            { value: 'approved', label: 'Approved' },
            { value: 'conditionally_approved', label: 'Conditional' },
            { value: 'denied', label: 'Denied' }
          ].map(option => (
            <button
              key={option.value}
              className={statusFilter === option.value ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setStatusFilter(option.value)}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {option.label}
            </button>
          ))}
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '13px',
              background: 'white'
            }}
          >
            <option value="all">All Properties</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.address}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#5f6368' }}>
            {searchQuery ? 'No applications found matching your search' : 'No applications yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredApplications.map(application => {
            const property = properties.find(p => p.id === application.property_id);
            const score = application.screening_results?.[0]?.overall_score;
            
            return (
              <div key={application.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {getStatusBadge(application.status)}
                      {score !== undefined && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: '#f8f9fa',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: getScoreColor(score)
                        }}>
                          Score: {score}
                        </div>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '500', color: '#202124' }}>
                      {application.applicant_name || `${application.first_name || ''} ${application.last_name || ''}`.trim() || 'Unnamed Applicant'}
                    </h3>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#5f6368' }}>
                      {property ? property.address : 'No Property Selected'} {application.unit_number && `- Unit ${application.unit_number}`}
                    </p>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#9aa0a6' }}>
                      {application.applicant_email || application.email} • {application.applicant_phone || application.phone}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9aa0a6' }}>
                      Applied: {new Date(application.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => onView(application.id)}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      View
                    </button>
                    {application.status === 'submitted' && (
                      <button
                        className="btn-primary"
                        onClick={() => onScreen(application.id)}
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        Screen
                      </button>
                    )}
                    <button
                      className="btn-text"
                      onClick={() => {
                        if (window.confirm('Delete this application?')) {
                          onDelete(application.id);
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: '13px', color: '#ea4335' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {application.application_documents && application.application_documents.length > 0 && (
                  <div style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#5f6368' }}>
                      {application.application_documents.length} document{application.application_documents.length !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationList;
