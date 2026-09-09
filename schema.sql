-- ============================================================
-- ZEKRA schema. Run this once in Supabase: Dashboard > SQL Editor > New query.
-- ============================================================

create extension if not exists pgcrypto;

-- ----------------------------
-- Admins
-- ----------------------------
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------
-- Customers
-- ----------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  username text unique not null,
  password_hash text not null,

  customer_name text not null,
  boy_name text not null default '',
  girl_name text not null default '',
  story_year text not null default '',
  relationship_start_date timestamptz,

  beginning_title text not null default '',
  beginning_description text not null default '',

  -- array of exactly 11 entries: [{ "url": "...", "position": 0 }, ...]
  memory_images jsonb not null default '[]'::jsonb,

  -- array of exactly 4 entries: [{ "url": "...", "caption": "..." }, ...]
  gallery_images jsonb not null default '[]'::jsonb,

  music_url text,
  video_url text,
  video_cover_url text,

  letter_text text not null default '',
  signature text not null default '',
  final_text text not null default '',

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_slug_idx on customers (slug);

-- keep updated_at fresh on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists customers_set_updated_at on customers;
create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- ----------------------------
-- Row Level Security
-- ----------------------------
-- All writes in this app go through Next.js API routes using the
-- Supabase SERVICE ROLE key, which bypasses RLS by design — that's
-- where username/password checks and per-customer isolation are
-- enforced in application code (see lib/auth.js).
--
-- RLS below only governs the ANON key, which the public customer
-- page uses directly from the browser to read one published
-- customer's data by slug. It cannot read admins, other tables,
-- or unpublished customers, and can never write anything.

alter table customers enable row level security;
alter table admins enable row level security;

drop policy if exists "public can read published customers" on customers;
create policy "public can read published customers"
  on customers for select
  using (is_published = true);

-- No policies are created for insert/update/delete/admins on purpose:
-- with RLS enabled and no matching policy, the anon key is denied by
-- default, so only the service-role key (server-side only) can write.

-- ----------------------------
-- Storage bucket
-- ----------------------------
-- Create this in the dashboard instead if you prefer clicking:
-- Storage > New bucket > name "customer-media" > Public bucket: ON
-- (Public read is what lets the plain <img>/<video>/<audio> tags on
-- the original site load files directly by URL. Only the server,
-- using the service role key, is able to upload/replace/delete files.)

insert into storage.buckets (id, name, public)
values ('customer-media', 'customer-media', true)
on conflict (id) do nothing;
