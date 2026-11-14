-- Migracion 0003: rol de administrador real y politicas RLS (Paso 5)
-- Estado ya aplicado en Supabase. Este archivo deja constancia en el repositorio.
-- Requisito: el usuario administrador debe tener app_metadata.role = 'admin'
-- (se asigno aparte con un UPDATE sobre auth.users; no se incluye aqui).

-- 1. Funcion que lee el rol desde el token de sesion (app_metadata no es editable por el usuario).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- 2. Tablas: solo el administrador puede leer y escribir todo.
alter policy "Admin Full Categories"  on public.categories        using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin full order_items" on public.order_items       using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin full orders"      on public.orders            using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin Full Price Tiers" on public.price_tiers       using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin Full Products"    on public.products          using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "Admin Full Sellers"     on public.whatsapp_sellers  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 3. Storage: imagenes de producto, solo administrador.
alter policy "Admin Delete Product Images" on storage.objects
  using (bucket_id = 'product-images' and (select public.is_admin()));
alter policy "Admin Upload Product Images" on storage.objects
  with check (bucket_id = 'product-images' and (select public.is_admin()));

-- Reversion (solo si hiciera falta volver al estado anterior):
-- alter policy "Admin Full Categories"  on public.categories        using (true) with check (true);
-- alter policy "Admin full order_items" on public.order_items       using (true) with check (true);
-- alter policy "Admin full orders"      on public.orders            using (true) with check (true);
-- alter policy "Admin Full Price Tiers" on public.price_tiers       using (true) with check (true);
-- alter policy "Admin Full Products"    on public.products          using (true) with check (true);
-- alter policy "Admin Full Sellers"     on public.whatsapp_sellers  using (true) with check (true);
-- alter policy "Admin Delete Product Images" on storage.objects using (bucket_id = 'product-images');
-- alter policy "Admin Upload Product Images" on storage.objects with check (bucket_id = 'product-images');
