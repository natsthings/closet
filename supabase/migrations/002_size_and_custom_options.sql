-- ============================================================
-- Migration 002 — sizes + user-defined custom options (bags,
-- extra categories/locations/formalities you add yourself)
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- (safe to run even if some pieces already exist)
-- ============================================================

-- Size field on each item ("S", "8", "32x30", whatever you use)
alter table public.items add column if not exists size text;

-- Per-user custom dropdown options, stored as {value, label} pairs
alter table public.user_settings add column if not exists custom_categories jsonb not null default '[]';
alter table public.user_settings add column if not exists custom_locations  jsonb not null default '[]';
alter table public.user_settings add column if not exists custom_formality  jsonb not null default '[]';
