alter table public.entries
  add column foreign_amount_idr integer
  check (foreign_amount_idr is null or foreign_amount_idr > 0);
