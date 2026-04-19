import { colors, spacing, radius, shadow } from '../styles/tokens.js';

export function Modal({ open, onClose, children, maxWidth = 520, style }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: spacing.lg,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface.background,
          borderRadius: radius.lg,
          boxShadow: shadow.lg,
          maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
