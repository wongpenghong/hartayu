create or replace function public.create_holdings_batch(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_household_id uuid;
  v_rows jsonb;
  v_item jsonb;
  v_holding_id uuid;
  v_market_link jsonb;
  v_result jsonb := '[]'::jsonb;
  v_name text;
  v_quantity numeric;
  v_cost_basis integer;
  v_asset_class_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_household_id := (p_payload ->> 'household_id')::uuid;
  v_rows := p_payload -> 'holdings';

  if v_household_id is null then
    raise exception 'household_id is required';
  end if;

  if v_household_id not in (select public.user_household_ids()) then
    raise exception 'Household not accessible';
  end if;

  if v_rows is null or jsonb_typeof(v_rows) <> 'array' or jsonb_array_length(v_rows) = 0 then
    raise exception 'At least one holding is required';
  end if;

  for v_item in select value from jsonb_array_elements(v_rows)
  loop
    v_name := trim(v_item ->> 'name');
    v_asset_class_id := (v_item ->> 'asset_class_id')::uuid;
    v_quantity := nullif(v_item ->> 'quantity', '')::numeric;
    v_cost_basis := nullif(v_item ->> 'cost_basis_yen', '')::integer;
    v_market_link := v_item -> 'market_link';

    if v_name is null or v_name = '' then
      raise exception 'Holding name is required';
    end if;

    if char_length(v_name) > 80 then
      raise exception 'Holding name must be 80 characters or fewer';
    end if;

    if v_asset_class_id is null then
      raise exception 'Asset class is required';
    end if;

    if not exists (
      select 1
      from public.asset_classes ac
      where ac.id = v_asset_class_id
        and ac.household_id = v_household_id
    ) then
      raise exception 'Asset class does not belong to household';
    end if;

    if v_quantity is not null and v_quantity <= 0 then
      raise exception 'Quantity must be a positive number';
    end if;

    if v_cost_basis is not null and v_cost_basis <= 0 then
      raise exception 'Cost basis must be a positive whole yen amount';
    end if;

    insert into public.holdings (
      household_id,
      asset_class_id,
      name,
      quantity,
      cost_basis_yen
    )
    values (
      v_household_id,
      v_asset_class_id,
      v_name,
      v_quantity,
      v_cost_basis
    )
    returning id into v_holding_id;

    if v_market_link is not null and v_market_link <> 'null'::jsonb then
      if coalesce(trim(v_market_link ->> 'collectible_code'), '') = '' then
        raise exception 'Collectible code is required for market link';
      end if;

      if coalesce(v_market_link ->> 'snkrdunk_product_id', '') = '' then
        raise exception 'SNKRDUNK product ID is required for market link';
      end if;

      if coalesce(v_market_link ->> 'condition_grade', '') = '' then
        raise exception 'Condition grade is required for market link';
      end if;

      insert into public.collectible_market_links (
        holding_id,
        collectible_code,
        snkrdunk_product_id,
        condition_grade
      )
      values (
        v_holding_id,
        trim(v_market_link ->> 'collectible_code'),
        (v_market_link ->> 'snkrdunk_product_id')::integer,
        v_market_link ->> 'condition_grade'
      );
    end if;

    v_result := v_result || jsonb_build_array(
      jsonb_build_object(
        'id', v_holding_id,
        'household_id', v_household_id,
        'asset_class_id', v_asset_class_id,
        'name', v_name,
        'quantity', v_quantity,
        'cost_basis_yen', v_cost_basis,
        'market_link', v_market_link
      )
    );
  end loop;

  return v_result;
end;
$$;

grant execute on function public.create_holdings_batch(jsonb) to authenticated;
