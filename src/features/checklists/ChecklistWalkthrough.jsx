import { useState } from 'react';
import { colors, spacing, radius, typography } from '../../shared/styles/tokens.js';
import { useWalkthrough } from './useWalkthrough.js';
import { WalkthroughProgress } from './WalkthroughProgress.jsx';
import { WalkthroughRoom } from './WalkthroughRoom.jsx';
import { WalkthroughItem } from './WalkthroughItem.jsx';
import { WalkthroughSummary } from './WalkthroughSummary.jsx';
import { SignatureHandoff } from './SignatureHandoff.jsx';

// Full-screen mobile-first walkthrough shell. Hides the surrounding app
// chrome by rendering as a fixed overlay at z-index 100. State-only, no
// new route, controlled by the parent (Checklists page) via `open` and
// `onClose`. The signature and summary screens land in later commits.

const STAGE_INSPECTING = 'inspecting';
const STAGE_SUMMARY = 'summary';
const STAGE_SIGNING = 'signing';

export default function ChecklistWalkthrough({ checklistId, open, onClose }) {
  const w = useWalkthrough(checklistId);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [stage, setStage] = useState(STAGE_INSPECTING);

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: colors.surface.subtle,
    zIndex: 100,
    overflowY: 'auto',
    fontFamily: typography.fontFamily,
    WebkitOverflowScrolling: 'touch'
  };

  if (w.loading) {
    return (
      <div style={overlayStyle}>
        <div style={centered()}>Loading inspection</div>
      </div>
    );
  }
  if (w.error) {
    return (
      <div style={overlayStyle}>
        <div style={centered(colors.status.danger)}>
          {w.error}
          <div style={{ marginTop: spacing.lg }}>
            <button type="button" onClick={onClose} style={closeButton()}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddRoomConfirm = async () => {
    const name = newRoomName.trim();
    if (!name) return;
    await w.addRoom(name, ['Walls and paint', 'Flooring', 'Light fixtures']);
    setNewRoomName('');
    setShowAddRoom(false);
  };

  const goToSummary = () => setStage(STAGE_SUMMARY);
  const goToSigning = () => setStage(STAGE_SIGNING);
  const goBackToInspecting = () => setStage(STAGE_INSPECTING);

  const handleSignaturesComplete = async () => {
    try {
      await w.markComplete();
    } catch (err) {
      console.error('[ChecklistWalkthrough] markComplete failed:', err);
    }
    onClose && onClose({ complete: true, checklistId });
  };

  if (stage === STAGE_SUMMARY) {
    return (
      <div style={overlayStyle}>
        <WalkthroughProgress progress={w.progress} onClose={onClose} />
        <WalkthroughSummary
          progress={w.progress}
          items={w.items}
          onBack={goBackToInspecting}
          onGetSignatures={goToSigning}
        />
      </div>
    );
  }

  if (stage === STAGE_SIGNING) {
    return (
      <div style={overlayStyle}>
        <WalkthroughProgress progress={w.progress} onClose={onClose} />
        <SignatureHandoff
          onSaveSignature={(dataUrl, type) => w.saveSignature(dataUrl, type)}
          onComplete={handleSignaturesComplete}
          onCancel={goBackToInspecting}
        />
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <WalkthroughProgress progress={w.progress} onClose={onClose} />

      {w.rooms.length === 0 ? (
        <div style={centered()}>
          This checklist has no rooms yet. Add one to start.
          <button
            type="button"
            onClick={() => setShowAddRoom(true)}
            style={{ ...closeButton(), marginTop: spacing.lg, background: colors.brand.primary, color: colors.surface.background, borderColor: colors.brand.primary }}
          >
            Add a room
          </button>
        </div>
      ) : (
        <WalkthroughRoom
          roomName={w.currentRoom}
          itemCount={w.currentRoomItems.length}
          itemsCompleted={w.currentRoomItems.filter(i => !!i.condition).length}
          isFirstRoom={w.currentRoomIndex === 0}
          isLastRoom={w.currentRoomIndex === w.rooms.length - 1}
          onPrevious={w.previousRoom}
          onNext={w.nextRoom}
          onComplete={goToSummary}
          onAddRoom={() => setShowAddRoom(true)}
        >
          {w.currentRoomItems.map(item => (
            <WalkthroughItem
              key={item.id}
              item={item}
              saving={w.savingItemIds.has(item.id)}
              onChange={w.updateItem}
              onAddPhoto={w.addPhotoToItem}
              onRemovePhoto={w.removePhotoFromItem}
            />
          ))}
        </WalkthroughRoom>
      )}

      {showAddRoom ? (
        <AddRoomSheet
          value={newRoomName}
          onChange={setNewRoomName}
          onCancel={() => { setShowAddRoom(false); setNewRoomName(''); }}
          onConfirm={handleAddRoomConfirm}
        />
      ) : null}
    </div>
  );
}

function AddRoomSheet({ value, onChange, onConfirm, onCancel }) {
  return (
    <div
      role="dialog"
      aria-label="Add a room"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.45)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: colors.surface.background,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md
      }}>
        <div style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold }}>Add a room</div>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Bedroom 3"
          style={{
            width: '100%',
            minHeight: 48,
            border: `1px solid ${colors.surface.border}`,
            borderRadius: radius.md,
            padding: `${spacing.sm}px ${spacing.md}px`,
            fontSize: typography.sizes.base,
            fontFamily: typography.fontFamily,
            color: colors.neutral[900]
          }}
        />
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button type="button" onClick={onCancel} style={{ ...closeButton(), flex: 1 }}>Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ ...closeButton(), flex: 1, background: colors.brand.primary, color: colors.surface.background, borderColor: colors.brand.primary }}
          >
            Add room
          </button>
        </div>
      </div>
    </div>
  );
}

function centered(color) {
  return {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    color: color || colors.neutral[500],
    padding: spacing.xl,
    textAlign: 'center'
  };
}

function closeButton() {
  return {
    minHeight: 48,
    border: `1px solid ${colors.surface.border}`,
    borderRadius: radius.md,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    background: colors.surface.background,
    color: colors.neutral[700],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    fontFamily: typography.fontFamily
  };
}
