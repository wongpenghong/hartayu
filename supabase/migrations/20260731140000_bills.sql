create table public.bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  amount_yen integer check (amount_yen is null or amount_yen > 0),
  due_day integer not null check (due_day between 1 and 31),
  category_id uuid not null references public.categories (id),
  default_pocket_id uuid references public.accounts (id),
  default_attributed_member_id uuid references auth.users (id),
  last_paid_period text check (last_paid_period ~ '^\d{4}-\d{2}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index bills_household_id_idx on public.bills (household_id);
create index bills_category_id_idx on public.bills (category_id);

alter table public.entries
  add column bill_id uuid references public.bills (id);

create index entries_bill_id_idx on public.entries (bill_id);

alter table public.bills enable row level security;

create policy bills_select on public.bills
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy bills_insert on public.bills
for insert to authenticated
with check (household_id in (select public.user_household_ids()));

create policy bills_update on public.bills
for update to authenticated
using (household_id in (select public.user_household_ids()))
with check (household_id in (select public.user_household_ids()));

create policy bills_delete on public.bills
for delete to authenticated
using (household_id in (select public.user_household_ids()));
