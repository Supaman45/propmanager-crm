import { colors, spacing, radius, typography } from '../../shared/styles/tokens.js';
import { formatRelativeTime } from './formatters.js';

export function ActivityFeedItem({ icon, description, timestamp, onClick }) {
  const Icon = icon;
  const interactive = typeof onClick === 'function';
  return (
    <div
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        borderBottom: `1px solid ${colors.surface.border}`,
        cursor: interactive ? 'pointer' : 'default',
        fontFamily: typography.fontFamily
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: radius.md,
        background: colors.neutral[100],
        color: colors.neutral[700],
        flexShrink: 0,
        marginTop: 2
      }}>
        {Icon ? <Icon size={16} /> : null}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: typography.sizes.base,
          color: colors.neutral[900],
          lineHeight: 1.4
        }}>
          {description}
        </div>
        <div style={{
          fontSize: typography.sizes.xs,
          color: colors.neutral[500],
          marginTop: spacing.xs
        }}>
          {formatRelativeTime(timestamp)}
        </div>
      </div>
    </div>
  );
}
