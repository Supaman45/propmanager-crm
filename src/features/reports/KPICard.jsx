import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';
import { Sparkline } from './Sparkline.jsx';
import { ArrowUpIcon, ArrowDownIcon } from './icons.jsx';

// Map an optional band ("good" | "warn" | "bad") to a color from tokens.
function bandColor(band) {
  if (band === 'good') return colors.status.success;
  if (band === 'warn') return colors.status.warning;
  if (band === 'bad') return colors.status.danger;
  return colors.neutral[900];
}

function trendArrow(direction, value) {
  if (!direction || value == null) return null;
  const Arrow = direction === 'up' ? ArrowUpIcon : ArrowDownIcon;
  const tone = direction === 'up' ? colors.status.success : colors.status.danger;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs, color: tone, fontSize: typography.sizes.sm }}>
      <Arrow size={14} color={tone} />
      {value}
    </span>
  );
}

export function KPICard({ label, value, subLine, sparkline, band, trend }) {
  const accent = bandColor(band);
  return (
    <div
      style={{
        background: colors.surface.background,
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        minHeight: 170
      }}
    >
      <div style={{
        fontSize: typography.sizes.sm,
        color: colors.neutral[500],
        fontWeight: typography.weights.medium,
        letterSpacing: '0.02em'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: typography.sizes['4xl'],
        fontWeight: typography.weights.bold,
        color: accent,
        lineHeight: 1.1
      }}>
        {value}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
        fontSize: typography.sizes.sm,
        color: colors.neutral[500],
        minHeight: 20
      }}>
        <span>{subLine}</span>
        {trend ? trendArrow(trend.direction, trend.label) : null}
      </div>
      {sparkline ? (
        <div style={{ marginTop: 'auto' }}>
          <Sparkline values={sparkline} color={accent} height={36} />
        </div>
      ) : null}
    </div>
  );
}
