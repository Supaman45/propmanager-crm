import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';
import { conditionColor, conditionLabel } from './ConditionPicker.jsx';

// End-of-walkthrough recap. Shows counts of rooms inspected, items
// completed, photos taken, and a condition breakdown so the PM can spot
// obvious gaps before getting signatures. Hands off to the signature
// flow via onGetSignatures.

export function WalkthroughSummary({ progress, items, onBack, onGetSignatures }) {
  // Normalize to lowercase so legacy mixed-case rows (e.g. "Good" vs "good")
  // tally into a single bucket rather than splitting.
  const conditionTally = items.reduce((acc, item) => {
    const key = item.condition ? String(item.condition).toLowerCase() : 'not set';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const tallyEntries = Object.entries(conditionTally).sort((a, b) => b[1] - a[1]);
  const allDone = progress.itemsCompleted === progress.itemsTotal && progress.itemsTotal > 0;

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
      fontFamily: typography.fontFamily
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: typography.sizes['2xl'], fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>
          Inspection summary
        </h1>
        <p style={{ margin: `${spacing.xs}px 0 0`, fontSize: typography.sizes.sm, color: colors.neutral[500] }}>
          Review before getting signatures
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: spacing.md
      }}>
        <SummaryStat label="Rooms" value={progress.roomsTotal} />
        <SummaryStat label="Items inspected" value={progress.itemsCompleted} />
        <SummaryStat label="Items total" value={progress.itemsTotal} />
        <SummaryStat label="Photos" value={progress.photosTotal} />
      </div>

      <div style={{
        background: colors.surface.background,
        border: `1px solid ${colors.surface.border}`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm
      }}>
        <div style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.neutral[700] }}>
          Condition breakdown
        </div>
        {tallyEntries.length === 0 ? (
          <div style={{ fontSize: typography.sizes.sm, color: colors.neutral[500] }}>No items inspected yet</div>
        ) : tallyEntries.map(([condition, count]) => (
          <div key={condition} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: radius.full,
              background: conditionColor(condition === 'not set' ? null : condition)
            }} />
            <span style={{ flex: 1, fontSize: typography.sizes.base, color: colors.neutral[900] }}>{conditionLabel(condition === 'not set' ? null : condition)}</span>
            <span style={{ fontSize: typography.sizes.base, color: colors.neutral[700], fontWeight: typography.weights.semibold }}>{count}</span>
          </div>
        ))}
      </div>

      {!allDone ? (
        <div style={{
          padding: spacing.md,
          background: 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${colors.status.warning}`,
          borderRadius: radius.md,
          fontSize: typography.sizes.sm,
          color: colors.neutral[900]
        }}>
          {progress.itemsTotal - progress.itemsCompleted} items still need a condition. You can sign anyway, but they will show as Not set in the PDF.
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <button
          type="button"
          onClick={onGetSignatures}
          style={{
            width: '100%',
            minHeight: 56,
            background: colors.brand.primary,
            color: colors.surface.background,
            border: 'none',
            borderRadius: radius.lg,
            fontFamily: typography.fontFamily,
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.semibold,
            boxShadow: shadow.sm,
            cursor: 'pointer'
          }}
        >
          Get tenant signature
        </button>
        <button
          type="button"
          onClick={onBack}
          style={{
            minHeight: 48,
            background: colors.surface.background,
            border: `1px solid ${colors.surface.border}`,
            borderRadius: radius.md,
            color: colors.neutral[700],
            fontFamily: typography.fontFamily,
            fontSize: typography.sizes.base,
            cursor: 'pointer'
          }}
        >
          Back to walkthrough
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div style={{
      background: colors.surface.background,
      border: `1px solid ${colors.surface.border}`,
      borderRadius: radius.lg,
      padding: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xs
    }}>
      <div style={{ fontSize: typography.sizes.xs, color: colors.neutral[500], fontWeight: typography.weights.medium, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: typography.sizes['3xl'], fontWeight: typography.weights.bold, color: colors.neutral[900], lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
