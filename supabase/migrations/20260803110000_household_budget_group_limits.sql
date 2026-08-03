alter table public.households
add column needs_monthly_limit_yen integer
  check (needs_monthly_limit_yen is null or needs_monthly_limit_yen > 0),
add column wants_monthly_limit_yen integer
  check (wants_monthly_limit_yen is null or wants_monthly_limit_yen > 0),
add column savings_monthly_limit_yen integer
  check (savings_monthly_limit_yen is null or savings_monthly_limit_yen > 0);

create policy households_update on public.households
for update to authenticated
using (id in (select public.user_household_ids()))
with check (id in (select public.user_household_ids()));
