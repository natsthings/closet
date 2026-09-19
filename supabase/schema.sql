-- ============================================================
-- Virtual Closet — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- items table ----------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'other',      -- shirt, skirt, shorts, pants, shoes, outerwear, jewelry, accessory, other
  status text not null default 'own',          -- own, want, seen
  location text not null default 'home',       -- home, dorm, hamper, laundry, storage
  color text,
  formality text,                               -- casual, business_casual, formal
  tags text[] not null default '{}',
  style text[] not null default '{}',           -- streetwear, casual, etc
  image_url text,
  source_url text,                              -- link back to where it was found (Google image search etc)
  price numeric,
  times_worn integer not null default 0,
  last_worn_date date,
  is_favorite boolean not null default false,
  is_borrowed boolean not null default false,
  borrowed_by text,
  seasonal_storage boolean not null default false, -- true = "put away" for the season
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- wear log (calendar / fit journal) ----------
create table if not exists public.wear_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  worn_date date not null default current_date,
  selfie_url text,       -- optional mirror selfie for the fit check journal
  note text,
  created_at timestamptz not null default now()
);

-- ---------- user settings (custom theme colors) ----------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chrome_color text default '#cdbdf0',
  accent_color text default '#ff6fa5',
  accent2_color text default '#c8f169',
  updated_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists items_user_id_idx on public.items(user_id);
create index if not exists items_category_idx on public.items(category);
create index if not exists items_status_idx on public.items(status);
create index if not exists wear_log_item_id_idx on public.wear_log(item_id);
create index if not exists wear_log_user_id_idx on public.wear_log(user_id);

-- ---------- row level security ----------
alter table public.items enable row level security;
alter table public.wear_log enable row level security;
alter table public.user_settings enable row level security;

create policy "items: select own" on public.items for select using (auth.uid() = user_id);
create policy "items: insert own" on public.items for insert with check (auth.uid() = user_id);
create policy "items: update own" on public.items for update using (auth.uid() = user_id);
create policy "items: delete own" on public.items for delete using (auth.uid() = user_id);

create policy "wear_log: select own" on public.wear_log for select using (auth.uid() = user_id);
create policy "wear_log: insert own" on public.wear_log for insert with check (auth.uid() = user_id);
create policy "wear_log: update own" on public.wear_log for update using (auth.uid() = user_id);
create policy "wear_log: delete own" on public.wear_log for delete using (auth.uid() = user_id);

create policy "settings: select own" on public.user_settings for select using (auth.uid() = user_id);
create policy "settings: insert own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings: update own" on public.user_settings for update using (auth.uid() = user_id);

-- ---------- storage bucket for closet photos ----------
insert into storage.buckets (id, name, public)
values ('closet-images', 'closet-images', true)
on conflict (id) do nothing;

create policy "closet-images: public read"
on storage.objects for select
using ( bucket_id = 'closet-images' );

create policy "closet-images: owner insert"
on storage.objects for insert
with check ( bucket_id = 'closet-images' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "closet-images: owner delete"
on storage.objects for delete
using ( bucket_id = 'closet-images' and auth.uid()::text = (storage.foldername(name))[1] );

-- ---------- helper function: mark item worn today ----------
create or replace function public.mark_worn(p_item_id uuid, p_date date default current_date, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wear_log (user_id, item_id, worn_date, note)
  values (auth.uid(), p_item_id, p_date, p_note);

  update public.items
  set times_worn = times_worn + 1,
      last_worn_date = greatest(coalesce(last_worn_date, p_date), p_date),
      location = 'hamper'
  where id = p_item_id and user_id = auth.uid();
end;
$$;
