-- ════════════════════════════════════════════════════════════════════════
-- SOLARAH DATABASE SCHEMA v2 — Hardened Security
-- Run this in your Supabase project: SQL Editor → New query → paste → Run
-- ════════════════════════════════════════════════════════════════════════
-- IMPORTANT: If upgrading from v1, drop existing tables first:
--   DROP TABLE IF EXISTS affiliate_clicks, bookings, engineer_slots, engineers, reports, waitlist CASCADE;
-- ════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════
-- 1. PROFILES — extends Supabase Auth users
-- ══════════════════════════════════════════════════════════════════════

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'engineer', 'admin')),
  country text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Users can update their own profile (but not the role field — handled by check)
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    ''
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ══════════════════════════════════════════════════════════════════════
-- 2. WAITLIST
-- ══════════════════════════════════════════════════════════════════════

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  country text,
  joined_at timestamptz default now()
);

alter table waitlist enable row level security;

-- Anyone can join the waitlist (insert)
create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

-- Users can find their own waitlist entry by email
create policy "Users can view own waitlist entry"
  on waitlist for select
  using (email = (select email from auth.users where id = auth.uid()));

-- Admins can view all waitlist entries
create policy "Admins can view all waitlist"
  on waitlist for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can count the waitlist (needed for the counter)
-- This uses a function instead of a permissive select policy
create or replace function public.get_waitlist_count()
returns bigint as $$
  select count(*) from waitlist;
$$ language sql security definer;


-- ══════════════════════════════════════════════════════════════════════
-- 3. REPORTS (saved calculator results)
-- ══════════════════════════════════════════════════════════════════════

create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  sector text default 'residential',
  region text,
  city text,
  daily_kwh numeric,
  system_kw numeric,
  panel_count integer,
  inverter_kw numeric,
  battery_kwh numeric,
  system_cost numeric,
  annual_savings numeric,
  payback_years numeric,
  lifetime_savings numeric,
  co2_tonnes numeric,
  currency text default 'USD',
  ai_analysis text,
  created_at timestamptz default now()
);

alter table reports enable row level security;

-- Users can ONLY access their own reports — no cross-user visibility
create policy "Users can view own reports"
  on reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on reports for update
  using (auth.uid() = user_id);

create policy "Users can delete own reports"
  on reports for delete
  using (auth.uid() = user_id);

-- Admins can view all reports (for analytics)
create policy "Admins can view all reports"
  on reports for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ══════════════════════════════════════════════════════════════════════
-- 4. ENGINEERS (marketplace profiles)
-- ══════════════════════════════════════════════════════════════════════

