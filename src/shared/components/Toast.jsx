import { radius, spacing, typography } from '../styles/tokens.js';

const typeStyles = {
  error: { background: '#fee2e2', color: '#dc2626', icon: '⚠️' },
  success: { background: '#d1fae5', color: '#059669', icon: '✓' },
  info: { background: '#e0f2fe', color: '#0284c7', icon: 'ℹ️' },
};

export function Toast({ type = 'info', message, onDismiss }) {
  const t = typeStyles[type] ?? typeStyles.info;
  return (
    <div
      style={{
        padding: `${spacing.md}px ${spacing.lg}px`,
        background: t.background,
        color: t.color,
        borderRadius: radius.md,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        minWidth: 300,
        animation: 'slideIn 0.3s ease',
        fontFamily: typography.fontFamily,
        fontSize: typography.sizes.base,
      }}
    >
      <span style={{ fontSize: 18 }}>{t.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 20,
          color: 'inherit',
          padding: 0,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  );
}
