alter table public.categories
add column monthly_limit_yen integer
check (monthly_limit_yen is null or monthly_limit_yen > 0);
