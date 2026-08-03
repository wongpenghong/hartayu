alter table public.households
add column if not exists budget_cycle_end_day integer not null default 31
  check (budget_cycle_end_day between 1 and 31);

alter table public.households
alter column budget_cycle_start_day set default 1;

update public.households
set budget_cycle_end_day = case
  when budget_cycle_start_day = 1 then 31
  else budget_cycle_start_day - 1
end
where budget_cycle_start_day <> 1
  and budget_cycle_end_day = 31;
