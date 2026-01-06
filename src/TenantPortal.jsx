import React, { useState, useEffect } from 'react';
import './TenantPortal.css';
import { supabase } from './supabase';

function TenantPortal() {
  const [loggedInTenant, setLoggedInTenant] = useState(null);
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ issue: '', description: '', urgency: 'medium' });
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Check for access code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setAccessCode(code);
    }
  }, []);

  // Load maintenance requests when tenant is logged in
  useEffect(() => {
    if (loggedInTenant) {
      loadMaintenanceRequests();
    }
  }, [loggedInTenant]);

  const loadMaintenanceRequests = async () => {
    if (!loggedInTenant) return;
    
    try {
      // Note: We can't use RLS here since tenant portal doesn't have auth
      // We'll filter by tenant_id which should be safe since they logged in with access code
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', loggedInTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaintenanceRequests(data || []);
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !accessCode) {
      setError('Please enter both email and access code');
      return;
    }

    try {
      // Find tenant by email and access code
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('access_code', accessCode.trim())
        .single();

      if (error || !data) {
        setError('Invalid email or access code');
        return;
      }

      // Transform tenant data
      const tenant = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        property: data.property || '',
        rentAmount: parseFloat(data.rent_amount) || 0,
        securityDeposit: parseFloat(data.security_deposit) || 0,
        leaseStart: data.lease_start || '',
        leaseEnd: data.lease_end || '',
        status: data.status || 'prospect',
        paymentStatus: data.payment_status || 'n/a',
        paymentDate: data.payment_date || null,
        paymentLog: data.payment_log || []
      };

      setLoggedInTenant(tenant);
      setEmail('');
      setAccessCode('');
    } catch (error) {
      console.error('Login error:', error);
      setError('Error logging in. Please try again.');
    }
  };

  const handleSubmitMaintenanceRequest = async (e) => {
    e.preventDefault();
    
    if (!newRequest.issue.trim()) {
      setError('Please enter an issue title');
      return;
    }

    try {
      // Get the user_id from the tenant record to create the maintenance request
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('user_id')
        .eq('id', loggedInTenant.id)
        .single();

      if (tenantError || !tenantData) {
        throw new Error('Unable to verify tenant');
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .insert([{
          user_id: tenantData.user_id,
          tenant_id: loggedInTenant.id,
          tenant_name: loggedInTenant.name,
          property: loggedInTenant.property,
          issue: newRequest.issue,
          description: newRequest.description || null,
          priority: newRequest.urgency,
          status: 'open',
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      setNewRequest({ issue: '', description: '', urgency: 'medium' });
      setShowRequestForm(false);
      setError('');
      await loadMaintenanceRequests();
      alert('Maintenance request submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('Error submitting request. Please try again.');
    }
  };

  const getDaysRemaining = () => {
    if (!loggedInTenant?.leaseEnd) return null;
    const endDate = new Date(loggedInTenant.leaseEnd);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCurrentBalance = () => {
    if (!loggedInTenant) return 0;
    if (loggedInTenant.paymentStatus === 'late') {
      return loggedInTenant.rentAmount;
    }
    return 0;
  };

  if (!loggedInTenant) {
    return (
      <div className="tenant-portal">
        <div className="portal-container">
          <div className="portal-header">
            <div className="portal-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>PropManager</span>
            </div>
          </div>

          <div className="portal-content">
            <h1>Tenant Portal</h1>
            <p className="portal-subtitle">Enter your email and access code to view your account</p>

            <form onSubmit={handleLogin} className="portal-login-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Access Code</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter your access code"
                  required
                />
              </div>

              <button type="submit" className="btn-primary btn-full">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();
  const currentBalance = getCurrentBalance();

  return (
    <div className="tenant-portal">
      <div className="portal-container">
        <div className="portal-header">
          <div className="portal-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>PropManager</span>
          </div>
          <button 
            className="btn-secondary btn-small"
            onClick={() => {
              setLoggedInTenant(null);
              setMaintenanceRequests([]);
            }}
          >
            Logout
          </button>
        </div>

        <div className="portal-content">
          <h1>Welcome, {loggedInTenant.name}!</h1>

          {/* Account Summary */}
          <div className="portal-cards">
            <div className="portal-card">
              <div className="card-label">Property / Unit</div>
              <div className="card-value">{loggedInTenant.property || 'Not assigned'}</div>
            </div>

            <div className="portal-card">
              <div className="card-label">Current Balance</div>
              <div className="card-value">${currentBalance.toLocaleString()}</div>
            </div>

            <div className="portal-card">
              <div className="card-label">Payment Status</div>
              <div className="card-value">
                <span className={`status-badge ${loggedInTenant.paymentStatus}`}>
                  {loggedInTenant.paymentStatus === 'paid' ? 'Paid' : 
                   loggedInTenant.paymentStatus === 'late' ? 'Late' : 'Unpaid'}
                </span>
              </div>
            </div>

            {daysRemaining !== null && (
              <div className="portal-card">
                <div className="card-label">Days Remaining</div>
                <div className="card-value">{daysRemaining > 0 ? daysRemaining : 'Expired'}</div>
              </div>
            )}
          </div>

          {/* Lease Information */}
          <div className="portal-section">
            <h2>Lease Information</h2>
            <div className="lease-info">
              <div className="info-row">
                <span className="info-label">Lease Start:</span>
                <span className="info-value">
                  {loggedInTenant.leaseStart ? new Date(loggedInTenant.leaseStart).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Lease End:</span>
                <span className="info-value">
                  {loggedInTenant.leaseEnd ? new Date(loggedInTenant.leaseEnd).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Monthly Rent:</span>
                <span className="info-value">${loggedInTenant.rentAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="portal-section">
            <h2>Payment History</h2>
            {loggedInTenant.paymentLog && loggedInTenant.paymentLog.length > 0 ? (
              <div className="payment-history">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loggedInTenant.paymentLog.slice().reverse().map((payment, index) => (
                      <tr key={payment.id || index}>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>${payment.amount.toLocaleString()}</td>
                        <td>{payment.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No payment history available</p>
            )}
          </div>

          {/* Maintenance Requests */}
          <div className="portal-section">
            <div className="section-header-row">
              <h2>Maintenance Requests</h2>
              <button 
                className="btn-primary btn-small"
                onClick={() => setShowRequestForm(!showRequestForm)}
              >
                {showRequestForm ? 'Cancel' : 'New Request'}
              </button>
            </div>

            {showRequestForm && (
              <form onSubmit={handleSubmitMaintenanceRequest} className="maintenance-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label>Issue Title</label>
                  <input
                    type="text"
                    value={newRequest.issue}
                    onChange={(e) => setNewRequest({...newRequest, issue: e.target.value})}
                    placeholder="e.g., Leaky faucet in kitchen"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                    placeholder="Describe the issue in detail..."
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Urgency</label>
                  <select
                    value={newRequest.urgency}
                    onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary btn-full">
                  Submit Request
                </button>
              </form>
            )}

            {maintenanceRequests.length > 0 ? (
              <div className="maintenance-list">
                {maintenanceRequests.map(request => (
                  <div key={request.id} className="maintenance-item">
                    <div className="maintenance-header">
                      <h3>{request.issue}</h3>
                      <span className={`status-badge ${request.status}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.description && (
                      <p className="maintenance-description">{request.description}</p>
                    )}
                    <div className="maintenance-meta">
                      <span>Priority: {request.priority}</span>
                      <span>Submitted: {new Date(request.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No maintenance requests</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantPortal;
