# Report design-input migration

The application can save reports without the two new design metadata columns, but those reports cannot be recomputed against the current calculator assumptions. Apply this migration to the Supabase project before merging the application change.

## Rate-limit storage for Edge Functions

The hardened AI/email functions require the following database objects. Run
this SQL after the report metadata migration and before deploying either
function. The functions call the RPC with the built-in
`SUPABASE_SERVICE_ROLE_KEY`; neither table nor RPC is available to anon or
authenticated clients.

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

Rate-limit rows are bucketed by UTC minute/day and hashed subject. Set up a
scheduled cleanup for expired rows after validating the retention period and
your Supabase scheduler availability; cleanup is not required for enforcement.

## Apply in the Supabase SQL Editor

1. Select the intended Supabase project and open **SQL Editor**.
2. Run the following idempotent SQL:

   ```sql
   begin;

   alter table public.reports
     add column if not exists design_inputs jsonb,
     add column if not exists assumptions_version text;

   commit;
   ```

3. Verify that both columns exist and have the expected types:

   ```sql
   select column_name, data_type
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'reports'
     and column_name in ('design_inputs', 'assumptions_version')
   order by column_name;
   ```

   The result should contain `design_inputs | jsonb` and `assumptions_version | text`.

The SQL is the same schema change as `supabase/migrations/20261101000000_add_report_design_inputs.sql`. No existing report rows are modified. Do not execute this document's SQL as part of application tests.

## Roll back

Only roll back if the application has been reverted or no longer requires design metadata. Dropping these columns permanently deletes their stored design inputs and assumptions versions. Run:

```sql
begin;

alter table public.reports
  drop column if exists design_inputs,
  drop column if exists assumptions_version;

commit;
```

The drops use PostgreSQL's default `RESTRICT` behavior; if dependent database objects prevent rollback, inspect and remove those dependencies deliberately rather than adding `CASCADE`.
