alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.place_messages enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "authenticated users can read public places" on public.places;
create policy "authenticated users can read public places"
on public.places
for select
to authenticated
using (visibility = 'public');

drop policy if exists "authenticated users can create places" on public.places;
create policy "authenticated users can create places"
on public.places
for insert
to authenticated
with check (true);

drop policy if exists "authenticated users can read place messages" on public.place_messages;
create policy "authenticated users can read place messages"
on public.place_messages
for select
to authenticated
using (
  not exists (
    select 1
    from public.blocks b
    where b.blocker_id = auth.uid()
      and b.blocked_id = place_messages.user_id
  )
);

drop policy if exists "authenticated users can create place messages" on public.place_messages;
create policy "authenticated users can create place messages"
on public.place_messages
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can delete own place messages" on public.place_messages;
create policy "users can delete own place messages"
on public.place_messages
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "authenticated users can read groups" on public.groups;
create policy "authenticated users can read groups"
on public.groups
for select
to authenticated
using (visibility = 'public');

drop policy if exists "authenticated users can create groups" on public.groups;
create policy "authenticated users can create groups"
on public.groups
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "group creators can update groups" on public.groups;
create policy "group creators can update groups"
on public.groups
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "group creators can delete groups" on public.groups;
create policy "group creators can delete groups"
on public.groups
for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "authenticated users can read group members" on public.group_members;
create policy "authenticated users can read group members"
on public.group_members
for select
to authenticated
using (true);

drop policy if exists "users can join groups as self" on public.group_members;
create policy "users can join groups as self"
on public.group_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'member'
  and status = (
    case
      when exists (
        select 1 from public.groups g
        where g.id = group_members.group_id
          and g.visibility in ('approval_required', 'invite_only')
      ) then 'pending'
      else 'active'
    end
  )
);

drop policy if exists "group owners can seed memberships" on public.group_members;
create policy "group owners can seed memberships"
on public.group_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
);

-- Self-update on group_members is intentionally disallowed: a pending member
-- must not be able to flip their own status to 'active' or escalate their role.
-- Members can still join (insert) and leave (delete) themselves; status/role
-- changes are reserved for the group owner via the policy below.
drop policy if exists "users can update own group memberships" on public.group_members;

drop policy if exists "group owners can update memberships" on public.group_members;
create policy "group owners can update memberships"
on public.group_members
for update
to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
);

drop policy if exists "users can leave own group memberships" on public.group_members;
create policy "users can leave own group memberships"
on public.group_members
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "group owners can remove memberships" on public.group_members;
create policy "group owners can remove memberships"
on public.group_members
for delete
to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
);

drop policy if exists "authenticated users can read events" on public.events;
create policy "authenticated users can read events"
on public.events
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create events" on public.events;
create policy "authenticated users can create events"
on public.events
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "event creators can update events" on public.events;
create policy "event creators can update events"
on public.events
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "event creators can delete events" on public.events;
create policy "event creators can delete events"
on public.events
for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "authenticated users can read event rsvps" on public.event_rsvps;
create policy "authenticated users can read event rsvps"
on public.event_rsvps
for select
to authenticated
using (true);

drop policy if exists "users can rsvp as self" on public.event_rsvps;
create policy "users can rsvp as self"
on public.event_rsvps
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update own rsvp" on public.event_rsvps;
create policy "users can update own rsvp"
on public.event_rsvps
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can delete own rsvp" on public.event_rsvps;
create policy "users can delete own rsvp"
on public.event_rsvps
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can create reports" on public.reports;
create policy "users can create reports"
on public.reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "users can read own reports" on public.reports;
create policy "users can read own reports"
on public.reports
for select
to authenticated
using (reporter_id = auth.uid());

drop policy if exists "users can read own blocks" on public.blocks;
create policy "users can read own blocks"
on public.blocks
for select
to authenticated
using (blocker_id = auth.uid());

drop policy if exists "users can create own blocks" on public.blocks;
create policy "users can create own blocks"
on public.blocks
for insert
to authenticated
with check (blocker_id = auth.uid());

drop policy if exists "users can delete own blocks" on public.blocks;
create policy "users can delete own blocks"
on public.blocks
for delete
to authenticated
using (blocker_id = auth.uid());
