import { useState } from 'react';
import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';
import SignatureCapture from '../../components/checklists/SignatureCapture.jsx';

// Two-step signing flow used at the end of the walkthrough. Step 1 is the
// hand-off card (give the phone to the tenant). Step 2 is the tenant
// signature pad. Step 3 is the PM signature pad. onComplete fires after
// both signatures land.

const STEP_HANDOFF = 'handoff';
const STEP_TENANT = 'tenant';
const STEP_PM = 'pm';
const STEP_DONE = 'done';

export function SignatureHandoff({ onSaveSignature, onComplete, onCancel }) {
  const [step, setStep] = useState(STEP_HANDOFF);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSign = async (dataUrl, type) => {
    setBusy(true);
    setError(null);
    try {
      await onSaveSignature(dataUrl, type);
      if (type === 'tenant') setStep(STEP_PM);
      else if (type === 'inspector') setStep(STEP_DONE);
    } catch (err) {
      console.error('[SignatureHandoff] save failed:', err);
      setError(err.message || 'Could not save the signature. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (step === STEP_DONE) {
    return (
      <SignatureScreen
        title="Inspection complete"
        subtitle="Generating PDF and uploading"
      >
        <button
          type="button"
          onClick={onComplete}
          style={primaryButton()}
        >
          Finish
        </button>
      </SignatureScreen>
    );
  }

  if (step === STEP_HANDOFF) {
    return (
      <SignatureScreen
        title="Please hand the phone to the tenant"
        subtitle="The tenant signs first, then you sign. Both signatures and timestamps will appear on the PDF."
      >
        <button type="button" onClick={() => setStep(STEP_TENANT)} style={primaryButton()}>
          Tenant is ready to sign
        </button>
        <button type="button" onClick={onCancel} style={secondaryButton()}>
          Not now, go back
        </button>
      </SignatureScreen>
    );
  }

  if (step === STEP_TENANT) {
    return (
      <SignatureScreen
        title="Tenant signature"
        subtitle="Sign with your finger, then tap Save"
      >
        {error ? <ErrorBanner message={error} /> : null}
        <SignatureCapture
          label="Tenant"
          disabled={busy}
          onSave={(dataUrl) => handleSign(dataUrl, 'tenant')}
        />
      </SignatureScreen>
    );
  }

  if (step === STEP_PM) {
    return (
      <SignatureScreen
        title="Property manager signature"
        subtitle="Sign to confirm the inspection"
      >
        {error ? <ErrorBanner message={error} /> : null}
        <SignatureCapture
          label="Property manager"
          disabled={busy}
          onSave={(dataUrl) => handleSign(dataUrl, 'inspector')}
        />
      </SignatureScreen>
    );
  }

  return null;
}

function SignatureScreen({ title, subtitle, children }) {
  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
      fontFamily: typography.fontFamily
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: typography.sizes['2xl'], fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>
          {title}
        </h1>
        {subtitle ? (
          <p style={{ margin: `${spacing.xs}px 0 0`, fontSize: typography.sizes.base, color: colors.neutral[500], lineHeight: 1.4 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      padding: spacing.md,
      background: 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${colors.status.danger}`,
      borderRadius: radius.md,
      color: colors.status.danger,
      fontSize: typography.sizes.sm
    }}>
      {message}
    </div>
  );
}

function primaryButton() {
  return {
    width: '100%',
    minHeight: 56,
    background: colors.brand.primary,
    color: colors.surface.background,
    border: 'none',
    borderRadius: radius.lg,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    boxShadow: shadow.sm,
    cursor: 'pointer'
  };
}

function secondaryButton() {
  return {
    minHeight: 48,
    background: colors.surface.background,
    color: colors.neutral[700],
    border: `1px solid ${colors.surface.border}`,
    borderRadius: radius.md,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    cursor: 'pointer'
  };
}
