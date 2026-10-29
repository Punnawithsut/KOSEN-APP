INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dorm-files', 'dorm-files', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users read dorm files" ON storage.objects;
CREATE POLICY "Authenticated users read dorm files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dorm-files');

DROP POLICY IF EXISTS "Admins upload dorm files" ON storage.objects;
CREATE POLICY "Admins upload dorm files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dorm-files' AND public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins delete dorm files" ON storage.objects;
CREATE POLICY "Admins delete dorm files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dorm-files' AND public.is_current_user_admin());
