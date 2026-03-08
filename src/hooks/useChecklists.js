import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Default inspection items for each room
const getDefaultChecklistItems = () => {
  const items = [];
  let sortOrder = 0;

  // Living Room
  const livingRoomItems = [
    'Walls & Paint',
    'Ceiling',
    'Flooring/Carpet',
    'Windows & Screens',
    'Window Coverings/Blinds',
    'Light Fixtures',
    'Electrical Outlets',
    'Doors',
    'Smoke Detector'
  ];
  livingRoomItems.forEach(itemName => {
    items.push({
      room: 'Living Room',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Kitchen
  const kitchenItems = [
    'Walls & Paint',
    'Ceiling',
    'Flooring',
    'Countertops',
    'Cabinets',
    'Sink & Faucet',
    'Garbage Disposal',
    'Dishwasher',
    'Refrigerator',
    'Stove/Oven',
    'Range Hood/Vent',
    'Microwave',
    'Light Fixtures'
  ];
  kitchenItems.forEach(itemName => {
    items.push({
      room: 'Kitchen',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Primary Bedroom
  const primaryBedroomItems = [
    'Walls & Paint',
    'Ceiling',
    'Flooring/Carpet',
    'Windows & Screens',
    'Window Coverings/Blinds',
    'Closet',
    'Closet Doors',
    'Light Fixtures',
    'Electrical Outlets',
    'Smoke Detector'
  ];
  primaryBedroomItems.forEach(itemName => {
    items.push({
      room: 'Primary Bedroom',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Bedroom 2
  const bedroom2Items = [
    'Walls & Paint',
    'Ceiling',
    'Flooring/Carpet',
    'Windows & Screens',
    'Closet',
    'Light Fixtures',
    'Electrical Outlets'
  ];
  bedroom2Items.forEach(itemName => {
    items.push({
      room: 'Bedroom 2',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Primary Bathroom
  const primaryBathroomItems = [
    'Walls & Paint',
    'Ceiling',
    'Flooring',
    'Toilet',
    'Sink & Faucet',
    'Vanity/Cabinet',
    'Mirror',
    'Bathtub/Shower',
    'Shower Door/Curtain Rod',
    'Tile & Grout',
    'Exhaust Fan',
    'Light Fixtures'
  ];
  primaryBathroomItems.forEach(itemName => {
    items.push({
      room: 'Primary Bathroom',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Bathroom 2
  const bathroom2Items = [
    'Walls & Paint',
    'Flooring',
    'Toilet',
    'Sink & Faucet',
    'Mirror',
    'Bathtub/Shower',
    'Exhaust Fan'
  ];
  bathroom2Items.forEach(itemName => {
    items.push({
      room: 'Bathroom 2',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Laundry Area
  const laundryAreaItems = [
    'Walls & Paint',
    'Flooring',
    'Washer Hookups',
    'Dryer Hookups/Vent',
    'Utility Sink',
    'Cabinets/Shelving'
  ];
  laundryAreaItems.forEach(itemName => {
    items.push({
      room: 'Laundry Area',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Garage
  const garageItems = [
    'Garage Door',
    'Garage Door Opener',
    'Flooring',
    'Walls',
    'Light Fixtures',
    'Electrical Outlets'
  ];
  garageItems.forEach(itemName => {
    items.push({
      room: 'Garage',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // Exterior
  const exteriorItems = [
    'Front Door',
    'Back Door',
    'Patio/Deck',
    'Landscaping',
    'Sprinkler System',
    'Fencing/Gates',
    'Exterior Lighting'
  ];
  exteriorItems.forEach(itemName => {
    items.push({
      room: 'Exterior',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  // General
  const generalItems = [
    'HVAC System',
    'Water Heater',
    'Thermostat',
    'Keys Provided',
    'Garage Remotes',
    'Mailbox Keys'
  ];
  generalItems.forEach(itemName => {
    items.push({
      room: 'General',
      item_name: itemName,
      condition: null,
      notes: null,
      photos: [],
      sort_order: sortOrder++
    });
  });

  return items;
};

export const useChecklists = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all checklists
  const fetchChecklists = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('inspection_checklists')
        .select(`
          *,
          checklist_items (
            id,
            checklist_id,
            room,
            item_name,
            condition,
            notes,
            sort_order,
            created_at,
            checklist_photos (
              id,
              photo_url,
              caption
            )
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setChecklists(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single checklist
  const fetchChecklist = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('inspection_checklists')
        .select(`
          *,
          checklist_items (
            id,
            checklist_id,
            room,
            item_name,
            condition,
            notes,
            sort_order,
            created_at,
            checklist_photos (
              id,
              photo_url,
              caption
            )
          )
        `)
        .eq('id', id)
        .eq('created_by', user.id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching checklist:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create checklist
  const createChecklist = async (checklistData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, create the checklist without signatures (if they're data URLs)
      // We'll upload signatures after we have the real UUID
      let tenantSignatureUrl = checklistData.tenant_signature_url;
      let inspectorSignatureUrl = checklistData.inspector_signature_url;

      const { data, error: createError } = await supabase
        .from('inspection_checklists')
        .insert({
          property_id: checklistData.property_id,
          tenant_id: checklistData.tenant_id,
          unit_number: checklistData.unit_number,
          inspection_type: checklistData.inspection_type,
          inspection_date: checklistData.inspection_date,
          inspector_name: checklistData.inspector_name,
          tenant_present: checklistData.tenant_present || false,
          tenant_signature_url: tenantSignatureUrl && !tenantSignatureUrl.startsWith('data:') ? tenantSignatureUrl : null,
          inspector_signature_url: inspectorSignatureUrl && !inspectorSignatureUrl.startsWith('data:') ? inspectorSignatureUrl : null,
          overall_condition: checklistData.overall_condition,
          notes: checklistData.notes,
          status: checklistData.status || 'draft',
          created_by: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      // Now upload signatures if they are data URLs (we have the real UUID now)
      if (checklistData.tenant_signature_url && checklistData.tenant_signature_url.startsWith('data:')) {
        tenantSignatureUrl = await uploadSignature(checklistData.tenant_signature_url, data.id, 'tenant');
        await supabase
          .from('inspection_checklists')
          .update({ tenant_signature_url: tenantSignatureUrl })
          .eq('id', data.id);
      }
      if (checklistData.inspector_signature_url && checklistData.inspector_signature_url.startsWith('data:')) {
        inspectorSignatureUrl = await uploadSignature(checklistData.inspector_signature_url, data.id, 'inspector');
        await supabase
          .from('inspection_checklists')
          .update({ inspector_signature_url: inspectorSignatureUrl })
          .eq('id', data.id);
      }

      // Get default items or use provided items
      const itemsToCreate = checklistData.items && checklistData.items.length > 0 
        ? checklistData.items 
        : getDefaultChecklistItems();

      // Create checklist items
      if (itemsToCreate && itemsToCreate.length > 0) {
        const items = itemsToCreate.map((item, index) => ({
          checklist_id: data.id,
          room: item.room,
          item_name: item.item_name,
          condition: item.condition || null,
          notes: item.notes || null,
          sort_order: item.sort_order !== undefined ? item.sort_order : index
        }));

        const { data: itemsData, error: itemsError } = await supabase
          .from('checklist_items')
          .insert(items)
          .select();

        if (itemsError) throw itemsError;

        // Upload photos for items
        for (let i = 0; i < itemsData.length; i++) {
          const item = itemsToCreate[i];
          if (item.photos && item.photos.length > 0) {
            const photos = [];
            for (const photo of item.photos) {
              if (photo.startsWith('data:')) {
                // Upload photo from data URL
                const photoUrl = await uploadPhotoFromDataUrl(photo, data.id, itemsData[i].id);
                photos.push({ photo_url: photoUrl, caption: '' });
              } else {
                photos.push({ photo_url: photo, caption: '' });
              }
            }
            if (photos.length > 0) {
              await supabase
                .from('checklist_photos')
                .insert(photos.map(p => ({
                  checklist_item_id: itemsData[i].id,
                  photo_url: p.photo_url,
                  caption: p.caption
                })));
            }
          }
        }
      }

      await fetchChecklists();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error creating checklist:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update checklist
  const updateChecklist = async (id, checklistData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('inspection_checklists')
        .update({
          property_id: checklistData.property_id,
          tenant_id: checklistData.tenant_id,
          unit_number: checklistData.unit_number,
          inspection_type: checklistData.inspection_type,
          inspection_date: checklistData.inspection_date,
          inspector_name: checklistData.inspector_name,
          tenant_present: checklistData.tenant_present,
          tenant_signature_url: checklistData.tenant_signature_url,
          inspector_signature_url: checklistData.inspector_signature_url,
          overall_condition: checklistData.overall_condition,
          notes: checklistData.notes,
          status: checklistData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('created_by', user.id);

      if (updateError) throw updateError;

      await fetchChecklists();
    } catch (err) {
      setError(err.message);
      console.error('Error updating checklist:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete checklist
  const deleteChecklist = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all items for this checklist
      const { data: items } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('checklist_id', id);

      if (items && items.length > 0) {
        const itemIds = items.map(item => item.id);

        // Delete photos
        await supabase
          .from('checklist_photos')
          .delete()
          .in('checklist_item_id', itemIds);

        // Delete items
        await supabase
          .from('checklist_items')
          .delete()
          .eq('checklist_id', id);
      }

      // Delete checklist
      const { error: deleteError } = await supabase
        .from('inspection_checklists')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id);

      if (deleteError) throw deleteError;

      await fetchChecklists();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting checklist:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create or update checklist item
  const saveChecklistItem = async (checklistId, item) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (item.id) {
        // Update existing item
        const { data: updatedItem, error: updateError } = await supabase
          .from('checklist_items')
          .update({
            room: item.room,
            item_name: item.item_name,
            condition: item.condition,
            notes: item.notes,
            sort_order: item.sort_order
          })
          .eq('id', item.id)
          .eq('checklist_id', checklistId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Handle photos
        if (item.photos) {
          // Delete existing photos
          await supabase
            .from('checklist_photos')
            .delete()
            .eq('checklist_item_id', item.id);

          // Insert new photos
          const photosToInsert = item.photos
            .filter(p => p && p.trim())
            .map(photo => ({
              checklist_item_id: item.id,
              photo_url: photo,
              caption: ''
            }));

          if (photosToInsert.length > 0) {
            await supabase
              .from('checklist_photos')
              .insert(photosToInsert);
          }
        }

        return updatedItem;
      } else {
        // Create new item
        const { data: newItem, error: insertError } = await supabase
          .from('checklist_items')
          .insert({
            checklist_id: checklistId,
            room: item.room,
            item_name: item.item_name,
            condition: item.condition || null,
            notes: item.notes || null,
            sort_order: item.sort_order || 0
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Handle photos
        if (item.photos && item.photos.length > 0) {
          const photosToInsert = item.photos
            .filter(p => p && p.trim())
            .map(photo => ({
              checklist_item_id: newItem.id,
              photo_url: photo,
              caption: ''
            }));

          if (photosToInsert.length > 0) {
            await supabase
              .from('checklist_photos')
              .insert(photosToInsert);
          }
        }

        await fetchChecklists();
        return newItem;
      }
    } catch (err) {
      setError(err.message);
      console.error('Error saving checklist item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete checklist item
  const deleteChecklistItem = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      // Delete photos first
      await supabase
        .from('checklist_photos')
        .delete()
        .eq('checklist_item_id', itemId);

      // Delete item
      const { error: deleteError } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      await fetchChecklists();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting checklist item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload photo file to storage
  const uploadPhoto = async (file, checklistId, itemId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${checklistId}/${itemId || 'general'}/${Date.now()}.${fileExt}`;
      const filePath = `checklist-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('checklist-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('checklist-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading photo:', err);
      throw err;
    }
  };

  // Upload photo from data URL
  const uploadPhotoFromDataUrl = async (dataUrl, checklistId, itemId = null) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}.png`, { type: 'image/png' });
      return await uploadPhoto(file, checklistId, itemId);
    } catch (err) {
      console.error('Error uploading photo from data URL:', err);
      throw err;
    }
  };

  // Upload signature to storage
  const uploadSignature = async (dataUrl, checklistId, signatureType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${signatureType}-signature.png`, { type: 'image/png' });

      const fileName = `${user.id}/${checklistId}/${signatureType}-${Date.now()}.png`;
      const filePath = `checklist-signatures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('checklist-signatures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('checklist-signatures')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading signature:', err);
      throw err;
    }
  };

  // Delete photo from storage
  const deletePhoto = async (photoUrl) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('checklist-photos'));
      if (bucketIndex === -1) return;

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error: deleteError } = await supabase.storage
        .from('checklist-photos')
        .remove([filePath]);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error deleting photo:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  return {
    checklists,
    loading,
    error,
    fetchChecklists,
    fetchChecklist,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    saveChecklistItem,
    deleteChecklistItem,
    uploadPhoto,
    uploadSignature,
    deletePhoto
  };
};
