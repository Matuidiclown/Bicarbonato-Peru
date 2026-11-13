-- Migración 0001: Contención inmediata en public.whatsapp_sellers (Paso 2)
-- Revoca el permiso UPDATE general del rol anon para impedir cambios en
-- phone_number, pin, ref_code, name o is_active desde el navegador.
-- Mantiene únicamente UPDATE sobre last_assigned_at para la rotación actual.

revoke update on public.whatsapp_sellers from anon;
grant update (last_assigned_at) on public.whatsapp_sellers to anon;