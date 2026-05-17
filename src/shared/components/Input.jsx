import { colors, spacing, radius, typography } from '../styles/tokens.js';

export function Input({ label, error, required, id, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium,
            color: colors.neutral[700],
          }}
        >
          {label}
          {required && <span style={{ color: colors.status.danger, marginLeft: 2 }}>*</span>}
        </label>
      )}
      <input
        id={id}
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.sizes.base,
          padding: `${spacing.sm}px ${spacing.md}px`,
          border: `1px solid ${error ? colors.status.danger : colors.surface.border}`,
          borderRadius: radius.md,
          outline: 'none',
          ...style,
        }}
        {...rest}
      />
      {error && (
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.sizes.xs,
            color: colors.status.danger,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
