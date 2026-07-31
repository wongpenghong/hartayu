create table public.collectible_market_links (
  holding_id uuid primary key references public.holdings (id) on delete cascade,
  collectible_code text not null,
  snkrdunk_product_id integer not null check (snkrdunk_product_id > 0),
  condition_grade text not null check (
    condition_grade in ('a', 'b', 'c', 'd', 'psa9', 'psa10')
  ),
  last_fetched_at timestamptz,
  last_fetch_error text,
  created_at timestamptz not null default now()
);

create index collectible_market_links_product_id_idx
  on public.collectible_market_links (snkrdunk_product_id);

alter table public.collectible_market_links enable row level security;

create policy collectible_market_links_select on public.collectible_market_links
for select to authenticated
using (
  holding_id in (
    select id
    from public.holdings
    where household_id in (select public.user_household_ids())
  )
);

create policy collectible_market_links_insert on public.collectible_market_links
for insert to authenticated
with check (
  holding_id in (
    select id
    from public.holdings
    where household_id in (select public.user_household_ids())
  )
);

create policy collectible_market_links_update on public.collectible_market_links
for update to authenticated
using (
  holding_id in (
    select id
    from public.holdings
    where household_id in (select public.user_household_ids())
  )
)
with check (
  holding_id in (
    select id
    from public.holdings
    where household_id in (select public.user_household_ids())
  )
);

create policy collectible_market_links_delete on public.collectible_market_links
for delete to authenticated
using (
  holding_id in (
    select id
    from public.holdings
    where household_id in (select public.user_household_ids())
  )
);
