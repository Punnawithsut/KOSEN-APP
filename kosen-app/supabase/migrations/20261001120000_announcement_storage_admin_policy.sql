CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users AS app_user
    WHERE app_user.user_id = auth.uid()
      AND app_user.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins upload announcement files" ON storage.objects;
CREATE POLICY "Admins upload announcement files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcement-files'
  AND public.is_current_user_admin()
);

DROP POLICY IF EXISTS "Admins delete announcement files" ON storage.objects;
CREATE POLICY "Admins delete announcement files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'announcement-files'
  AND public.is_current_user_admin()
);