import { colors, radius, shadow, spacing } from '../styles/tokens.js';

export function Card({ children, padded = true, style }) {
  return (
    <div
      style={{
        background: colors.surface.background,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        border: `1px solid ${colors.surface.border}`,
        padding: padded ? spacing.lg : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
