alter table public.households
add column if not exists budget_cycle_start_day integer not null default 25
  check (budget_cycle_start_day between 1 and 28);

drop policy if exists households_update on public.households;

create policy households_update on public.households
for update to authenticated
using (id in (select public.user_household_ids()))
with check (id in (select public.user_household_ids()));
