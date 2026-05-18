import { useState, useEffect } from 'react';
import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';
import SignatureCapture from '../../components/checklists/SignatureCapture.jsx';

// Four-step signing flow used at the end of the walkthrough. Handoff,
// tenant signature, PM signature, then PDF generation. onComplete fires
// after the PDF lands.

const STEP_HANDOFF = 'handoff';
const STEP_TENANT = 'tenant';
const STEP_PM = 'pm';
const STEP_PDF = 'pdf';
const STEP_DONE = 'done';

export function SignatureHandoff({ onSaveSignature, onGeneratePdf, onComplete, onCancel }) {
  const [step, setStep] = useState(STEP_HANDOFF);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [pdfResult, setPdfResult] = useState(null);

  const handleSign = async (dataUrl, type) => {
    setBusy(true);
    setError(null);
    try {
      await onSaveSignature(dataUrl, type);
      if (type === 'tenant') setStep(STEP_PM);
      else if (type === 'inspector') setStep(STEP_PDF);
    } catch (err) {
      console.error('[SignatureHandoff] save failed:', err);
      setError(err.message || 'Could not save the signature. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // Auto-run the PDF step when we land on it. PM doesn't need a button
  // press to generate the document, but they do need feedback that it
  // happened and a retry path if it failed.
  useEffect(() => {
    if (step !== STEP_PDF) return;
    let cancelled = false;
    setPdfError(null);
    setBusy(true);
    (async () => {
      try {
        const result = await onGeneratePdf();
        if (!cancelled) {
          setPdfResult(result);
          setStep(STEP_DONE);
        }
      } catch (err) {
        console.error('[SignatureHandoff] pdf failed:', err);
        if (!cancelled) setPdfError(err.message || 'Could not generate the PDF.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [step, onGeneratePdf]);

  if (step === STEP_PDF) {
    return (
      <SignatureScreen title="Saving PDF" subtitle="Generating the signed inspection report and uploading to storage.">
        {pdfError ? (
          <>
            <ErrorBanner message={pdfError} />
            <button type="button" onClick={() => { setPdfError(null); setStep(STEP_PDF); }} style={primaryButton()}>
              Try again
            </button>
            <button type="button" onClick={onCancel} style={secondaryButton()}>
              Close without PDF
            </button>
          </>
        ) : (
          <div style={{ fontSize: typography.sizes.sm, color: colors.neutral[500] }}>
            {busy ? 'Working' : 'Done'}
          </div>
        )}
      </SignatureScreen>
    );
  }

  if (step === STEP_DONE) {
    return (
      <SignatureScreen
        title="Inspection complete"
        subtitle={pdfResult ? `Saved as ${pdfResult.filename} and downloaded to your device.` : 'Signed and complete.'}
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
