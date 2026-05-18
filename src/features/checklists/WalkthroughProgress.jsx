import { colors, spacing, typography, radius } from '../../shared/styles/tokens.js';

// Top progress bar for the walkthrough. Shows current room name, position,
// and a filled bar based on completed items across the whole checklist.

export function WalkthroughProgress({ progress, onClose }) {
  const total = Math.max(progress.itemsTotal, 1);
  const pct = Math.min(100, Math.round((progress.itemsCompleted / total) * 100));
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: colors.surface.background,
      borderBottom: `1px solid ${colors.surface.border}`,
      padding: `${spacing.md}px ${spacing.lg}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sm
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: typography.sizes.xs,
            color: colors.neutral[500],
            fontWeight: typography.weights.medium,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {progress.currentRoomIndex + 1} of {progress.roomsTotal} rooms
          </div>
          <div style={{
            fontSize: typography.sizes.lg,
            color: colors.neutral[900],
            fontWeight: typography.weights.semibold,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {progress.currentRoom || 'No rooms yet'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close walkthrough"
          style={{
            minWidth: 48,
            minHeight: 48,
            border: `1px solid ${colors.surface.border}`,
            background: colors.surface.background,
            borderRadius: radius.md,
            color: colors.neutral[700],
            cursor: 'pointer',
            fontSize: typography.sizes.lg,
            fontFamily: typography.fontFamily
          }}
        >
          Close
        </button>
      </div>
      <div style={{
        position: 'relative',
        height: 6,
        background: colors.neutral[100],
        borderRadius: radius.full,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: colors.brand.primary,
          transition: 'width 200ms ease'
        }} />
      </div>
      <div style={{ fontSize: typography.sizes.xs, color: colors.neutral[500] }}>
        {progress.itemsCompleted} of {progress.itemsTotal} items complete
      </div>
    </div>
  );
}
