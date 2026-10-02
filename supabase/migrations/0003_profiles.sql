-- 0003_profiles.sql — lets the Team page show member emails.
-- Run ONCE in Supabase → SQL Editor, after 0002.

begin;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;

insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;
revoke all on function handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- You can read your own profile and the profiles of people on your teams.
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from team_members a join team_members b on a.team_id = b.team_id
    where a.user_id = auth.uid() and b.user_id = profiles.id
  )
);

commit;
