import { useState } from 'react';
import { colors, spacing, radius, typography } from '../../shared/styles/tokens.js';
import { ChevronRightIcon } from './icons.jsx';

function pillStyle(tone) {
  const palette = {
    urgent: { bg: colors.status.danger, fg: colors.surface.background },
    warning: { bg: colors.status.warning, fg: colors.surface.background },
    info: { bg: colors.brand.primary, fg: colors.surface.background }
  };
  const choice = palette[tone] || palette.info;
  return {
    background: choice.bg,
    color: choice.fg,
    padding: `${spacing.xs}px ${spacing.md}px`,
    borderRadius: radius.full,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    minWidth: 32,
    textAlign: 'center'
  };
}

export function ActionItem({ icon, label, count, tone = 'info', onClick }) {
  const [hover, setHover] = useState(false);
  if (!count) return null;
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        background: hover ? colors.neutral[50] : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${colors.surface.border}`,
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 120ms ease',
        fontFamily: typography.fontFamily
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: radius.md,
        background: colors.neutral[100],
        color: colors.neutral[700],
        flexShrink: 0
      }}>
        {Icon ? <Icon size={18} /> : null}
      </span>
      <span style={{
        flex: 1,
        fontSize: typography.sizes.base,
        color: colors.neutral[900]
      }}>
        {label}
      </span>
      <span style={pillStyle(tone)}>{count}</span>
      <ChevronRightIcon size={18} color={colors.neutral[500]} />
    </button>
  );
}