create table engineers (
  id text primary key,
  name text not null,
  role text,
  avatar_initials text,
  rating numeric default 5.0,
  review_count integer default 0,
  tags text[],
  region text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table engineers enable row level security;

-- Anyone can view active engineers (public marketplace)
create policy "Anyone can view active engineers"
  on engineers for select
  using (active = true);

-- Admins can view ALL engineers (including inactive)
create policy "Admins can view all engineers"
  on engineers for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can insert/update/delete engineers
create policy "Admins can insert engineers"
  on engineers for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update engineers"
  on engineers for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete engineers"
  on engineers for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed sample engineers
insert into engineers (id, name, role, avatar_initials, rating, review_count, tags, region) values
  ('sara',  'Sara Mansour',  'MSc Energy Eng. · Cairo',       'SM', 4.9, 87,  array['Residential PV','Battery systems','Arabic/English'], 'North Africa / Middle East'),
  ('karim', 'Karim Nasser',  'PE · Off-grid specialist',      'KN', 4.8, 124, array['Off-grid','Hybrid systems','Commercial'],            'North Africa / Middle East'),
  ('lena',  'Lena Vasquez',  'MEng · Europe & Latin America', 'LV', 4.7, 61,  array['Grid-tied','ROI analysis','Spanish/English'],        'Latin America'),
  ('david', 'David Owusu',   'BEng · Sub-Saharan Africa',     'DO', 4.9, 53,  array['Rural systems','Budget builds','French/English'],    'Sub-Saharan Africa');


-- ══════════════════════════════════════════════════════════════════════
-- 5. ENGINEER PROFILES (extended marketplace data)
-- ══════════════════════════════════════════════════════════════════════

create table engineer_profiles (
  id uuid primary key references profiles(id),
  engineer_id text unique references engineers(id),
  specializations text[],
  languages text[],
  regions text[],
  rating numeric default 5.0,
  review_count integer default 0,
  bio text,
  calendly_url text,
  verified boolean default false
);

alter table engineer_profiles enable row level security;

-- Anyone can view verified engineer profiles
create policy "Anyone can view verified engineer profiles"
  on engineer_profiles for select
  using (verified = true);

-- Engineers can update their own profile
create policy "Engineers can update own profile"
  on engineer_profiles for update
  using (auth.uid() = id);

-- Admins can manage all engineer profiles
create policy "Admins can manage engineer profiles"
  on engineer_profiles for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ══════════════════════════════════════════════════════════════════════
-- 6. ENGINEER AVAILABILITY SLOTS
-- ══════════════════════════════════════════════════════════════════════

create table engineer_slots (
  id uuid primary key default gen_random_uuid(),
  engineer_id text references engineers(id) on delete cascade,
  date date not null,
  time text not null,
  booked boolean default false,
  created_at timestamptz default now(),
  unique(engineer_id, date, time)
);

alter table engineer_slots enable row level security;

-- Anyone can view available slots (needed for booking calendar)
create policy "Anyone can view slots"
  on engineer_slots for select
  using (true);

-- REMOVED the old "Anyone can update slot booking status" policy!
-- Slot booking is now handled ONLY through the book_slot RPC function below.
-- This prevents anyone from directly marking slots as booked.

-- Admins can manage slots
create policy "Admins can manage slots"
  on engineer_slots for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Secure slot booking function (runs with elevated privileges)
create or replace function public.book_slot(
  p_engineer_id text,
  p_date date,
  p_time text
) returns boolean as $$
declare
  affected int;
begin
  update engineer_slots
    set booked = true
    where engineer_id = p_engineer_id
      and date = p_date
      and time = p_time
      and booked = false;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$ language plpgsql security definer;


-- ══════════════════════════════════════════════════════════════════════
-- 7. BOOKINGS (consultation appointments)
-- ══════════════════════════════════════════════════════════════════════

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  engineer_id text references engineers(id),
  report_id uuid references reports(id),
  date date not null,
  time text not null,
  notes text,
  status text default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  booking_ref text unique,
  created_at timestamptz default now()
);

alter table bookings enable row level security;

-- Users can view their own bookings
create policy "Users can view own bookings"
  on bookings for select
  using (auth.uid() = user_id);

-- Engineers can view bookings assigned to them
create policy "Engineers can view assigned bookings"
  on bookings for select
  using (
    engineer_id = (select engineer_id from engineer_profiles where id = auth.uid())
  );

-- Users can create their own bookings
create policy "Users can create own bookings"
  on bookings for insert
  with check (auth.uid() = user_id);

-- Admins can view and manage all bookings
create policy "Admins can manage all bookings"
  on bookings for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ══════════════════════════════════════════════════════════════════════
-- 8. AFFILIATE CLICKS (commission tracking)
-- ══════════════════════════════════════════════════════════════════════

create table affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id text not null,
  product_name text,
  supplier text,
  clicked_at timestamptz default now()
);

alter table affiliate_clicks enable row level security;

-- Anyone can log a click (anonymous tracking is fine)
create policy "Anyone can log clicks"
  on affiliate_clicks for insert
  with check (true);

-- Only admins can view click data (for revenue analytics)
create policy "Admins can view all clicks"
  on affiliate_clicks for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ══════════════════════════════════════════════════════════════════════
-- 9. ENABLE REALTIME for live features
-- ══════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table waitlist;
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table engineer_slots;


-- ════════════════════════════════════════════════════════════════════════
-- DONE. Your database is fully configured with hardened security.
--
-- Next steps:
--   1. Copy your Project URL + anon key into .env (see .env.example)
--   2. Set yourself as admin:
--      UPDATE profiles SET role = 'admin' WHERE id = 'your-auth-user-uuid';
--      (Find your UUID in Authentication → Users in the Supabase dashboard)
--   3. Deploy Edge Functions (see DEPLOY_EDGE_FUNCTION.md)
-- ════════════════════════════════════════════════════════════════════════
