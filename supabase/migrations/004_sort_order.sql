-- ============================================================
-- Migration 004 — manual drag-to-reorder support
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

alter table public.items add column if not exists sort_order double precision;

-- backfill existing rows so newest-added still shows first by default
update public.items
set sort_order = extract(epoch from created_at)
where sort_order is null;

alter table public.items alter column sort_order set default extract(epoch from now());
