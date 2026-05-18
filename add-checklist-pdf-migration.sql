-- Migration: Add pdf_storage_path column to inspection_checklists
-- Run this SQL in your Supabase SQL Editor.
--
-- Supports the checklists v1 walkthrough feature. After a PM completes a
-- mobile walkthrough and both signatures are captured, the app generates a
-- PDF and uploads it to the checklist-pdfs storage bucket. The path is
-- recorded here so the inspection list can offer a "Download PDF" button
-- later without re-generating the document.
--
-- After running this SQL, also create the storage bucket manually in the
-- Supabase dashboard: name "checklist-pdfs", public, 10MB max,
-- application/pdf mime type. The app does not provision storage buckets.

ALTER TABLE inspection_checklists
  ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;
