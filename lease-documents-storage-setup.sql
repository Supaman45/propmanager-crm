-- Supabase Storage Setup for Lease Documents
-- Run this SQL in your Supabase SQL Editor

-- Create storage bucket for lease documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('lease-documents', 'lease-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to make this script idempotent)
DROP POLICY IF EXISTS "Users can upload their own lease documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own lease documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own lease documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own lease documents" ON storage.objects;

-- Create storage policy to allow authenticated users to upload their own lease documents
-- Documents are organized by user_id/tenant_id/filename
CREATE POLICY "Users can upload their own lease documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lease-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policy to allow users to view their own lease documents
CREATE POLICY "Users can view their own lease documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lease-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policy to allow users to update their own lease documents
CREATE POLICY "Users can update their own lease documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lease-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policy to allow users to delete their own lease documents
CREATE POLICY "Users can delete their own lease documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lease-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
