import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import './PaymentPage.css';

function PaymentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        // Parse URL: /pay/{tenant_id}/{amount}/{timestamp}
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length < 5 || pathParts[1] !== 'pay') {
          setError('Invalid payment link');
          setLoading(false);
          return;
        }

        const tenantId = parseInt(pathParts[2]);
        const amount = parseFloat(pathParts[3]);
        const timestamp = pathParts[4];

        if (!tenantId || !amount || !timestamp) {
          setError('Invalid payment link parameters');
          setLoading(false);
          return;
        }

        // Load tenant data
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name, property, user_id')
          .eq('id', tenantId)
          .single();

        if (tenantError || !tenantData) {
          setError('Tenant not found');
          setLoading(false);
          return;
        }

        // For public payment page, we'll just show "Property Manager"
        // User data would require admin access, so we'll keep it simple
        let managerName = 'Property Manager';

        // Load payment request if it exists
        // Try to match by tenant_id, amount, and approximate timestamp
        const requestTimestamp = new Date(parseInt(timestamp));
        const { data: paymentRequest } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('amount', amount)
          .gte('created_at', new Date(requestTimestamp.getTime() - 60000).toISOString()) // Within 1 minute
          .lte('created_at', new Date(requestTimestamp.getTime() + 60000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setPaymentData({
          tenant: tenantData,
          amount,
          timestamp,
          paymentRequest: paymentRequest || null
        });
        setUserData({ name: managerName, email: '' });
      } catch (err) {
        console.error('Error loading payment data:', err);
        setError('Error loading payment information');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, []);

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="error-message">
            <h2>Payment Not Found</h2>
            <p>This payment link is invalid or has expired.</p>
          </div>
        </div>
      </div>
    );
  }

  const { tenant, amount, paymentRequest } = paymentData;
  const dueDate = paymentRequest?.due_date || null;

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>Payment Request</h1>
          <p className="property-manager-name">{userData?.name || 'Property Manager'}</p>
        </div>

        <div className="payment-details">
          <div className="payment-detail-item">
            <span className="detail-label">Tenant:</span>
            <span className="detail-value">{tenant.name}</span>
          </div>
          {tenant.property && (
            <div className="payment-detail-item">
              <span className="detail-label">Property:</span>
              <span className="detail-value">{tenant.property}</span>
            </div>
          )}
          <div className="payment-detail-item">
            <span className="detail-label">Amount Due:</span>
            <span className="detail-value amount">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {dueDate && (
            <div className="payment-detail-item">
              <span className="detail-label">Due Date:</span>
              <span className="detail-value">{new Date(dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {paymentRequest?.note && (
            <div className="payment-detail-item full-width">
              <span className="detail-label">Note:</span>
              <span className="detail-value">{paymentRequest.note}</span>
            </div>
          )}
        </div>

        <div className="payment-actions">
          <button 
            className="pay-button"
            onClick={() => {
              alert('Payment processing coming soon. Stripe integration will be available shortly.');
            }}
          >
            Pay Now
          </button>
        </div>

        <div className="payment-footer">
          <p>This is a secure payment request from your property manager.</p>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
