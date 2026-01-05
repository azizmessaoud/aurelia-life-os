-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Allow all access to academic-materials" ON storage.objects;

-- Create policy for authenticated users to SELECT their own materials
CREATE POLICY "Users can view their own academic materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'academic-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to INSERT their own materials
CREATE POLICY "Users can upload their own academic materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'academic-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to UPDATE their own materials
CREATE POLICY "Users can update their own academic materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'academic-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'academic-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to DELETE their own materials
CREATE POLICY "Users can delete their own academic materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'academic-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Make the bucket private (not publicly accessible)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'academic-materials';