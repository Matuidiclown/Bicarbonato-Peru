-- Migracion 0004: cuentas de vendedora con Supabase Auth (Paso 6)
-- Estado ya aplicado en Supabase. Este archivo deja constancia en el repositorio.
-- Requisito por vendedora: usuario de Auth con app_metadata = {"role":"seller","seller_id":"<id en whatsapp_sellers>"}
-- (se asigna aparte con un UPDATE sobre auth.users; no se incluye aqui).

-- 1) Lee desde el token a que vendedora pertenece la sesion
create or replace function public.current_seller_id()
returns uuid
language sql
stable
as $$
  select case
    when coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'seller'
    then nullif(auth.jwt() -> 'app_metadata' ->> 'seller_id', '')::uuid
  end
$$;

-- 2) Cada vendedora solo LEE lo suyo
create policy "Seller read own orders" on public.orders
  for select to authenticated
  using (seller_id = (select public.current_seller_id()));

create policy "Seller read own order_items" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.seller_id = (select public.current_seller_id())
  ));

create policy "Seller read own profile" on public.whatsapp_sellers
  for select to authenticated
  using (id = (select public.current_seller_id()));

-- 3) Cambiar estado (solo de SUS pedidos y con estados validos)
create or replace function public.seller_set_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_seller uuid := public.current_seller_id();
begin
  if v_seller is null then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_status not in ('pending','confirmed','dispatched','cancelled') then
    raise exception 'Estado invalido' using errcode = '22023';
  end if;
  update public.orders
     set status = p_status
   where id = p_order_id and seller_id = v_seller and coalesce(is_deleted, false) = false;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
end;
$$;

-- 4) Mover a papelera (solo de SUS pedidos)
create or replace function public.seller_trash_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_seller uuid := public.current_seller_id();
begin
  if v_seller is null then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  update public.orders
     set is_deleted = true, deleted_at = now()
   where id = p_order_id and seller_id = v_seller and coalesce(is_deleted, false) = false;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.seller_set_order_status(uuid, text) from public, anon;
revoke all on function public.seller_trash_order(uuid) from public, anon;
grant execute on function public.seller_set_order_status(uuid, text) to authenticated;
grant execute on function public.seller_trash_order(uuid) to authenticated;

-- Reversion:
-- drop policy if exists "Seller read own orders" on public.orders;
-- drop policy if exists "Seller read own order_items" on public.order_items;
-- drop policy if exists "Seller read own profile" on public.whatsapp_sellers;
-- drop function if exists public.seller_set_order_status(uuid, text);
-- drop function if exists public.seller_trash_order(uuid);
-- drop function if exists public.current_seller_id();
