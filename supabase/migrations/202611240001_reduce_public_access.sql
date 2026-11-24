begin;

-- The separate authenticated admin policy already covers viewing draft products.
alter policy "Published products are public" on public.products using (published);

-- Authenticated callers can read their own membership through its existing RLS policy.
alter function public.is_admin() security invoker;
revoke execute on function public.is_admin() from public, anon;

-- Public product image URLs are served without an object SELECT policy.
alter policy "Public product media" on storage.objects
  to authenticated using (bucket_id = 'product-media' and public.is_admin());

commit;
