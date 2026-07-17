create or replace function public.list_household_members()
returns table (user_id uuid, username text)
language sql
stable
security definer
set search_path = public
as $$
  select
    hm.user_id,
    split_part(u.email, '@', 1) as username
  from public.household_members hm
  join auth.users u on u.id = hm.user_id
  where hm.household_id in (select public.user_household_ids())
  order by hm.joined_at
$$;

revoke all on function public.list_household_members() from public;
grant execute on function public.list_household_members() to authenticated;
