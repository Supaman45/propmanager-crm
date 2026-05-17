import { colors, spacing, radius, typography } from '../styles/tokens.js';

const baseStyle = {
  fontFamily: typography.fontFamily,
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.medium,
  border: 'none',
  borderRadius: radius.md,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  transition: 'background 0.15s ease',
  lineHeight: 1.2,
};

const variantStyles = {
  primary: {
    background: colors.brand.primary,
    color: colors.surface.background,
  },
  secondary: {
    background: colors.neutral[100],
    color: colors.neutral[900],
  },
  ghost: {
    background: 'transparent',
    color: colors.neutral[700],
  },
  danger: {
    background: colors.status.danger,
    color: colors.surface.background,
  },
};

const sizeStyles = {
  sm: { padding: `${spacing.xs}px ${spacing.md}px`, fontSize: typography.sizes.sm },
  md: { padding: `${spacing.sm}px ${spacing.lg}px` },
  lg: { padding: `${spacing.md}px ${spacing.xl}px`, fontSize: typography.sizes.lg },
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  style,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
