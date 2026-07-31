drop policy entries_update on public.entries;

create policy entries_update on public.entries
for update to authenticated
using (
  household_id in (select public.user_household_ids())
  and (
    member_id = auth.uid()
    or attributed_member_id is null
  )
)
with check (
  household_id in (select public.user_household_ids())
  and (
    member_id = auth.uid()
    or attributed_member_id is null
  )
);

drop policy entries_delete on public.entries;

create policy entries_delete on public.entries
for delete to authenticated
using (
  household_id in (select public.user_household_ids())
  and (
    member_id = auth.uid()
    or attributed_member_id is null
  )
);
