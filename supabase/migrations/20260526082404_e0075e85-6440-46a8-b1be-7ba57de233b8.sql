
-- Remove the over-permissive insert policy on receipts bucket
DROP POLICY IF EXISTS "Receipts insert by authed" ON storage.objects;

-- Ensure path-scoped user insert exists
DROP POLICY IF EXISTS "Users upload own receipts" ON storage.objects;
CREATE POLICY "Users upload own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Staff can upload on behalf of users
DROP POLICY IF EXISTS "Staff upload receipts" ON storage.objects;
CREATE POLICY "Staff upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND public.is_admin_or_owner(auth.uid())
);
