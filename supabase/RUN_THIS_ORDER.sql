begin;

-- 1. Add report design metadata so reports can retain their calculator inputs.
alter table public.reports
  add column if not exists design_inputs jsonb,
  add column if not exists assumptions_version text;

-- 2.1 Fix profile-role escalation by restricting client updates and requiring an admin RPC.
revoke update on table public.profiles
  from public, anon, authenticated;
grant update (full_name, avatar_url, country)
  on table public.profiles to authenticated;

create or replace function public.admin_update_profile_role(
  p_user_id uuid,
  p_role text
) returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator privileges required'
      using errcode = '42501';
  end if;

  if p_role is null or p_role not in ('user', 'engineer', 'admin') then
    raise exception 'Invalid profile role'
      using errcode = '22023';
  end if;

  update public.profiles
     set role = p_role
   where id = p_user_id;

  if not found then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_update_profile_role(uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_update_profile_role(uuid, text)
  to authenticated;

-- 2.2 Fix cross-user booking reads by making engineer-profile assignment server-managed.
revoke update on table public.engineer_profiles
  from public, anon, authenticated;
grant update (specializations, languages, regions, bio, calendly_url)
  on table public.engineer_profiles to authenticated;

-- 2.3 Fix unauthenticated and unmatched slot reservations through book_slot.
create or replace function public.book_slot(
  p_engineer_id text,
  p_date date,
  p_time text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  affected integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
      from public.bookings b
     where b.user_id = auth.uid()
       and b.engineer_id::text = p_engineer_id
       and b.date = p_date
       and b.time::text = p_time
       and b.status = 'confirmed'
  ) then
    raise exception 'A matching booking is required'
      using errcode = '42501';
  end if;

  update public.engineer_slots
     set booked = true
   where engineer_id::text = p_engineer_id
     and date = p_date
     and time::text = p_time
     and booked = false;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke all on function public.book_slot(text, date, text)
  from public, anon, authenticated;
grant execute on function public.book_slot(text, date, text)
  to authenticated;

-- 2.4 Fix forged/cross-user error-log inserts while preserving self-attributed client logs.
drop policy if exists "Anyone can insert error logs"
  on public.error_logs;
drop policy if exists "Authenticated users can insert own error logs"
  on public.error_logs;
create policy "Authenticated users can insert own error logs"
  on public.error_logs
  for insert to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

revoke insert on table public.error_logs
  from public, anon, authenticated;
grant insert (error_type, message, user_id)
  on table public.error_logs to authenticated;

-- 3. Fix missing persistent rate limiting for the AI and email Edge Functions.
create table if not exists public.rate_limits (
  scope text not null,
  subject_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count > 0),
  primary key (scope, subject_hash, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from public, anon, authenticated;
grant all on table public.rate_limits to service_role;

create or replace function public.consume_rate_limit(
  p_scope text,
  p_subject_hash text,
  p_window_start timestamptz,
  p_window_seconds integer,
  p_limit integer
) returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if p_scope not in (
    'ai-proxy:minute', 'ai-proxy:day',
    'send-email:ip-minute', 'send-email:ip-day',
    'send-email:recipient-minute', 'send-email:recipient-day'
  ) or p_window_seconds not in (60, 86400) or p_limit < 1 then
    raise exception 'invalid rate-limit request';
  end if;

  insert into public.rate_limits (scope, subject_hash, window_start, request_count)
  values (p_scope, p_subject_hash, p_window_start, 1)
  on conflict (scope, subject_hash, window_start)
  do update set request_count = public.rate_limits.request_count + 1
  returning request_count into current_count;

  return query select
    current_count <= p_limit,
    greatest(
      1,
      ceil(extract(epoch from (
        p_window_start + make_interval(secs => p_window_seconds) - clock_timestamp()
      )))::integer
    );
end;
$$;

revoke all on function public.consume_rate_limit(text, text, timestamptz, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, timestamptz, integer, integer)
  to service_role;

commit;

-- Verification (read-only SELECT statements; no database execution is performed here).
-- Profile UPDATE policies.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
  and cmd = 'UPDATE'
order by policyname;

-- book_slot existence and signature.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as result
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'book_slot';

-- rate_limits existence.
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'rate_limits';

-- error_logs policies.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'error_logs'
order by policyname;
