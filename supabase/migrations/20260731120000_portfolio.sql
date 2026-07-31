create table public.asset_classes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  is_starter boolean not null default false
);

create index asset_classes_household_id_idx on public.asset_classes (household_id);

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  asset_class_id uuid not null references public.asset_classes (id),
  name text not null,
  quantity numeric check (quantity is null or quantity > 0),
  cost_basis_yen integer check (cost_basis_yen is null or cost_basis_yen > 0),
  created_at timestamptz not null default now()
);

create index holdings_household_id_idx on public.holdings (household_id);
create index holdings_asset_class_id_idx on public.holdings (asset_class_id);

create table public.snapshot_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  as_of_date date not null,
  created_at timestamptz not null default now()
);

create index snapshot_sessions_household_id_idx on public.snapshot_sessions (household_id);
create index snapshot_sessions_as_of_date_idx on public.snapshot_sessions (as_of_date);

create table public.holding_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.snapshot_sessions (id) on delete cascade,
  holding_id uuid not null references public.holdings (id) on delete cascade,
  unit_price_yen integer check (unit_price_yen is null or unit_price_yen > 0),
  total_value_yen integer check (total_value_yen is null or total_value_yen > 0),
  carried_forward boolean not null default false,
  unique (session_id, holding_id),
  check (
    (
      unit_price_yen is not null
      and total_value_yen is null
    )
    or (
      unit_price_yen is null
      and total_value_yen is not null
    )
  )
);

create index holding_snapshots_session_id_idx on public.holding_snapshots (session_id);
create index holding_snapshots_holding_id_idx on public.holding_snapshots (holding_id);

insert into public.asset_classes (household_id, name, is_starter)
select h.id, starter.name, true
from public.households h
cross join (
  values
    ('Stocks'),
    ('Collectibles'),
    ('Private')
) as starter (name)
where not exists (
  select 1
  from public.asset_classes ac
  where ac.household_id = h.id
    and ac.name = starter.name
);

create or replace function public.bootstrap_owner_household(household_name text default 'Our household')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing_household_id uuid;
  new_household_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select household_id
  into existing_household_id
  from public.household_members
  where user_id = uid
  limit 1;

  if existing_household_id is not null then
    return existing_household_id;
  end if;

  insert into public.households (name)
  values (household_name)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, uid, 'owner');

  insert into public.categories (household_id, name, kind, is_starter) values
    (new_household_id, 'Food', 'expense', true),
    (new_household_id, 'Transport', 'expense', true),
    (new_household_id, 'Rent', 'expense', true),
    (new_household_id, 'Utilities', 'expense', true),
    (new_household_id, 'Healthcare', 'expense', true),
    (new_household_id, 'Entertainment', 'expense', true),
    (new_household_id, 'Shopping', 'expense', true),
    (new_household_id, 'Other', 'expense', true),
    (new_household_id, 'Salary', 'income', true),
    (new_household_id, 'Bonus', 'income', true),
    (new_household_id, 'Other', 'income', true);

  insert into public.asset_classes (household_id, name, is_starter) values
    (new_household_id, 'Stocks', true),
    (new_household_id, 'Collectibles', true),
    (new_household_id, 'Private', true);

  return new_household_id;
end;
$$;

alter table public.asset_classes enable row level security;
alter table public.holdings enable row level security;
alter table public.snapshot_sessions enable row level security;
alter table public.holding_snapshots enable row level security;

create policy asset_classes_select on public.asset_classes
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy asset_classes_insert on public.asset_classes
for insert to authenticated
with check (household_id in (select public.user_household_ids()));

create policy asset_classes_update on public.asset_classes
for update to authenticated
using (household_id in (select public.user_household_ids()))
with check (household_id in (select public.user_household_ids()));

create policy asset_classes_delete on public.asset_classes
for delete to authenticated
using (
  household_id in (select public.user_household_ids())
  and is_starter = false
);

create policy holdings_select on public.holdings
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy holdings_insert on public.holdings
for insert to authenticated
with check (household_id in (select public.user_household_ids()));

create policy holdings_update on public.holdings
for update to authenticated
using (household_id in (select public.user_household_ids()))
with check (household_id in (select public.user_household_ids()));

create policy holdings_delete on public.holdings
for delete to authenticated
using (household_id in (select public.user_household_ids()));

create policy snapshot_sessions_select on public.snapshot_sessions
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy snapshot_sessions_insert on public.snapshot_sessions
for insert to authenticated
with check (household_id in (select public.user_household_ids()));

create policy snapshot_sessions_update on public.snapshot_sessions
for update to authenticated
using (household_id in (select public.user_household_ids()))
with check (household_id in (select public.user_household_ids()));

create policy snapshot_sessions_delete on public.snapshot_sessions
for delete to authenticated
using (household_id in (select public.user_household_ids()));

create policy holding_snapshots_select on public.holding_snapshots
for select to authenticated
using (
  session_id in (
    select id
    from public.snapshot_sessions
    where household_id in (select public.user_household_ids())
  )
);

create policy holding_snapshots_insert on public.holding_snapshots
for insert to authenticated
with check (
  session_id in (
    select id
    from public.snapshot_sessions
    where household_id in (select public.user_household_ids())
  )
);

create policy holding_snapshots_update on public.holding_snapshots
for update to authenticated
using (
  session_id in (
    select id
    from public.snapshot_sessions
    where household_id in (select public.user_household_ids())
  )
)
with check (
  session_id in (
    select id
    from public.snapshot_sessions
    where household_id in (select public.user_household_ids())
  )
);

create policy holding_snapshots_delete on public.holding_snapshots
for delete to authenticated
using (
  session_id in (
    select id
    from public.snapshot_sessions
    where household_id in (select public.user_household_ids())
  )
);
