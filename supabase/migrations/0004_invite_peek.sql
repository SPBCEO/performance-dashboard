-- 0004_invite_peek.sql — lets the invite page show the team and role (and reject bad links)
-- before the person joins. Returns nothing for invalid, revoked, expired or used-up invites.
-- Run ONCE in Supabase → SQL Editor, after 0002 (and 0003).

create or replace function peek_invite(p_token text)
returns table (team_name text, role text)
language sql stable security definer set search_path = '' as $$
  select t.name, i.role
  from public.team_invites i
  join public.teams t on t.id = i.team_id
  where i.token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
    and i.revoked_at is null
    and i.expires_at > now()
    and i.used_count < i.max_uses
  limit 1;
$$;

revoke all on function peek_invite(text) from public, anon;
grant execute on function peek_invite(text) to authenticated;
