import React, { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import ScreeningReport from './ScreeningReport';

const ApplicationDetail = ({ 
  application, 
  properties = [], 
  tenants = [],
  documents = [],
  screeningResults,
  onUpdateStatus,
  onUploadDocument,
  onDeleteDocument,
  onRunScreening,
  onEdit,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');

  const property = properties.find(p => p.id === application?.property_id);

  const handleStatusUpdate = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    let newStatus = '';
    if (statusAction === 'approve') {
      newStatus = 'approved';
    } else if (statusAction === 'conditional') {
      newStatus = 'conditionally_approved';
    } else if (statusAction === 'deny') {
      newStatus = 'denied';
    }

    if (newStatus) {
      await onUpdateStatus(application.id, newStatus, statusNotes);
      setShowStatusModal(false);
      setStatusNotes('');
      setStatusAction(null);
    }
  };

  if (!application) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Application not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '500', color: '#202124' }}>
            {application.applicantName || `${application.first_name || ''} ${application.last_name || ''}`.trim() || 'Unnamed Applicant'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>
            {property ? property.address : 'No Property Selected'} {application.unit_number && `- Unit ${application.unit_number}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => onEdit(application.id)}>
            Edit
          </button>
          <button
            className="btn-text"
            onClick={() => {
              if (window.confirm('Delete this application?')) {
                onDelete(application.id);
              }
            }}
            style={{ color: '#ea4335' }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status Actions */}
      {application.status === 'approved' || application.status === 'conditionally_approved' || application.status === 'denied' ? (
        <div className="card" style={{ marginBottom: '24px', background: '#f8f9fa' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>
            Status: <strong>{application.status.replace('_', ' ').toUpperCase()}</strong>
          </p>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500', color: '#202124' }}>
            Application Actions
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => handleStatusUpdate('approve')}
              style={{ background: '#10b981' }}
            >
              Approve
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleStatusUpdate('conditional')}
              style={{ background: '#f59e0b', color: 'white' }}
            >
              Conditionally Approve
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleStatusUpdate('deny')}
              style={{ background: '#ef4444', color: 'white' }}
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'documents', label: 'Documents' },
            { id: 'screening', label: 'Screening Report' },
            { id: 'references', label: 'References' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #1a73e8' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab.id ? '#1a73e8' : '#5f6368',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Name</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.applicantName || `${application.first_name || ''} ${application.last_name || ''}`.trim() || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Email</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.applicantEmail || application.email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Phone</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.applicantPhone || application.phone || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Date of Birth</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.date_of_birth || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>SSN Last 4</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.ssn_last_four || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Current Residence
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div className="full-width">
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Address</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>
                  {[
                    application.currentAddress || application.current_address,
                    application.currentCity || application.current_city,
                    application.currentState || application.current_state,
                    application.currentZip || application.current_zip
                  ].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Monthly Rent</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>${application.currentRent || application.current_rent || '0'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Months at Address</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.monthsAtCurrentAddress || application.months_at_current_address || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Landlord Name</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.currentLandlordName || application.current_landlord_name || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Landlord Phone</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.currentLandlordPhone || application.current_landlord_phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Employment Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Employer</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.employerName || application.employer_name || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Employer Phone</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.employerPhone || application.employer_phone || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Job Title</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.jobTitle || application.job_title || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Monthly Income</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>${application.monthlyIncome || application.monthly_income || '0'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Additional Income</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>${application.additionalIncome || application.additional_income || '0'} {application.additionalIncomeSource || application.additional_income_source ? `(${application.additionalIncomeSource || application.additional_income_source})` : ''}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Start Date</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.employmentStartDate || application.employment_start_date || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Rental Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Desired Move-in Date</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.desiredMoveIn || application.desired_move_in || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Number of Occupants</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{application.numberOfOccupants || application.number_of_occupants || 'N/A'}</p>
              </div>
              <div className="full-width">
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9aa0a6' }}>Has Pets</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#202124' }}>{(application.hasPets || application.has_pets) ? 'Yes' : 'No'}</p>
                {(application.hasPets || application.has_pets) && (application.petDetails || application.pet_details) && (
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#5f6368' }}>{application.petDetails || application.pet_details}</p>
                )}
              </div>
            </div>
          </div>

          {((application.hasEvictionHistory || application.has_eviction_history) || (application.hasCriminalHistory || application.has_criminal_history) || (application.hasBankruptcy || application.has_bankruptcy)) && (
            <div className="card" style={{ marginBottom: '16px', background: '#fef2f2' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#dc2626' }}>
                Additional Information
              </h3>
              {(application.hasEvictionHistory || application.has_eviction_history) && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>Eviction History</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>{application.evictionExplanation || application.eviction_explanation || 'No explanation provided'}</p>
                </div>
              )}
              {(application.hasCriminalHistory || application.has_criminal_history) && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>Criminal History</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>{application.criminalExplanation || application.criminal_explanation || 'No explanation provided'}</p>
                </div>
              )}
              {(application.hasBankruptcy || application.has_bankruptcy) && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>Bankruptcy History</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>{application.bankruptcyExplanation || application.bankruptcy_explanation || 'No explanation provided'}</p>
                </div>
              )}
            </div>
          )}

          {application.notes && (
            <div className="card">
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
                Notes
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#5f6368', whiteSpace: 'pre-wrap' }}>{application.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <DocumentUpload
          applicationId={application.id}
          documents={documents}
          onUpload={onUploadDocument}
          onDelete={onDeleteDocument}
        />
      )}

      {activeTab === 'screening' && (
        <ScreeningReport
          applicationId={application.id}
          screeningResults={screeningResults}
          onRunScreening={onRunScreening}
        />
      )}

      {activeTab === 'references' && (
        <div className="card">
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>
            Rental references feature coming soon.
          </p>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '500', color: '#202124' }}>
              {statusAction === 'approve' && 'Approve Application'}
              {statusAction === 'conditional' && 'Conditionally Approve Application'}
              {statusAction === 'deny' && 'Deny Application'}
            </h3>
            <div className="form-group full-width">
              <label>Notes (optional)</label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this decision..."
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmStatusUpdate}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;
