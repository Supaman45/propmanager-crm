-- Supabase Storage Setup for Property Photos
-- Run this SQL in your Supabase SQL Editor

-- Create storage bucket for property photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to make this script idempotent)
DROP POLICY IF EXISTS "Users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property photos" ON storage.objects;

-- Create storage policy to allow authenticated users to upload photos
CREATE POLICY "Users can upload property photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage policy to allow users to view their own photos
CREATE POLICY "Users can view their own property photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage policy to allow users to update their own photos
CREATE POLICY "Users can update their own property photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage policy to allow users to delete their own photos
CREATE POLICY "Users can delete their own property photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
