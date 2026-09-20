# closet.exe — virtual closet & wishlist

A Y2K/web1.0-browser-styled virtual closet app. Track what you **own**, **want**,
and **just see**. Built with Next.js (App Router), Supabase (auth + database +
image storage), deployed on Vercel.

## ⚠️ Already deployed this before? Run these migrations first

If you set up Supabase before this update, run these files in order before
pulling the new code — Supabase → **SQL Editor** → **New query** → paste →
**Run**:
1. `supabase/migrations/002_size_and_custom_options.sql` — adds the `size`
   field and custom-options storage
2. `supabase/migrations/003_remove_auto_hamper.sql` — stops "mark worn"
   from auto-moving an item to the hamper

(Brand new setup? Skip both — `schema.sql` already includes everything.)

## What's in this MVP (Phase 1)

- Email/password auth (Supabase Auth)
- Add clothing items with a photo, category, color, formality, price, tags, and style
- Tabs for shirt / pants / shorts / skirt / outerwear / shoes / bag / jewelry / accessory / other
- Status: **own** / **want** (wishlist) / **seen**
- Location tags: home / dorm / hamper / laundry / seasonal storage
- Free-form custom tags + search across name/tags/notes/color/size (the "type a keyword
  and find that one shirt" search you described)
- Left sidebar filters: status, location, formality, tags, favorites, forgotten fits
- "Forgotten fit" badge — flags owned items worn before but not in 30+ days
- "Recently worn" badge — flags items worn in the last 14 days (the "don't repeat
  within 2 weeks" check)
- Price shown on every card
- Closet stats bar: items owned, wishlist count, total spent, forgotten count
- Fully custom theme colors (chrome/accent/secondary accent) with presets,
  saved per-user
- Vintage browser-window chrome UI throughout (traffic-light dots, address bars)
- Bags as their own category, plus a **size** field on every item
- **⚙ manage options** — add your own categories, locations, or formality
  levels beyond the defaults (e.g. "swimwear," "car," "cocktail"), saved per-user
- **👗 make an outfit** — pick one top, one bottom, one pair of shoes, an
  optional bag, and any number of jewelry pieces from what you actually own;
  they're laid out in a clean, non-overlapping grid (works best with
  transparent-background PNGs)

The `mark_worn` database function and `wear_log` table are still there,
unused by the UI for now — they're ready for whichever wear-tracking
mechanic (calendar, fit journal, etc.) you want to build in Phase 2. Until
then, the "forgotten fit" / "recently worn" badges only reflect whatever
`times_worn` / `last_worn_date` a wardrobe already has (nothing updates them
right now since the card's wear button was removed).

## Phase 2 roadmap (not built yet, by design)

These are genuinely separate features and each deserves its own real build
rather than a half-working stub crammed in on day one. Once you're using the
Phase 1 app for a week or two, come back and we can build any of these next,
in whatever order matters most to you:

- **Dressing room / mix-and-match mode** — a session-based board where you drag
  selected items together to preview an outfit
- **Weather API integration** — pull local forecast, auto-filter out shorts on
  cold days, suggest a jacket, and an "isRaining" flag that hides pants and
  surfaces raincoats
- **Calendar-aware formality** — sync your class/event calendar so the app can
  suggest formality + sleeve/pant length automatically
- **Packing list generator** — type a weather type/trip length, get a shortlist
  from your *clean* items only, and pick what to pack
- **Fit-check journal** — mirror selfie attached to each wear-log calendar entry
- **Tinder-style outfit swiper** for fast mix-and-match
- **Buy-next recommendations** — "you wear this color/style a lot but own
  nothing that's both," or "you're low on shirts relative to how often you
  wear them"
- **Jewelry logic** — auto gold/silver + gemstone suggestion based on outfit
  color and event formality
- **Borrow tracking + shareable "wrapped" outfit card** for friends
- **Google Image Search-based "add to wardrobe"** — paste a product/image link
  instead of hand-photographing everything (the schema already has a
  `source_url` column ready for this)
- **Layering pairs** (tee + tank as one logical layer)

The database schema already has extra columns (`is_borrowed`, `borrowed_by`,
`seasonal_storage`, `style[]`, `source_url`) reserved for these so Phase 2
won't require a schema rewrite.

---

## 1. Set up Supabase

1. Go to https://supabase.com → **New project**. Pick a name (e.g. `closet`),
   a strong database password (save it somewhere), and a region close to you.
2. Once the project finishes provisioning, open **SQL Editor** in the left
   sidebar → **New query**.
3. Open `supabase/schema.sql` from this project, copy the whole file, paste it
   into the SQL editor, and click **Run**. This creates:
   - `items`, `wear_log`, `user_settings` tables
   - Row Level Security policies so each user only ever sees their own data
   - A public `closet-images` storage bucket with upload/read policies
   - A `mark_worn()` database function used by the "mark worn today" button
4. Go to **Project Settings → API**. You'll need two values for the next step:
   - **Project URL**
   - **anon public** key (NOT the service_role key — never expose that one in
     the frontend)
5. (Optional but recommended) Go to **Authentication → Providers → Email** and
   turn **off** "Confirm email" while you're testing locally, so you can sign
   up and log in immediately without checking an inbox. Turn it back on before
   sharing the app with anyone else.

## 2. Run it locally

```bash
npm install
cp .env.local.example .env.local
```

Open `.env.local` and fill in the two values from Supabase step 4:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Then:

```bash
npm run dev
```

Visit http://localhost:3000, create an account, and start adding clothes.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "closet.exe MVP"
gh repo create your-username/closet-exe --private --source=. --push
```

(No `gh` CLI? Create an empty repo on github.com, then:
`git remote add origin https://github.com/your-username/closet-exe.git`
`git branch -M main`
`git push -u origin main`)

`.env.local` is already in `.gitignore`, so your Supabase keys won't be
committed — you'll re-enter them as environment variables in Vercel next.

## 4. Deploy on Vercel

1. Go to https://vercel.com → **Add New → Project** → import the GitHub repo
   you just pushed.
2. Framework preset should auto-detect as **Next.js** — leave build settings
   as default.
3. Before deploying, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → same value as your `.env.local`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → same value as your `.env.local`
4. Click **Deploy**. In about a minute you'll get a live URL like
   `closet-exe.vercel.app`.
5. Every time you `git push` to `main`, Vercel auto-redeploys.

## Notes on the design

- All theme colors are CSS variables (`--chrome`, `--accent`, `--accent-2`) —
  click **🎨 theme** in the top window to change them live; your choice is
  saved to `localStorage` and to your Supabase account so it follows you
  across devices.
- Card art style is intentionally hand-drawn-sticker (thick outline + offset
  shadow) rather than soft SaaS-card shadows, to match the sketch-style
  browser-chrome reference image.
- Images are stored in Supabase Storage under `closet-images/{your-user-id}/...`
  — storage policies restrict uploads/deletes to their owner, but files are
  publicly viewable via URL (needed so `<img>` tags can render them).
