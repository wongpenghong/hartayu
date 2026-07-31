alter table public.entries
  add column attributed_member_id uuid references auth.users (id);

update public.entries
set attributed_member_id = member_id
where attributed_member_id is null;
