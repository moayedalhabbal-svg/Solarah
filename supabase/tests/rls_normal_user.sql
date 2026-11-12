\set ON_ERROR_STOP on

-- Run only against a local or throwaway project after creating the fixtures
-- described in MIGRATION_NOTES.md. This transaction always rolls back.
begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', :'normal_user_id', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('test.other_user_id', :'other_user_id', true);
select set_config('test.other_engineer_id', :'other_engineer_id', true);
select set_config('test.engineer_id', :'engineer_id', true);
select set_config('test.slot_date', :'slot_date', true);
select set_config('test.slot_time', :'slot_time', true);

do $$
declare
  normal_user uuid := auth.uid();
  other_user uuid := current_setting('test.other_user_id')::uuid;
  other_engineer text := current_setting('test.other_engineer_id');
  test_engineer_id text := current_setting('test.engineer_id');
  slot_date date := current_setting('test.slot_date')::date;
  slot_time text := current_setting('test.slot_time');
  affected integer := 0;
  slot_reserved boolean := false;
begin
  if normal_user is null or normal_user = other_user then
    raise exception 'Test requires distinct authenticated and other-user IDs';
  end if;

  if not exists (
    select 1 from public.profiles
     where id = normal_user and role in ('user', 'engineer')
  ) then
    raise exception 'Fixture required: the authenticated user must have a non-admin profile';
  end if;
  if exists (select 1 from public.profiles where id = other_user) then
    raise exception 'FAIL: normal user can read another profile';
  end if;
  if exists (select 1 from public.reports where user_id = other_user) then
    raise exception 'FAIL: normal user can read another user''s reports';
  end if;
  if exists (select 1 from public.bookings where user_id = other_user) then
    raise exception 'FAIL: normal user can read another user''s bookings';
  end if;
  if exists (select 1 from public.email_logs) then
    raise exception 'FAIL: normal user can read email logs';
  end if;
  if exists (select 1 from public.error_logs where user_id = other_user) then
    raise exception 'FAIL: normal user can read another user''s error logs';
  end if;

  begin
    update public.profiles set role = 'admin' where id = normal_user;
    get diagnostics affected = row_count;
  exception when insufficient_privilege then
    affected := 0;
  end;
  if affected > 0 then
    raise exception 'FAIL: normal user can change their own role';
  end if;

  if not exists (
    select 1 from public.engineer_profiles
     where id = normal_user and engineer_id::text <> other_engineer
  ) then
    raise exception 'Fixture required: use a non-admin engineer account with a different target engineer ID';
  end if;
  begin
    update public.engineer_profiles
       set engineer_id = other_engineer
     where id = normal_user;
    get diagnostics affected = row_count;
  exception when insufficient_privilege then
    affected := 0;
  end;
  if affected > 0 then
    raise exception 'FAIL: engineer can change their assigned engineer ID';
  end if;

  if not exists (
    select 1 from public.engineer_slots
     where engineer_id::text = test_engineer_id
       and date = slot_date
       and time::text = slot_time
       and booked = false
  ) then
    raise exception 'Fixture required: target slot must exist and be available';
  end if;
  if exists (
    select 1 from public.bookings
     where user_id = normal_user
       and engineer_id::text = test_engineer_id
       and date = slot_date
       and time::text = slot_time
  ) then
    raise exception 'Fixture required: user must have no booking for the target slot';
  end if;

  begin
    update public.engineer_slots
       set booked = true
     where engineer_id::text = test_engineer_id
       and date = slot_date
       and time::text = slot_time
       and booked = false;
    get diagnostics affected = row_count;
  exception when insufficient_privilege then
    affected := 0;
  end;
  if affected > 0 then
    raise exception 'FAIL: normal user can directly mark an engineer slot booked';
  end if;

  begin
    slot_reserved := public.book_slot(test_engineer_id, slot_date, slot_time);
  exception when insufficient_privilege then
    slot_reserved := false;
  end;
  if slot_reserved or exists (
    select 1 from public.engineer_slots
     where engineer_id::text = test_engineer_id
       and date = slot_date
       and time::text = slot_time
       and booked = true
  ) then
    raise exception 'FAIL: normal user reserved a slot without a matching booking';
  end if;

  begin
    insert into public.error_logs (user_id, error_type, message)
    values (other_user, 'RLS test', 'must not be attributable to another user');
    get diagnostics affected = row_count;
  exception when insufficient_privilege or check_violation then
    affected := 0;
  end;
  if affected > 0 then
    raise exception 'FAIL: normal user can attribute an error log to another user';
  end if;

  raise notice 'All normal-user RLS assertions passed';
end;
$$;

rollback;
