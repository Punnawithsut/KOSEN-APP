INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('announcement-files', 'announcement-files', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

CREATE POLICY "Authenticated users read announcement files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'announcement-files');

CREATE POLICY "Admins upload announcement files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcement-files'
  AND EXISTS (
    SELECT 1
    FROM public.users AS app_user
    WHERE app_user.user_id = auth.uid()
      AND app_user.role = 'admin'
  )
);

CREATE POLICY "Admins delete announcement files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'announcement-files'
  AND EXISTS (
    SELECT 1
    FROM public.users AS app_user
    WHERE app_user.user_id = auth.uid()
      AND app_user.role = 'admin'
  )
);