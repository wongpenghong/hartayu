create extension if not exists "pgcrypto";

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx on public.household_members (user_id);

create table public.household_invites (
  token uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index household_invites_household_id_idx on public.household_invites (household_id);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  primary_member_id uuid references auth.users (id),
  archived_at timestamptz
);

create index accounts_household_id_idx on public.accounts (household_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  is_starter boolean not null default false
);

create index categories_household_id_idx on public.categories (household_id);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  account_id uuid not null references public.accounts (id),
  category_id uuid not null references public.categories (id),
  member_id uuid not null references auth.users (id),
  kind text not null check (kind in ('expense', 'income')),
  amount_yen integer not null check (amount_yen > 0),
  entry_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_household_id_idx on public.entries (household_id);
create index entries_account_id_idx on public.entries (account_id);
create index entries_category_id_idx on public.entries (category_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
before update on public.entries
for each row
execute function public.set_updated_at();

create or replace function public.user_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid()
$$;

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

  return new_household_id;
end;
$$;

revoke all on function public.bootstrap_owner_household(text) from public;
grant execute on function public.bootstrap_owner_household(text) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;

create policy households_select on public.households
for select to authenticated
using (id in (select public.user_household_ids()));

create policy household_members_select on public.household_members
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy household_invites_select on public.household_invites
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy household_invites_insert on public.household_invites
for insert to authenticated
with check (
  household_id in (select public.user_household_ids())
  and exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_invites.household_id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  )
);

create policy household_invites_update on public.household_invites
for update to authenticated
using (
  household_id in (select public.user_household_ids())
  and exists (
    select 1
    from public.household_members hm
    where hm.household_id = household_invites.household_id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  )
)
with check (household_id in (select public.user_household_ids()));

create policy accounts_select on public.accounts
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy accounts_insert on public.accounts
for insert to authenticated
with check (household_id in (select public.user_household_ids()));

create policy accounts_update on public.accounts
for update to authenticated
using (household_id in (select public.user_household_ids()))
with check (household_id in (select public.user_household_ids()));

create policy categories_select on public.categories
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy categories_insert on public.categories
for insert to authenticated
with check (household_id in (select public.user_household_ids()));

create policy categories_update on public.categories
for update to authenticated
using (household_id in (select public.user_household_ids()))
with check (household_id in (select public.user_household_ids()));

create policy entries_select on public.entries
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy entries_insert on public.entries
for insert to authenticated
with check (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
);

create policy entries_update on public.entries
for update to authenticated
using (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
)
with check (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
);

create policy entries_delete on public.entries
for delete to authenticated
using (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
);
