import { colors, spacing, radius, shadow, typography } from '../../shared/styles/tokens.js';

// Container for one room: header (room name), list of items rendered by
// children, and footer navigation buttons. The item rendering itself is
// handed in via children so this stays a pure layout component.

export function WalkthroughRoom({
  roomName,
  itemCount,
  itemsCompleted,
  isFirstRoom,
  isLastRoom,
  onPrevious,
  onNext,
  onComplete,
  onAddRoom,
  children
}) {
  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg
    }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <h1 style={{
          margin: 0,
          fontSize: typography.sizes['2xl'],
          fontWeight: typography.weights.semibold,
          color: colors.neutral[900]
        }}>
          {roomName || 'No room'}
        </h1>
        <p style={{
          margin: 0,
          fontSize: typography.sizes.sm,
          color: colors.neutral[500]
        }}>
          {itemsCompleted} of {itemCount} items inspected
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {children}
      </div>

      <footer style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        marginTop: spacing.xl,
        paddingBottom: spacing.xl
      }}>
        {!isLastRoom ? (
          <button
            type="button"
            onClick={onNext}
            style={primaryButton()}
          >
            Next room
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            style={{ ...primaryButton(), background: colors.status.success }}
          >
            Complete inspection
          </button>
        )}

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirstRoom}
            style={{
              ...secondaryButton(),
              flex: 1,
              opacity: isFirstRoom ? 0.5 : 1,
              cursor: isFirstRoom ? 'not-allowed' : 'pointer'
            }}
          >
            Previous room
          </button>
          <button
            type="button"
            onClick={onAddRoom}
            style={{ ...secondaryButton(), flex: 1 }}
          >
            Add a room
          </button>
        </div>
      </footer>
    </div>
  );
}

function primaryButton() {
  return {
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
  };
}

function secondaryButton() {
  return {
    minHeight: 48,
    background: colors.surface.background,
    color: colors.neutral[700],
    border: `1px solid ${colors.surface.border}`,
    borderRadius: radius.md,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    padding: `${spacing.sm}px ${spacing.lg}px`
  };
}
