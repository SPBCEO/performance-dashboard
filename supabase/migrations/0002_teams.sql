-- 0002_teams.sql — team multi-tenancy.
-- Run ONCE in Supabase → SQL Editor. Do not re-run 0001 afterwards.
-- After this runs, logged-out visitors can no longer read or write any data.

begin;

-- ───────────────────────── teams ─────────────────────────
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','viewer')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index if not exists team_members_user_idx on team_members(user_id);

-- Invite links: only a SHA-256 hash of the token is stored; owners can never be invited.
create table if not exists team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  role text not null check (role in ('admin','viewer')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_uses int not null default 1 check (max_uses between 1 and 100),
  used_count int not null default 0,
  created_by uuid default auth.uid(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists team_invites_team_idx on team_invites(team_id);

-- ───────────────────────── team_id on data tables ─────────────────────────
-- Fixed id so the existing seed data lands in one "Demo" team.
insert into teams (id, name, created_by)
values ('c0000000-0000-0000-0000-000000000001', 'Demo', null)
on conflict (id) do nothing;

alter table properties       add column if not exists team_id uuid references teams(id) on delete cascade;
alter table tenants          add column if not exists team_id uuid references teams(id) on delete cascade;
alter table turnover_entries add column if not exists team_id uuid references teams(id) on delete cascade;

update properties set team_id = 'c0000000-0000-0000-0000-000000000001' where team_id is null;
update tenants t set team_id = p.team_id from properties p where t.property_id = p.id and t.team_id is null;
update tenants set team_id = 'c0000000-0000-0000-0000-000000000001' where team_id is null;
update turnover_entries e set team_id = t.team_id from tenants t where e.tenant_id = t.id and e.team_id is null;

alter table properties       alter column team_id set not null;
alter table tenants          alter column team_id set not null;
alter table turnover_entries alter column team_id set not null;

create index if not exists properties_team_idx on properties(team_id);
create index if not exists tenants_team_idx on tenants(team_id);
create index if not exists tenants_property_idx on tenants(property_id);
create index if not exists turnover_team_idx on turnover_entries(team_id);
create index if not exists turnover_tenant_date_idx on turnover_entries(tenant_id, entry_date);

-- ───────────────────────── helpers ─────────────────────────
create or replace function is_team_member(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.team_members where team_id = t and user_id = auth.uid());
$$;

create or replace function has_team_role(t uuid, roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.team_members where team_id = t and user_id = auth.uid() and role = any(roles));
$$;

-- team_id on tenants/entries is derived from the parent row, so a client can never spoof or cross teams.
create or replace function set_tenant_team() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select team_id into new.team_id from public.properties where id = new.property_id;
  if new.team_id is null then raise exception 'unknown property'; end if;
  return new;
end $$;

create or replace function set_entry_team() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select team_id into new.team_id from public.tenants where id = new.tenant_id;
  if new.team_id is null then raise exception 'unknown tenant'; end if;
  return new;
end $$;

drop trigger if exists tenants_set_team on tenants;
create trigger tenants_set_team before insert or update of property_id on tenants
  for each row execute function set_tenant_team();
drop trigger if exists entries_set_team on turnover_entries;
create trigger entries_set_team before insert or update of tenant_id on turnover_entries
  for each row execute function set_entry_team();

-- A team can never be left without an owner.
create or replace function keep_one_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if exists (select 1 from public.teams where id = old.team_id)
       and not exists (select 1 from public.team_members
                       where team_id = old.team_id and role = 'owner' and user_id <> old.user_id) then
      raise exception 'a team must keep at least one owner';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists team_members_keep_owner on team_members;
create trigger team_members_keep_owner before update or delete on team_members
  for each row execute function keep_one_owner();

-- ───────────────────────── RPCs (the only way to create teams / join) ─────────────────────────
create or replace function create_team(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare tid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.teams (name, created_by) values (trim(p_name), auth.uid()) returning id into tid;
  insert into public.team_members (team_id, user_id, role) values (tid, auth.uid(), 'owner');
  return tid;
end $$;

create or replace function accept_invite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.team_invites%rowtype; added int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into inv from public.team_invites
   where token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
     and revoked_at is null and expires_at > now() and used_count < max_uses
   for update;
  if not found then raise exception 'invalid or expired invite'; end if;
  insert into public.team_members (team_id, user_id, role) values (inv.team_id, auth.uid(), inv.role)
    on conflict (team_id, user_id) do nothing;
  get diagnostics added = row_count;
  if added > 0 then update public.team_invites set used_count = used_count + 1 where id = inv.id; end if;
  return inv.team_id;
end $$;

-- The first signed-in user to call this becomes owner of the Demo team (only while it has no members).
create or replace function claim_demo_team() returns uuid
language plpgsql security definer set search_path = '' as $$
declare demo constant uuid := 'c0000000-0000-0000-0000-000000000001';
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.team_members where team_id = demo) then
    insert into public.team_members (team_id, user_id, role) values (demo, auth.uid(), 'owner');
  end if;
  return demo;
end $$;

revoke all on function create_team(text), accept_invite(text), claim_demo_team(),
  is_team_member(uuid), has_team_role(uuid, text[]) from public, anon;
grant execute on function create_team(text), accept_invite(text), claim_demo_team(),
  is_team_member(uuid), has_team_role(uuid, text[]) to authenticated;

-- ───────────────────────── RLS ─────────────────────────
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invites enable row level security;

-- drop the open v1 policies
drop policy if exists "properties_v1_read" on properties;
drop policy if exists "properties_v1_write" on properties;
drop policy if exists "tenants_v1_read" on tenants;
drop policy if exists "tenants_v1_write" on tenants;
drop policy if exists "turnover_entries_v1_read" on turnover_entries;
drop policy if exists "turnover_entries_v1_write" on turnover_entries;

-- teams
drop policy if exists teams_select on teams;
create policy teams_select on teams for select to authenticated using (is_team_member(id));
drop policy if exists teams_update on teams;
create policy teams_update on teams for update to authenticated
  using (has_team_role(id, array['owner'])) with check (has_team_role(id, array['owner']));
drop policy if exists teams_delete on teams;
create policy teams_delete on teams for delete to authenticated using (has_team_role(id, array['owner']));

-- team_members (joining happens only through accept_invite / create_team)
drop policy if exists members_select on team_members;
create policy members_select on team_members for select to authenticated using (is_team_member(team_id));
drop policy if exists members_update on team_members;
create policy members_update on team_members for update to authenticated
  using (has_team_role(team_id, array['owner'])) with check (has_team_role(team_id, array['owner']));
drop policy if exists members_delete on team_members;
create policy members_delete on team_members for delete to authenticated using (
  user_id = auth.uid()
  or has_team_role(team_id, array['owner'])
  or (has_team_role(team_id, array['admin']) and role <> 'owner')
);

-- invites: owners/admins only
drop policy if exists invites_all on team_invites;
create policy invites_all on team_invites for all to authenticated
  using (has_team_role(team_id, array['owner','admin']))
  with check (has_team_role(team_id, array['owner','admin']));

-- data: members read, owners/admins write, viewers are read-only
drop policy if exists properties_read on properties;
create policy properties_read on properties for select to authenticated using (is_team_member(team_id));
drop policy if exists properties_write on properties;
create policy properties_write on properties for all to authenticated
  using (has_team_role(team_id, array['owner','admin'])) with check (has_team_role(team_id, array['owner','admin']));

drop policy if exists tenants_read on tenants;
create policy tenants_read on tenants for select to authenticated using (is_team_member(team_id));
drop policy if exists tenants_write on tenants;
create policy tenants_write on tenants for all to authenticated
  using (has_team_role(team_id, array['owner','admin'])) with check (has_team_role(team_id, array['owner','admin']));

drop policy if exists entries_read on turnover_entries;
create policy entries_read on turnover_entries for select to authenticated using (is_team_member(team_id));
drop policy if exists entries_write on turnover_entries;
create policy entries_write on turnover_entries for all to authenticated
  using (has_team_role(team_id, array['owner','admin'])) with check (has_team_role(team_id, array['owner','admin']));

commit;
