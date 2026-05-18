import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useChecklists } from '../../hooks/useChecklists.js';
import { supabase } from '../../lib/supabase.js';

// Thin walkthrough state layer on top of the existing useChecklists hook.
// Owns room navigation, per-item optimistic updates, progress counts, and
// the "add a room" extension. All persistence still goes through
// useChecklists so we don't duplicate the data layer.

function groupByRoom(items) {
  const map = new Map();
  (items || []).forEach(item => {
    const room = item.room || 'General';
    if (!map.has(room)) map.set(room, []);
    map.get(room).push(item);
  });
  // Stable sort items within room by sort_order, then item_name.
  map.forEach(list => {
    list.sort((a, b) => {
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.item_name || '').localeCompare(b.item_name || '');
    });
  });
  return map;
}

export function useWalkthrough(checklistId) {
  // useChecklists does not memoize its functions, so destructuring would
  // give us a fresh identity for fetchChecklist on every render. That
  // identity would invalidate every useCallback that depended on it, and
  // the load effect would re-fire forever. Hold the latest functions in
  // a ref instead and read through the ref so our callbacks stay stable.
  // Refactoring useChecklists itself is deferred to Phase 10.5.
  const checklistApi = useChecklists();
  const apiRef = useRef(checklistApi);
  apiRef.current = checklistApi;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [items, setItems] = useState([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [savingItemIds, setSavingItemIds] = useState(new Set());

  const reload = useCallback(async () => {
    if (!checklistId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRef.current.fetchChecklist(checklistId);
      if (!data) throw new Error('Checklist not found');
      setChecklist(data);
      setItems(Array.isArray(data.checklist_items) ? data.checklist_items : []);
    } catch (err) {
      console.error('[useWalkthrough] load failed:', err);
      setError(err.message || 'Could not load checklist');
    } finally {
      setLoading(false);
    }
  }, [checklistId]);

  useEffect(() => { reload(); }, [reload]);

  const itemsByRoom = useMemo(() => groupByRoom(items), [items]);
  const rooms = useMemo(() => Array.from(itemsByRoom.keys()), [itemsByRoom]);
  const currentRoom = rooms[currentRoomIndex] || null;
  const currentRoomItems = currentRoom ? (itemsByRoom.get(currentRoom) || []) : [];

  const nextRoom = useCallback(() => {
    setCurrentRoomIndex(idx => Math.min(idx + 1, Math.max(rooms.length - 1, 0)));
  }, [rooms.length]);

  const previousRoom = useCallback(() => {
    setCurrentRoomIndex(idx => Math.max(idx - 1, 0));
  }, []);

  const jumpToRoom = useCallback((name) => {
    const idx = rooms.indexOf(name);
    if (idx >= 0) setCurrentRoomIndex(idx);
  }, [rooms]);

  // Optimistic update: patch the local item, fire-and-forget the save.
  // saveChecklistItem returns the persisted row so we reconcile id/photos
  // when it resolves.
  const updateItem = useCallback(async (patch) => {
    if (!patch || !patch.id) return;
    setItems(prev => prev.map(i => i.id === patch.id ? { ...i, ...patch } : i));
    setSavingItemIds(prev => new Set(prev).add(patch.id));
    try {
      const persisted = await apiRef.current.saveChecklistItem(checklistId, { ...patch });
      if (persisted && persisted.id) {
        setItems(prev => prev.map(i => i.id === patch.id ? { ...i, ...persisted } : i));
      }
    } catch (err) {
      console.error('[useWalkthrough] save item failed:', err);
    } finally {
      setSavingItemIds(prev => {
        const next = new Set(prev);
        next.delete(patch.id);
        return next;
      });
    }
  }, [checklistId]);

  // Photo capture. uploadPhoto returns a public URL but does not insert
  // the checklist_photos row, so we do that here. Items expose photos
  // under the checklist_photos key to match the join shape from
  // fetchChecklist.
  const addPhotoToItem = useCallback(async (item, file) => {
    if (!item || !file) return null;
    const publicUrl = await apiRef.current.uploadPhoto(file, checklistId, item.id);
    if (!publicUrl) return null;
    const { data: inserted, error: insertError } = await supabase
      .from('checklist_photos')
      .insert({ checklist_item_id: item.id, photo_url: publicUrl, caption: '' })
      .select()
      .single();
    if (insertError) {
      console.error('[useWalkthrough] insert photo row failed:', insertError);
      throw insertError;
    }
    setItems(prev => prev.map(i => {
      if (i.id !== item.id) return i;
      const existing = Array.isArray(i.checklist_photos) ? i.checklist_photos : [];
      return { ...i, checklist_photos: [...existing, inserted] };
    }));
    return inserted;
  }, [checklistId]);

  const removePhotoFromItem = useCallback(async (item, photo) => {
    if (!item || !photo) return;
    setItems(prev => prev.map(i => {
      if (i.id !== item.id) return i;
      const filtered = (i.checklist_photos || []).filter(p => p.id !== photo.id);
      return { ...i, checklist_photos: filtered };
    }));
    try {
      if (photo.id) {
        await supabase.from('checklist_photos').delete().eq('id', photo.id);
      }
      const url = photo.photo_url || photo.url;
      if (url) await apiRef.current.deletePhoto(url);
    } catch (err) {
      console.error('[useWalkthrough] delete photo failed:', err);
    }
  }, []);

  // Add a new room with no default items. The PM types item names inside
  // the room. Items get a temp id until the first save resolves.
  const addRoom = useCallback(async (roomName, itemNames = []) => {
    if (!roomName) return;
    const fresh = (itemNames.length > 0 ? itemNames : ['New item']).map((name, idx) => ({
      id: `temp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      checklist_id: checklistId,
      room: roomName,
      item_name: name,
      condition: null,
      notes: '',
      checklist_photos: [],
      sort_order: items.length + idx
    }));
    setItems(prev => [...prev, ...fresh]);
    setCurrentRoomIndex(rooms.length);
    for (const it of fresh) {
      try {
        const persisted = await apiRef.current.saveChecklistItem(checklistId, { ...it, id: undefined });
        if (persisted && persisted.id) {
          setItems(prev => prev.map(i => i.id === it.id ? { ...i, ...persisted } : i));
        }
      } catch (err) {
        console.error('[useWalkthrough] save new item failed:', err);
      }
    }
  }, [checklistId, items.length, rooms.length]);

  const saveSignature = useCallback(async (dataUrl, signatureType) => {
    if (!dataUrl || (signatureType !== 'tenant' && signatureType !== 'inspector')) return;
    const url = await apiRef.current.uploadSignature(dataUrl, checklistId, signatureType);
    const stampField = signatureType === 'tenant' ? 'signed_by_tenant_at' : 'signed_by_pm_at';
    const urlField = signatureType === 'tenant' ? 'tenant_signature_url' : 'inspector_signature_url';
    const patch = { [urlField]: url, [stampField]: new Date().toISOString() };
    await apiRef.current.updateChecklist(checklistId, patch);
    setChecklist(prev => prev ? { ...prev, ...patch } : prev);
    return url;
  }, [checklistId]);

  // inspection_checklists.status check constraint accepts only these three
  // values. Keep the consumer in charge of which transition fires when.
  const setStatus = useCallback(async (newStatus, extra = {}) => {
    const allowed = ['draft', 'completed', 'signed'];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid checklist status "${newStatus}"; expected one of ${allowed.join(', ')}`);
    }
    const patch = { status: newStatus, ...extra };
    await apiRef.current.updateChecklist(checklistId, patch);
    setChecklist(prev => prev ? { ...prev, ...patch } : prev);
  }, [checklistId]);

  const setPdfPath = useCallback(async (path) => {
    if (!path) return;
    try {
      const { error: pathError } = await supabase
        .from('inspection_checklists')
        .update({ pdf_storage_path: path })
        .eq('id', checklistId);
      if (pathError) throw pathError;
      setChecklist(prev => prev ? { ...prev, pdf_storage_path: path } : prev);
    } catch (err) {
      console.error('[useWalkthrough] persist pdf path failed:', err);
    }
  }, [checklistId]);

  const progress = useMemo(() => {
    const itemsCompleted = items.filter(i => !!i.condition).length;
    const photosTotal = items.reduce((sum, i) => sum + (Array.isArray(i.checklist_photos) ? i.checklist_photos.length : 0), 0);
    return {
      roomsTotal: rooms.length,
      currentRoomIndex,
      currentRoom,
      itemsTotal: items.length,
      itemsCompleted,
      photosTotal
    };
  }, [items, rooms.length, currentRoomIndex, currentRoom]);

  return {
    loading,
    error,
    checklist,
    items,
    rooms,
    itemsByRoom,
    currentRoom,
    currentRoomIndex,
    currentRoomItems,
    progress,
    savingItemIds,
    nextRoom,
    previousRoom,
    jumpToRoom,
    updateItem,
    addPhotoToItem,
    removePhotoFromItem,
    addRoom,
    saveSignature,
    setStatus,
    setPdfPath,
    reload
  };
}
