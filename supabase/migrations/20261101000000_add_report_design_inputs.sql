alter table public.reports
  add column if not exists design_inputs jsonb,
  add column if not exists assumptions_version text;
