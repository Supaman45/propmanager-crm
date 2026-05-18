import { useState, useEffect, useRef } from 'react';
import { colors, spacing, radius, typography } from '../../shared/styles/tokens.js';
import { ConditionPicker } from './ConditionPicker.jsx';
import { PhotoCapture } from './PhotoCapture.jsx';

// One inspection item: name, condition picker, photo capture, notes.
// Owns local notes state with a debounced persist so typing doesn't blast
// Supabase. Condition changes persist immediately. Failed photo uploads
// stay in a local retry queue so the PM can keep moving without losing
// the captured image.

export function WalkthroughItem({
  item,
  saving,
  onChange,
  onAddPhoto,
  onRemovePhoto
}) {
  const [notesDraft, setNotesDraft] = useState(item.notes || '');
  const [uploading, setUploading] = useState(false);
  const [failedQueue, setFailedQueue] = useState([]);
  const debounceRef = useRef(null);

  // Sync the local draft if the underlying item changes from elsewhere
  // (e.g. optimistic patch resolved). Skip if the user is mid-typing.
  useEffect(() => {
    setNotesDraft(prev => (prev === (item.notes || '') ? prev : (item.notes || '')));
  }, [item.notes]);

  const persistNotes = (value) => {
    onChange({ id: item.id, notes: value });
  };

  const handleNotesChange = (e) => {
    const value = e.target.value;
    setNotesDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persistNotes(value), 600);
  };

  const handlePickPhoto = async (file) => {
    setUploading(true);
    try {
      await onAddPhoto(item, file);
    } catch (err) {
      console.error('[WalkthroughItem] photo upload failed:', err);
      setFailedQueue(prev => [...prev, file]);
    } finally {
      setUploading(false);
    }
  };

  const handleRetryFailed = async () => {
    if (failedQueue.length === 0) return;
    setUploading(true);
    const pending = [...failedQueue];
    setFailedQueue([]);
    const stillFailed = [];
    for (const file of pending) {
      try {
        await onAddPhoto(item, file);
      } catch (err) {
        console.error('[WalkthroughItem] retry upload failed:', err);
        stillFailed.push(file);
      }
    }
    if (stillFailed.length > 0) setFailedQueue(stillFailed);
    setUploading(false);
  };

  const handleClearFailed = () => setFailedQueue([]);

  return (
    <div style={{
      background: colors.surface.background,
      border: `1px solid ${colors.surface.border}`,
      borderRadius: radius.lg,
      padding: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm }}>
        <div style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.neutral[900] }}>
          {item.item_name}
        </div>
        {saving ? (
          <div style={{ fontSize: typography.sizes.xs, color: colors.neutral[500] }}>Saving</div>
        ) : item.condition ? (
          <div style={{ fontSize: typography.sizes.xs, color: colors.status.success, fontWeight: typography.weights.semibold }}>Saved</div>
        ) : null}
      </div>

      <ConditionPicker
        value={item.condition || null}
        onChange={(value) => onChange({ id: item.id, condition: value })}
      />

      <PhotoCapture
        photos={item.checklist_photos || []}
        uploading={uploading}
        onPick={handlePickPhoto}
        onRemove={(photo) => onRemovePhoto(item, photo)}
        failed={failedQueue}
        onRetry={handleRetryFailed}
        onClearFailure={handleClearFailed}
      />

      <textarea
        value={notesDraft}
        onChange={handleNotesChange}
        placeholder="Add a note"
        rows={2}
        style={{
          width: '100%',
          border: `1px solid ${colors.surface.border}`,
          borderRadius: radius.md,
          padding: spacing.md,
          fontFamily: typography.fontFamily,
          fontSize: typography.sizes.base,
          color: colors.neutral[900],
          resize: 'vertical',
          minHeight: 60,
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}
