import { supabase } from '../../lib/supabase.js';
import { generateChecklistPDF } from '../../utils/generateChecklistPDF.js';

const BUCKET = 'checklist-pdfs';

// Generate the walkthrough PDF, upload it to the checklist-pdfs bucket,
// trigger a browser download, and return the storage path so the caller
// can persist it on inspection_checklists.pdf_storage_path.

export async function generateAndUploadWalkthroughPDF({ checklist, items, properties = [], tenants = [] }) {
  if (!checklist || !checklist.id) throw new Error('Checklist required to generate PDF');

  const enrichedChecklist = { ...checklist, checklist_items: items || [] };
  const { blob, filename } = await generateChecklistPDF(
    enrichedChecklist,
    properties,
    tenants,
    { embedPhotos: true, returnBlob: true, maxPhotosPerItem: 4 }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const storagePath = `${user.id}/${checklist.id}/${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, {
      contentType: 'application/pdf',
      upsert: false
    });
  if (uploadError) {
    console.error('[pdfGenerator] upload failed:', uploadError);
    throw uploadError;
  }

  triggerBrowserDownload(blob, filename);

  return { storagePath, filename };
}

function triggerBrowserDownload(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('[pdfGenerator] browser download failed:', err);
  }
}
