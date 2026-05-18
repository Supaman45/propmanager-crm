import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';
import {
  CalendarIcon, AlertIcon, WrenchIcon, CheckCircleIcon, ChevronRightIcon
} from '../reports/icons.jsx';

// Due in the next 14 days panel. Vertical list of clickable rows sorted
// by sortAt ascending. Each row routes through onNavigate to land on
// the right tab with the right filter pre-selected. Caps visible rows
// per the dueDates limit and surfaces a "See all" link if more exist.

const ICONS = {
  lease: CalendarIcon,
  late_rent: AlertIcon,
  maintenance: WrenchIcon
};

const TONE_BG = {
  urgent: 'rgba(239, 68, 68, 0.08)',
  warning: 'rgba(245, 158, 11, 0.12)',
  info: 'rgba(59, 130, 246, 0.08)'
};

const TONE_FG = {
  urgent: colors.status.danger,
  warning: colors.status.warning,
  info: colors.brand.primary
};

export function DueDatesPanel({ dueDates, onNavigate, onSeeAll }) {
  const rows = dueDates?.rows || [];
  const total = dueDates?.total || 0;
  const overflow = Math.max(0, total - rows.length);

  return (
    <section style={{
      background: colors.surface.background,
      border: `1px solid ${colors.surface.border}`,
      borderLeft: `3px solid ${colors.brand.primary}`,
      borderRadius: radius.lg,
      boxShadow: shadow.sm,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{ padding: `${spacing.lg}px ${spacing.xl}px`, borderBottom: `1px solid ${colors.surface.border}` }}>
        <h3 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>
          Due in the next 14 days
        </h3>
        <p style={{ margin: `${spacing.xs}px 0 0`, fontSize: typography.sizes.sm, color: colors.neutral[500] }}>
          Sorted by what comes due first
        </p>
      </header>

      {rows.length === 0 ? (
        <div style={{
          padding: spacing['2xl'],
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.sm,
          color: colors.neutral[500]
        }}>
          <CheckCircleIcon size={32} color={colors.status.success} />
          <div style={{ fontSize: typography.sizes.base }}>Nothing urgent in the next 14 days. Good place to be.</div>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row, idx) => (
            <DueDateRow
              key={idx}
              row={row}
              isLast={idx === rows.length - 1}
              onClick={() => onNavigate && onNavigate(row.navTarget)}
            />
          ))}
        </ul>
      )}

      {overflow > 0 ? (
        <button
          type="button"
          onClick={onSeeAll}
          style={{
            padding: `${spacing.md}px ${spacing.xl}px`,
            borderTop: `1px solid ${colors.surface.border}`,
            background: colors.surface.background,
            border: 'none',
            color: colors.brand.primary,
            fontFamily: typography.fontFamily,
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          See all {total} items
        </button>
      ) : null}
    </section>
  );
}

function DueDateRow({ row, isLast, onClick }) {
  const Icon = ICONS[row.kind] || AlertIcon;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.md}px ${spacing.xl}px`,
          background: 'transparent',
          border: 'none',
          borderBottom: isLast ? 'none' : `1px solid ${colors.surface.border}`,
          width: '100%',
          cursor: 'pointer',
          textAlign: 'left',
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
          background: TONE_BG[row.tone] || TONE_BG.info,
          color: TONE_FG[row.tone] || TONE_FG.info,
          flexShrink: 0
        }}>
          <Icon size={18} color={TONE_FG[row.tone] || TONE_FG.info} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: typography.sizes.base, color: colors.neutral[900], fontWeight: typography.weights.medium, lineHeight: 1.3 }}>
            {row.label}
          </div>
          <div style={{ fontSize: typography.sizes.sm, color: colors.neutral[500], marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.detail}
          </div>
        </div>
        <ChevronRightIcon size={18} color={colors.neutral[500]} />
      </button>
    </li>
  );
}
