-- ============================================================
-- Migration 003 — stop auto-moving items to the hamper when worn
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

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
      last_worn_date = greatest(coalesce(last_worn_date, p_date), p_date)
  where id = p_item_id and user_id = auth.uid();
end;
$$;
