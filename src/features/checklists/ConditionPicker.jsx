import { colors, spacing, radius, typography } from '../../shared/styles/tokens.js';

// Five-state condition picker. Tap targets at least 48px tall for thumb use.
// Selected state uses the condition color, unselected uses a neutral border.

const CONDITIONS = [
  { value: 'Excellent', color: colors.status.success },
  { value: 'Good', color: '#34d399' },
  { value: 'Fair', color: colors.status.warning },
  { value: 'Poor', color: '#fb923c' },
  { value: 'Damaged', color: colors.status.danger }
];

export function ConditionPicker({ value, onChange, disabled }) {
  return (
    <div
      role="radiogroup"
      aria-label="Condition"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: spacing.xs,
        width: '100%'
      }}
    >
      {CONDITIONS.map(opt => {
        const selected = value === opt.value;
        return (
          <button
            type="button"
            key={opt.value}
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            style={{
              minHeight: 48,
              padding: `${spacing.xs}px ${spacing.xs}px`,
              border: `2px solid ${selected ? opt.color : colors.surface.border}`,
              borderRadius: radius.md,
              background: selected ? opt.color : colors.surface.background,
              color: selected ? colors.surface.background : colors.neutral[700],
              fontFamily: typography.fontFamily,
              fontSize: typography.sizes.xs,
              fontWeight: selected ? typography.weights.semibold : typography.weights.medium,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              lineHeight: 1.1,
              wordBreak: 'break-word',
              textAlign: 'center'
            }}
          >
            {opt.value}
          </button>
        );
      })}
    </div>
  );
}

export function conditionColor(value) {
  const match = CONDITIONS.find(c => c.value === value);
  return match ? match.color : colors.neutral[300];
}
