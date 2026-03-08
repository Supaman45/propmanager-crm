import React from 'react';

const ScreeningReport = ({ applicationId, screeningResults, onRunScreening, loading = false }) => {
  if (!screeningResults) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 16px', fontSize: '16px', color: '#5f6368' }}>
          This application has not been screened yet.
        </p>
        <button className="btn-primary" onClick={onRunScreening} disabled={loading}>
          {loading ? 'Running AI Screening...' : 'Run AI Screening'}
        </button>
      </div>
    );
  }

  const getRiskColor = (riskLevel) => {
    const colors = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444'
    };
    return colors[riskLevel?.toLowerCase()] || '#9aa0a6';
  };

  const getRecommendationColor = (recommendation) => {
    const colors = {
      'approve': '#10b981',
      'conditional': '#f59e0b',
      'deny': '#ef4444'
    };
    return colors[recommendation?.toLowerCase()] || '#9aa0a6';
  };

  const getRecommendationLabel = (recommendation) => {
    const labels = {
      'approve': 'Approve',
      'conditional': 'Conditional Approval',
      'deny': 'Deny'
    };
    return labels[recommendation?.toLowerCase()] || recommendation;
  };

  // Calculate score for circular gauge
  const score = screeningResults.overall_score || 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div>
      {/* Summary Section */}
      <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #1a73e8 0%, #1e40af 100%)', color: 'white' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '500' }}>
          AI Screening Summary
        </h3>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, lineHeight: '1.6' }}>
          {screeningResults.summary_one_liner || screeningResults.summary || 'No summary available'}
        </p>
      </div>

      {/* Score and Recommendation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {/* Overall Score */}
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#5f6368', textTransform: 'uppercase' }}>
            Overall Score
          </p>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '24px',
              fontWeight: '600',
              color: '#202124'
            }}>
              {score}
            </div>
          </div>
        </div>

        {/* Risk Level */}
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#5f6368', textTransform: 'uppercase' }}>
            Risk Level
          </p>
          <div style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: '8px',
            background: getRiskColor(screeningResults.risk_level),
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {screeningResults.risk_level || 'Unknown'}
          </div>
        </div>

        {/* Recommendation */}
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#5f6368', textTransform: 'uppercase' }}>
            Recommendation
          </p>
          <div style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: '8px',
            background: getRecommendationColor(screeningResults.recommendation),
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {getRecommendationLabel(screeningResults.recommendation)}
          </div>
        </div>
      </div>

      {/* Detailed Analysis Sections */}
      {screeningResults.income_analysis && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#202124' }}>
            💰 Income Analysis
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368', lineHeight: '1.6' }}>
            {typeof screeningResults.income_analysis === 'string' 
              ? screeningResults.income_analysis 
              : JSON.stringify(screeningResults.income_analysis)}
          </p>
        </div>
      )}

      {screeningResults.rental_history_analysis && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#202124' }}>
            🏠 Rental History Analysis
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368', lineHeight: '1.6' }}>
            {typeof screeningResults.rental_history_analysis === 'string' 
              ? screeningResults.rental_history_analysis 
              : JSON.stringify(screeningResults.rental_history_analysis)}
          </p>
        </div>
      )}

      {screeningResults.employment_verification && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#202124' }}>
            💼 Employment Verification
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368', lineHeight: '1.6' }}>
            {typeof screeningResults.employment_verification === 'string' 
              ? screeningResults.employment_verification 
              : JSON.stringify(screeningResults.employment_verification)}
          </p>
        </div>
      )}

      {/* Red Flags */}
      {screeningResults.red_flags && screeningResults.red_flags.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
            ⚠️ Red Flags
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {screeningResults.red_flags.map((flag, index) => (
              <li key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#991b1b' }}>
                {typeof flag === 'string' ? flag : JSON.stringify(flag)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Summary */}
      {(screeningResults.summary_for_landlord || screeningResults.detailed_summary) && (
        <div className="card">
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#202124' }}>
            📋 Detailed Summary
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#5f6368', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {screeningResults.summary_for_landlord || screeningResults.detailed_summary}
          </p>
        </div>
      )}

      {/* Run Screening Button */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button className="btn-secondary" onClick={onRunScreening} disabled={loading}>
          {loading ? 'Running AI Screening...' : 'Re-run AI Screening'}
        </button>
      </div>
    </div>
  );
};

export default ScreeningReport;
