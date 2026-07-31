alter table entries
  add column exchange_rate_idr_to_jpy numeric(16, 10)
  check (exchange_rate_idr_to_jpy is null or exchange_rate_idr_to_jpy > 0);

alter table categories
  add column budget_group text
  check (budget_group is null or budget_group in ('needs', 'wants', 'savings'));
