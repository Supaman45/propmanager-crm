import React, { useState, useEffect } from 'react';
import { useApplications } from '../../hooks/useApplications';
import { supabase } from '../../supabase';

const ApplicationForm = ({ applicationId, onSave, onCancel, properties = [], tenants = [] }) => {
  const { getApplication } = useApplications();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyId: null,
    unitNumber: '',
    // Step 1: Personal Info
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    dateOfBirth: '',
    ssnLastFour: '',
    // Step 2: Current Residence
    currentAddress: '',
    currentCity: '',
    currentState: '',
    currentZip: '',
    currentRent: '',
    currentLandlordName: '',
    currentLandlordPhone: '',
    monthsAtCurrentAddress: '',
    // Step 3: Employment
    employerName: '',
    employerPhone: '',
    jobTitle: '',
    monthlyIncome: '',
    employmentStartDate: '',
    additionalIncome: '',
    additionalIncomeSource: '',
    // Step 4: Additional Info
    hasEvictionHistory: false,
    evictionExplanation: '',
    hasCriminalHistory: false,
    criminalExplanation: '',
    hasBankruptcy: false,
    bankruptcyExplanation: '',
    // Step 5: Rental Preferences
    desiredMoveIn: '',
    numberOfOccupants: '',
    hasPets: false,
    petDetails: '',
    // General
    status: 'draft',
    notes: ''
  });

  const totalSteps = 5;

  useEffect(() => {
    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  const loadApplication = async () => {
    setLoading(true);
    try {
      const data = await getApplication(applicationId);
      setFormData({
        property_id: data.property_id,
        unit_number: data.unit_number || '',
        applicant_name: data.applicant_name || '',
        applicant_email: data.applicant_email || '',
        applicant_phone: data.applicant_phone || '',
        date_of_birth: data.date_of_birth || '',
        ssn_last_four: data.ssn_last_four || '',
        current_address: data.current_address || '',
        current_rent: data.current_rent || '',
        landlord_name: data.landlord_name || '',
        landlord_phone: data.landlord_phone || '',
        landlord_email: data.landlord_email || '',
        months_at_address: data.months_at_address || '',
        employer_name: data.employer_name || '',
        job_title: data.job_title || '',
        monthly_income: data.monthly_income || '',
        employment_start_date: data.employment_start_date || '',
        has_eviction_history: data.has_eviction_history || false,
        eviction_explanation: data.eviction_explanation || '',
        has_criminal_history: data.has_criminal_history || false,
        criminal_explanation: data.criminal_explanation || '',
        has_bankruptcy: data.has_bankruptcy || false,
        bankruptcy_explanation: data.bankruptcy_explanation || '',
        desired_move_in_date: data.desired_move_in_date || '',
        number_of_occupants: data.number_of_occupants || '',
        has_pets: data.has_pets || false,
        pet_details: data.pet_details || '',
        status: data.status || 'draft',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Error loading application:', error);
      alert('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (saveAsDraft = false) => {
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        status: saveAsDraft ? 'draft' : 'submitted'
      };
      await onSave(dataToSave);
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading && applicationId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '500', color: '#202124' }}>
          {applicationId ? 'Edit Application' : 'New Tenant Application'}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map(step => (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: step <= currentStep ? '#1a73e8' : '#e5e7eb',
                    color: step <= currentStep ? 'white' : '#9aa0a6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                <span style={{ fontSize: '12px', color: step <= currentStep ? '#1a73e8' : '#9aa0a6' }}>
                  {step === 1 && 'Personal'}
                  {step === 2 && 'Residence'}
                  {step === 3 && 'Employment'}
                  {step === 4 && 'History'}
                  {step === 5 && 'Preferences'}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: step < currentStep ? '#1a73e8' : '#e5e7eb',
                    margin: '0 8px',
                    marginTop: '-20px'
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Property Selection (always visible) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Property</label>
            <select
              value={formData.propertyId || ''}
              onChange={(e) => updateFormData('propertyId', e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select property</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.address}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Unit Number</label>
            <input
              type="text"
              value={formData.unitNumber}
              onChange={(e) => updateFormData('unitNumber', e.target.value)}
              placeholder="Unit number"
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="card" style={{ marginBottom: '24px' }}>
        {currentStep === 1 && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Personal Information
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.applicantName}
                  onChange={(e) => updateFormData('applicantName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.applicantEmail}
                  onChange={(e) => updateFormData('applicantEmail', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.applicantPhone}
                  onChange={(e) => updateFormData('applicantPhone', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>SSN Last 4 Digits</label>
                <input
                  type="text"
                  value={formData.ssnLastFour}
                  onChange={(e) => updateFormData('ssnLastFour', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="1234"
                />
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Current Residence
            </h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Current Address</label>
                <input
                  type="text"
                  value={formData.currentAddress}
                  onChange={(e) => updateFormData('currentAddress', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.currentCity}
                  onChange={(e) => updateFormData('currentCity', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.currentState}
                  onChange={(e) => updateFormData('currentState', e.target.value)}
                  maxLength={2}
                  placeholder="CA"
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  value={formData.currentZip}
                  onChange={(e) => updateFormData('currentZip', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Monthly Rent</label>
                <input
                  type="number"
                  value={formData.currentRent}
                  onChange={(e) => updateFormData('currentRent', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Months at Address</label>
                <input
                  type="number"
                  value={formData.monthsAtCurrentAddress}
                  onChange={(e) => updateFormData('monthsAtCurrentAddress', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Landlord Name</label>
                <input
                  type="text"
                  value={formData.currentLandlordName}
                  onChange={(e) => updateFormData('currentLandlordName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Landlord Phone</label>
                <input
                  type="tel"
                  value={formData.currentLandlordPhone}
                  onChange={(e) => updateFormData('currentLandlordPhone', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Employment Information
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Employer Name</label>
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => updateFormData('employerName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Employer Phone</label>
                <input
                  type="tel"
                  value={formData.employerPhone}
                  onChange={(e) => updateFormData('employerPhone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => updateFormData('jobTitle', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Monthly Income</label>
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => updateFormData('monthlyIncome', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Employment Start Date</label>
                <input
                  type="date"
                  value={formData.employmentStartDate}
                  onChange={(e) => updateFormData('employmentStartDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Additional Income</label>
                <input
                  type="number"
                  value={formData.additionalIncome}
                  onChange={(e) => updateFormData('additionalIncome', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Additional Income Source</label>
                <input
                  type="text"
                  value={formData.additionalIncomeSource}
                  onChange={(e) => updateFormData('additionalIncomeSource', e.target.value)}
                  placeholder="e.g., Investments, Side job"
                />
              </div>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Additional Information
            </h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.hasEvictionHistory}
                    onChange={(e) => updateFormData('hasEvictionHistory', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Has eviction history
                </label>
                {formData.hasEvictionHistory && (
                  <textarea
                    value={formData.evictionExplanation}
                    onChange={(e) => updateFormData('evictionExplanation', e.target.value)}
                    placeholder="Please explain..."
                    rows={3}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="form-group full-width">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.hasCriminalHistory}
                    onChange={(e) => updateFormData('hasCriminalHistory', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Has criminal history
                </label>
                {formData.hasCriminalHistory && (
                  <textarea
                    value={formData.criminalExplanation}
                    onChange={(e) => updateFormData('criminalExplanation', e.target.value)}
                    placeholder="Please explain..."
                    rows={3}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="form-group full-width">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.hasBankruptcy}
                    onChange={(e) => updateFormData('hasBankruptcy', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Has bankruptcy history
                </label>
                {formData.hasBankruptcy && (
                  <textarea
                    value={formData.bankruptcyExplanation}
                    onChange={(e) => updateFormData('bankruptcyExplanation', e.target.value)}
                    placeholder="Please explain..."
                    rows={3}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
              Rental Preferences
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Desired Move-in Date</label>
                <input
                  type="date"
                  value={formData.desiredMoveIn}
                  onChange={(e) => updateFormData('desiredMoveIn', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Number of Occupants</label>
                <input
                  type="number"
                  value={formData.numberOfOccupants}
                  onChange={(e) => updateFormData('numberOfOccupants', e.target.value)}
                  min="1"
                />
              </div>
              <div className="form-group full-width">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.hasPets}
                    onChange={(e) => updateFormData('hasPets', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Has pets
                </label>
                {formData.hasPets && (
                  <textarea
                    value={formData.petDetails}
                    onChange={(e) => updateFormData('petDetails', e.target.value)}
                    placeholder="Describe pets (type, size, number)..."
                    rows={3}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Additional notes..."
                  rows={4}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
        <div>
          {currentStep > 1 && (
            <button className="btn-secondary" onClick={() => setCurrentStep(currentStep - 1)}>
              ← Previous
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => handleSave(true)} disabled={loading}>
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          {currentStep < totalSteps ? (
            <button className="btn-primary" onClick={() => setCurrentStep(currentStep + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn-primary" onClick={() => handleSave(false)} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
