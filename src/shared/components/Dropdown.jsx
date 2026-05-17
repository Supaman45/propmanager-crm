import { colors, radius, shadow, spacing } from '../styles/tokens.js';

export function Dropdown({
  open,
  onClose,
  children,
  position = { top: '100%', right: 0 },
  style,
}) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 998,
        }}
      />
      <div
        style={{
          position: 'absolute',
          background: colors.surface.background,
          borderRadius: radius.md,
          boxShadow: shadow.lg,
          border: `1px solid ${colors.surface.border}`,
          zIndex: 999,
          minWidth: 180,
          padding: spacing.xs,
          ...position,
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
}
