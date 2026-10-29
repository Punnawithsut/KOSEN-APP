UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]
WHERE id = 'dorm-files';

DROP POLICY IF EXISTS "Admins update dorm files" ON storage.objects;
CREATE POLICY "Admins update dorm files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'dorm-files' AND public.is_current_user_admin())
WITH CHECK (bucket_id = 'dorm-files' AND public.is_current_user_admin());
