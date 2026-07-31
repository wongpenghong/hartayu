alter table public.accounts add column if not exists emoji text;
alter table public.categories add column if not exists emoji text;

alter table public.entries
  add column if not exists to_account_id uuid references public.accounts (id);

alter table public.entries alter column category_id drop not null;

alter table public.entries drop constraint if exists entries_kind_check;

alter table public.entries add constraint entries_kind_check
  check (kind in ('expense', 'income', 'transfer'));

alter table public.entries add constraint entries_transfer_fields_check
  check (
    (
      kind = 'transfer'
      and category_id is null
      and to_account_id is not null
      and to_account_id <> account_id
    )
    or (
      kind in ('expense', 'income')
      and category_id is not null
      and to_account_id is null
    )
  );

create index if not exists entries_to_account_id_idx on public.entries (to_account_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  target_amount_yen integer not null check (target_amount_yen > 0),
  target_date date,
  linked_account_id uuid references public.accounts (id),
  emoji text,
  created_at timestamptz not null default now()
);

create index goals_household_id_idx on public.goals (household_id);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  member_id uuid not null references auth.users (id),
  amount_yen integer not null check (amount_yen > 0),
  contribution_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index goal_contributions_goal_id_idx on public.goal_contributions (goal_id);
create index goal_contributions_household_id_idx on public.goal_contributions (household_id);

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

create policy goals_select on public.goals
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy goals_insert on public.goals
for insert to authenticated
with check (household_id in (select public.user_household_ids()));

create policy goals_update on public.goals
for update to authenticated
using (household_id in (select public.user_household_ids()))
with check (household_id in (select public.user_household_ids()));

create policy goals_delete on public.goals
for delete to authenticated
using (household_id in (select public.user_household_ids()));

create policy goal_contributions_select on public.goal_contributions
for select to authenticated
using (household_id in (select public.user_household_ids()));

create policy goal_contributions_insert on public.goal_contributions
for insert to authenticated
with check (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
);

create policy goal_contributions_update on public.goal_contributions
for update to authenticated
using (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
)
with check (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
);

create policy goal_contributions_delete on public.goal_contributions
for delete to authenticated
using (
  household_id in (select public.user_household_ids())
  and member_id = auth.uid()
);
