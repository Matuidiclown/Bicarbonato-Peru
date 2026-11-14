-- MigraciÃ³n 0002: CreaciÃ³n atÃ³mica de pedidos y cÃ¡lculo de precios en servidor (Paso 4)
-- Reemplaza el cÃ¡lculo de precios y la asignaciÃ³n de asesora desde el navegador.

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_district text,
  p_address text,
  p_notes text default null,
  p_ref_code text default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_name text;
  v_customer_phone text;
  v_district text;
  v_address text;
  v_notes text;
  v_ref_code text;
  v_raw_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_grouped_item record;
  v_product record;
  v_base_price numeric(10, 2);
  v_unit_price numeric(10, 2);
  v_line_base numeric(10, 2);
  v_line_subtotal numeric(10, 2);
  v_subtotal_base numeric(10, 2) := 0;
  v_total_amount numeric(10, 2) := 0;
  v_total_savings numeric(10, 2) := 0;
  v_seller_id uuid;
  v_raw_seller_phone text;
  v_clean_digits text;
  v_seller_phone text;
  v_order_id uuid;
  v_order_number integer;
  v_calculated_items jsonb := '[]'::jsonb;
begin
  -- 1. ValidaciÃ³n y sanitizaciÃ³n de datos del cliente
  v_customer_name := trim(coalesce(p_customer_name, ''));
  if char_length(v_customer_name) < 2 or char_length(v_customer_name) > 120 then
    raise exception 'Ingresa un nombre y apellido vÃ¡lido (entre 2 y 120 caracteres).'
      using errcode = '22023';
  end if;

  v_customer_phone := trim(coalesce(p_customer_phone, ''));
  if v_customer_phone !~ '^9\d{8}$' then
    raise exception 'Ingresa un nÃºmero de celular peruano vÃ¡lido (9 dÃ­gitos comenzando con 9).'
      using errcode = '22023';
  end if;

  v_district := trim(coalesce(p_district, ''));
  if char_length(v_district) < 2 or char_length(v_district) > 80 then
    raise exception 'Por favor, selecciona un distrito de entrega vÃ¡lido.'
      using errcode = '22023';
  end if;

  v_address := trim(coalesce(p_address, ''));
  if char_length(v_address) < 4 or char_length(v_address) > 250 then
    raise exception 'Ingresa una direcciÃ³n exacta vÃ¡lida (entre 4 y 250 caracteres).'
      using errcode = '22023';
  end if;

  v_notes := nullif(trim(coalesce(p_notes, '')), '');
  if v_notes is not null and char_length(v_notes) > 300 then
    raise exception 'La referencia o notas adicionales no puede superar los 300 caracteres.'
      using errcode = '22023';
  end if;

  v_ref_code := lower(nullif(trim(coalesce(p_ref_code, '')), ''));
  if v_ref_code is not null and char_length(v_ref_code) > 60 then
    v_ref_code := null;
  end if;

  -- 2. ValidaciÃ³n del arreglo de Ã­tems
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'El formato del carrito es invÃ¡lido.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito estÃ¡ vacÃ­o.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'El pedido excede el mÃ¡ximo de lÃ­neas permitidas.'
      using errcode = '22023';
  end if;

  -- Validar cada elemento individual antes de agrupar
  for v_raw_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_raw_item) <> 'object' then
      raise exception 'Ãtem invÃ¡lido en el carrito.'
        using errcode = '22023';
    end if;

    begin
      v_product_id := (v_raw_item ->> 'product_id')::uuid;
    exception when others then
      raise exception 'Identificador de producto invÃ¡lido.'
        using errcode = '22023';
    end;

    if v_product_id is null then
      raise exception 'Falta el identificador del producto.'
        using errcode = '22023';
    end if;

    if coalesce(v_raw_item ->> 'quantity', '') !~ '^\d+$' then
      raise exception 'La cantidad de cada producto debe ser un nÃºmero entero positivo.'
        using errcode = '22023';
    end if;

    v_quantity := (v_raw_item ->> 'quantity')::integer;
    if v_quantity <= 0 or v_quantity > 10000 then
      raise exception 'La cantidad por producto debe estar entre 1 y 10,000 unidades.'
        using errcode = '22023';
    end if;
  end loop;

  -- 3. CÃ¡lculo autoritativo de precios por escala desde price_tiers
  for v_grouped_item in
    select
      (t.elem ->> 'product_id')::uuid as product_id,
      sum((t.elem ->> 'quantity')::integer)::integer as total_quantity
    from jsonb_array_elements(p_items) with ordinality as t(elem, ord)
    group by (t.elem ->> 'product_id')::uuid
    order by min(t.ord)
  loop
    select id, name, presentation, is_active
    into v_product
    from public.products
    where id = v_grouped_item.product_id;

    if not found or coalesce(v_product.is_active, false) = false then
      raise exception 'Uno o mÃ¡s productos de tu carrito ya no estÃ¡n disponibles. Actualiza la pÃ¡gina.'
        using errcode = 'P0002';
    end if;

    -- Precio base (min_quantity = 1 o el menor tramo configurado)
    select pt.unit_price
    into v_base_price
    from public.price_tiers pt
    where pt.product_id = v_product.id
    order by (case when pt.min_quantity = 1 then 0 else 1 end), pt.min_quantity asc
    limit 1;

    if v_base_price is null or v_base_price <= 0 then
      raise exception 'El producto "%" no tiene un precio vÃ¡lido configurado.', v_product.name
        using errcode = 'P0002';
    end if;

    -- Tramo aplicable con mayor min_quantity <= cantidad solicitada
    select pt.unit_price
    into v_unit_price
    from public.price_tiers pt
    where pt.product_id = v_product.id
      and pt.min_quantity <= v_grouped_item.total_quantity
    order by pt.min_quantity desc, pt.unit_price asc
    limit 1;

    if v_unit_price is null or v_unit_price <= 0 then
      v_unit_price := v_base_price;
    end if;

    v_line_base := round(v_base_price * v_grouped_item.total_quantity, 2);
    v_line_subtotal := round(v_unit_price * v_grouped_item.total_quantity, 2);

    v_subtotal_base := v_subtotal_base + v_line_base;
    v_total_amount := v_total_amount + v_line_subtotal;

    v_calculated_items := v_calculated_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'presentation', coalesce(nullif(trim(v_product.presentation), ''), 'Unidad'),
        'quantity', v_grouped_item.total_quantity,
        'applied_unit_price', v_unit_price,
        'subtotal', v_line_subtotal
      )
    );
  end loop;

  v_total_savings := greatest(0, round(v_subtotal_base - v_total_amount, 2));

  -- 4. Regla de negocio RN-01: Monto mÃ­nimo de S/ 40.00 en servidor
  if v_total_amount < 40.00 then
    raise exception 'El monto mÃ­nimo de productos es S/ 40.00. Agrega mÃ¡s Ã­tems.'
      using errcode = '22023';
  end if;

  -- 5. AsignaciÃ³n atÃ³mica de asesora (Referido activo vs. Round-Robin con bloqueo de fila)
  if v_ref_code is not null then
    select id, phone_number
    into v_seller_id, v_raw_seller_phone
    from public.whatsapp_sellers
    where lower(trim(ref_code)) = v_ref_code
      and is_active = true
    limit 1;
  end if;

  if v_seller_id is null then
    select id, phone_number
    into v_seller_id, v_raw_seller_phone
    from public.whatsapp_sellers
    where is_active = true
    order by last_assigned_at asc nulls first, order_position asc
    limit 1
    for update;

    if v_seller_id is not null then
      update public.whatsapp_sellers
      set last_assigned_at = now()
      where id = v_seller_id;
    end if;
  end if;

  if v_raw_seller_phone is null or trim(v_raw_seller_phone) = '' then
    v_raw_seller_phone := '924428558';
  end if;

  v_clean_digits := regexp_replace(v_raw_seller_phone, '\D', '', 'g');
  v_seller_phone := '51' || right(v_clean_digits, 9);

  -- 6. InserciÃ³n transaccional de cabecera y detalle
  insert into public.orders (
    customer_name,
    customer_phone,
    address,
    delivery_address,
    district_name,
    delivery_district,
    reference,
    notes,
    delivery_type,
    payment_method,
    total_amount,
    subtotal,
    discount_amount,
    savings_amount,
    assigned_seller_phone,
    seller_id,
    is_deleted,
    status
  ) values (
    v_customer_name,
    v_customer_phone,
    v_address,
    v_address,
    v_district,
    v_district,
    v_notes,
    v_notes,
    'Delivery a domicilio',
    'Pago contra entrega',
    v_total_amount,
    v_subtotal_base,
    v_total_savings,
    v_total_savings,
    v_seller_phone,
    v_seller_id,
    false,
    'pending'
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    presentation,
    quantity,
    applied_unit_price,
    subtotal
  )
  select
    v_order_id,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name',
    item ->> 'presentation',
    (item ->> 'quantity')::integer,
    (item ->> 'applied_unit_price')::numeric,
    (item ->> 'subtotal')::numeric
  from jsonb_array_elements(v_calculated_items) as item;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'seller_phone', v_seller_phone,
    'subtotal_base', v_subtotal_base,
    'total_discount', v_total_savings,
    'total_amount', v_total_amount,
    'items', v_calculated_items
  );
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, text, text, jsonb) to anon, authenticated;