# Pre-merge Supabase migration plan

These are preparation notes only. No SQL in this document has been run. Apply
the steps to the intended Supabase project in order after reviewing them. Do
not deploy the updated frontend or Edge Functions until the required database
objects and access-control fixes are in place.

## 1. Add report design metadata

```sql
begin;

alter table public.reports
  add column if not exists design_inputs jsonb,
  add column if not exists assumptions_version text;

commit;
```

Verify the columns and types:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reports'
  and column_name in ('design_inputs', 'assumptions_version')
order by column_name;
```

The result should contain `design_inputs | jsonb` and
`assumptions_version | text`. This is also the change in
`supabase/migrations/20261101000000_add_report_design_inputs.sql`. No existing
report rows are modified.

## 2. Close client-side role and RLS escalation paths

Apply this before relying on profile roles for admin checks or deploying the
email function. The app now uses the admin-only RPC below for role changes.

### 2.1 Limit profile updates and add a trusted admin role RPC

```sql
begin;

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

commit;
```

Only the listed non-role columns remain client-updatable under the existing
own-profile policy. Admin role changes go through the security-definer RPC,
which checks the caller with `public.is_admin()` and validates the role.

### 2.2 Prevent engineer-profile reassignment

The assigned-bookings policy relies on the engineer linkage. Keep that linkage
server-managed while preserving the existing self-profile policy:

```sql
begin;

revoke update on table public.engineer_profiles
  from public, anon, authenticated;
grant update (specializations, languages, regions, bio, calendly_url)
  on table public.engineer_profiles to authenticated;

commit;
```

### 2.3 Require a matching authenticated booking before reserving a slot

The app first inserts the caller's own booking row, then invokes `book_slot`.
The function below rejects anonymous callers and requires a matching,
confirmed booking belonging to `auth.uid()` before changing an available
slot. It retains the current client booking flow without exposing direct
updates to `engineer_slots`.

```sql
begin;

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

commit;
```

### 2.4 Restrict error-log insertion to the caller

`public.error_logs` already exists in `supabase/schema.sql`. Retain admin-only
reads and allow the authenticated error boundary to submit only rows attributed
to its own user ID:

```sql
begin;

drop policy if exists "Anyone can insert error logs"
  on public.error_logs;
create policy "Authenticated users can insert own error logs"
  on public.error_logs
  for insert to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

revoke insert on table public.error_logs
  from public, anon, authenticated;
grant insert (error_type, message, user_id)
  on table public.error_logs to authenticated;

commit;
```

This prevents anonymous inserts and cross-user attribution, but an
authenticated user can still submit a fabricated log about themselves. If
error-log integrity must be stronger, remove client inserts and route logs
through a trusted server-side logger. The `email_logs` table keeps its existing
admin-only select policy; no user-facing insert policy is added.

## 3. Add persistent Edge Function rate limits

The hardened AI/email functions need this table and RPC before they can be
deployed. They access it with the Edge Function's built-in
`SUPABASE_SERVICE_ROLE_KEY`; neither the table nor function is available to
anon or authenticated clients.

```sql
begin;

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
```

Rows are bucketed by UTC minute/day and hashed subject. A scheduled cleanup for
expired rows can be added after validating the retention period and scheduler
availability; it is not required for enforcement.

## 4. Verify access controls without production data

See [`supabase/tests/rls_normal_user.sql`](./supabase/tests/rls_normal_user.sql)
for a `psql` script that runs as the `authenticated` role and rolls back its
transaction. It requires dedicated local/throwaway test users and fixtures.
Use a non-admin test account with an `engineer_profiles` row, a second test
user, and fixtures belonging to that second user in `reports`, `bookings`,
`email_logs`, and `error_logs`. Also provide an available engineer slot with
no matching booking for the normal user. Run only after applying the SQL
above, and only with a local/throwaway database URL:

```sh
psql "$LOCAL_OR_THROWAWAY_DATABASE_URL" \
  -v normal_user_id="NORMAL_USER_UUID" \
  -v other_user_id="OTHER_USER_UUID" \
  -v other_engineer_id="OTHER_ENGINEER_ID" \
  -v engineer_id="AVAILABLE_SLOT_ENGINEER_ID" \
  -v slot_date="YYYY-MM-DD" \
  -v slot_time="HH:MM" \
  -f supabase/tests/rls_normal_user.sql
```

Never set `LOCAL_OR_THROWAWAY_DATABASE_URL` to a production project. The test
transaction rolls back; it was not run in this audit.

## Rollback

Only use rollback when reverting the application and accepting the security
regressions documented below. Apply these steps in reverse order.

### Rate-limit objects

```sql
begin;
drop function if exists public.consume_rate_limit(text, text, timestamptz, integer, integer);
drop table if exists public.rate_limits;
commit;
```

### Error-log policy

This restores anonymous, unauthenticated log forgery; do not use while the
application is deployed:

```sql
begin;
drop policy if exists "Authenticated users can insert own error logs" on public.error_logs;
create policy "Anyone can insert error logs"
  on public.error_logs for insert with check (true);
revoke insert (error_type, message, user_id) on public.error_logs from authenticated;
grant insert on table public.error_logs to public, anon, authenticated;
commit;
```

### Booking and role controls

Reverting these grants reopens the profile-role and slot-reservation paths. If
rolling back the app, this restores the previous behavior in which
`book_slot` marks an available slot from caller-supplied parameters without
requiring a matching booking.

```sql
begin;
drop function if exists public.admin_update_profile_role(uuid, text);
revoke update (full_name, avatar_url, country) on public.profiles from authenticated;
grant update on table public.profiles to public, anon, authenticated;
revoke update (specializations, languages, regions, bio, calendly_url)
  on public.engineer_profiles from authenticated;
grant update on table public.engineer_profiles to public, anon, authenticated;

create or replace function public.book_slot(
  p_engineer_id text,
  p_date date,
  p_time text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected integer;
begin
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

grant execute on function public.book_slot(text, date, text) to public;
commit;
```

### Report metadata

Dropping these columns permanently deletes their stored design inputs and
assumptions versions:

```sql
begin;
alter table public.reports
  drop column if exists design_inputs,
  drop column if exists assumptions_version;
commit;
```

The drops use PostgreSQL's default `RESTRICT` behavior. If dependent objects
prevent rollback, inspect and remove those dependencies deliberately rather
than adding `CASCADE`.
