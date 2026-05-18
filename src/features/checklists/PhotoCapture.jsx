import { useRef, useState } from 'react';
import { colors, spacing, radius, typography } from '../../shared/styles/tokens.js';

// Photo capture and thumbnail strip for one item. Opens the native camera
// on mobile via accept and capture attributes, falls back to file picker
// on desktop. Failed uploads stay in a retry queue per item so the PM
// doesn't lose progress.

export function PhotoCapture({ photos = [], onPick, onRemove, uploading, failed = [], onRetry, onClearFailure }) {
  const fileInputRef = useRef(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const handlePick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && onPick) onPick(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <button
        type="button"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        disabled={uploading}
        style={{
          minHeight: 48,
          padding: `${spacing.sm}px ${spacing.lg}px`,
          background: uploading ? colors.neutral[200] : colors.neutral[100],
          color: colors.neutral[900],
          border: `1px dashed ${colors.surface.border}`,
          borderRadius: radius.md,
          cursor: uploading ? 'progress' : 'pointer',
          fontFamily: typography.fontFamily,
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.medium,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm
        }}
      >
        {uploading ? 'Uploading' : photos.length > 0 ? 'Add another photo' : 'Take a photo'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePick}
        style={{ display: 'none' }}
      />

      {photos.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          gap: spacing.xs
        }}>
          {photos.map((p, idx) => {
            const url = p.photo_url || p.url || p;
            const key = p.id || url || idx;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setConfirmRemove(p)}
                style={{
                  position: 'relative',
                  padding: 0,
                  border: `1px solid ${colors.surface.border}`,
                  borderRadius: radius.md,
                  overflow: 'hidden',
                  background: colors.neutral[100],
                  cursor: 'pointer',
                  aspectRatio: '1 / 1'
                }}
              >
                <img
                  src={url}
                  alt="Inspection photo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {failed.length > 0 ? (
        <div style={{
          padding: spacing.sm,
          background: 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${colors.status.danger}`,
          borderRadius: radius.md,
          color: colors.status.danger,
          fontSize: typography.sizes.sm
        }}>
          {failed.length} photo {failed.length === 1 ? 'upload' : 'uploads'} failed.{' '}
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.status.danger,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontFamily: typography.fontFamily,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold
            }}
          >
            Retry
          </button>
          {onClearFailure ? (
            <>
              {' or '}
              <button
                type="button"
                onClick={onClearFailure}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.status.danger,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: typography.fontFamily,
                  fontSize: typography.sizes.sm
                }}
              >
                discard
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {confirmRemove ? (
        <RemovePhotoConfirm
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            const target = confirmRemove;
            setConfirmRemove(null);
            if (onRemove) onRemove(target);
          }}
        />
      ) : null}
    </div>
  );
}

function RemovePhotoConfirm({ onCancel, onConfirm }) {
  return (
    <div role="dialog" aria-label="Remove photo" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(17, 24, 39, 0.5)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: colors.surface.background,
        borderRadius: radius.lg,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md
      }}>
        <div style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold }}>
          Remove this photo
        </div>
        <div style={{ fontSize: typography.sizes.sm, color: colors.neutral[500] }}>
          This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button type="button" onClick={onCancel} style={btnGhost()}>Cancel</button>
          <button type="button" onClick={onConfirm} style={btnDanger()}>Remove</button>
        </div>
      </div>
    </div>
  );
}

function btnGhost() {
  return {
    flex: 1,
    minHeight: 48,
    background: colors.surface.background,
    border: `1px solid ${colors.surface.border}`,
    borderRadius: radius.md,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    cursor: 'pointer'
  };
}

function btnDanger() {
  return {
    flex: 1,
    minHeight: 48,
    background: colors.status.danger,
    border: 'none',
    borderRadius: radius.md,
    color: colors.surface.background,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer'
  };
}
