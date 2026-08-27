-- ════════════════════════════════════════════════════════════════════════
-- SOLARAH DATABASE SCHEMA
-- Run this in your Supabase project: SQL Editor → New query → paste → Run
-- ════════════════════════════════════════════════════════════════════════

-- ── WAITLIST ──────────────────────────────────────────────────────────────
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  country text,
  joined_at timestamptz default now()
);

alter table waitlist enable row level security;

create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

create policy "Anyone can count waitlist"
  on waitlist for select
  using (true);


-- ── REPORTS (saved calculator results) ───────────────────────────────────
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
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

create policy "Users can view own reports"
  on reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on reports for insert
  with check (auth.uid() = user_id);


-- ── ENGINEERS (marketplace profiles) ─────────────────────────────────────
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

create policy "Anyone can view active engineers"
  on engineers for select
  using (active = true);

-- Seed sample engineers
insert into engineers (id, name, role, avatar_initials, rating, review_count, tags, region) values
  ('sara',  'Sara Mansour',  'MSc Energy Eng. · Cairo',       'SM', 4.9, 87,  array['Residential PV','Battery systems','Arabic/English'], 'North Africa / Middle East'),
  ('karim', 'Karim Nasser',  'PE · Off-grid specialist',      'KN', 4.8, 124, array['Off-grid','Hybrid systems','Commercial'],            'North Africa / Middle East'),
  ('lena',  'Lena Vasquez',  'MEng · Europe & Latin America', 'LV', 4.7, 61,  array['Grid-tied','ROI analysis','Spanish/English'],        'Latin America'),
  ('david', 'David Owusu',   'BEng · Sub-Saharan Africa',     'DO', 4.9, 53,  array['Rural systems','Budget builds','French/English'],    'Sub-Saharan Africa');


-- ── ENGINEER AVAILABILITY SLOTS ──────────────────────────────────────────
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

create policy "Anyone can view slots"
  on engineer_slots for select
  using (true);

create policy "Anyone can update slot booking status"
  on engineer_slots for update
  using (true);


-- ── BOOKINGS (consultation appointments) ─────────────────────────────────
create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  engineer_id text references engineers(id),
  report_id uuid references reports(id),
  date date not null,
  time text not null,
  notes text,
  status text default 'confirmed',
  booking_ref text unique,
  created_at timestamptz default now()
);

alter table bookings enable row level security;

create policy "Users can view own bookings"
  on bookings for select
  using (auth.uid() = user_id);

create policy "Users can create own bookings"
  on bookings for insert
  with check (auth.uid() = user_id);


-- ── AFFILIATE CLICKS (commission tracking) ───────────────────────────────
create table affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id text not null,
  product_name text,
  supplier text,
  clicked_at timestamptz default now()
);

alter table affiliate_clicks enable row level security;

create policy "Users can log clicks"
  on affiliate_clicks for insert
  with check (true);

create policy "Users can view own click history"
  on affiliate_clicks for select
  using (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════════
-- DONE. Your database is ready.
-- Next: copy your Project URL + anon key into .env (see .env.example)
-- ════════════════════════════════════════════════════════════════════════
