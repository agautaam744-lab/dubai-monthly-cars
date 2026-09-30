-- Dubai Monthly Cars — MVP additive migration
-- REVIEW BEFORE APPLYING (Supabase Dashboard > SQL Editor, or `supabase db push`).
-- All statements are additive (IF NOT EXISTS). Nothing is dropped or disabled.
-- RLS stays ON everywhere. Service-role key must remain server-side only.
--
-- Covers tables referenced by the app that may not exist yet:
--   promo_codes   (admin finance promo manager)
--   reviews       (customer ratings & reviews)
--   activity_logs (admin staff activity log)

-- ---------------------------------------------------------------------------
-- Helper: staff check (used by RLS policies below)
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'fleet_manager', 'finance', 'support', 'delivery')
  )
$$;

-- ---------------------------------------------------------------------------
-- promo_codes
-- ---------------------------------------------------------------------------
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent between 1 and 90),
  max_uses integer,
  used_count integer not null default 0,
  expires_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

drop policy if exists "promo_codes_staff_all" on public.promo_codes;
create policy "promo_codes_staff_all" on public.promo_codes
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "promo_codes_customer_read_active" on public.promo_codes;
create policy "promo_codes_customer_read_active" on public.promo_codes
  for select to authenticated
  using (is_active = true and (expires_at is null or expires_at >= current_date));

-- ---------------------------------------------------------------------------
-- reviews (one per booking)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

alter table public.reviews enable row level security;

drop policy if exists "reviews_owner_rw" on public.reviews;
create policy "reviews_owner_rw" on public.reviews
  for all to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

drop policy if exists "reviews_staff_read" on public.reviews;
create policy "reviews_staff_read" on public.reviews
  for select to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- activity_logs (append-only; written with the service-role client)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs_staff_read" on public.activity_logs;
create policy "activity_logs_staff_read" on public.activity_logs
  for select to authenticated
  using (public.is_staff());

-- No public INSERT policy on purpose: writes go through the service-role
-- client in admin Server Actions only.

-- ---------------------------------------------------------------------------
-- STORAGE (verify in Dashboard > Storage; do NOT make PII buckets public)
-- Buckets used by the app:
--   kyc-documents   (private — Emirates ID / license / passport scans)
--   agreements      (private — signed signature PNGs)
--   vehicle-images  (public read is acceptable — marketing photos)
--   condition-photos, damage-reports (authenticated read recommended)
--
-- Template for a private owner-only bucket policy (adjust per bucket):
--
--   create policy "owner_read_own"
--   on storage.objects for select to authenticated
--   using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
--
--   create policy "owner_insert_own"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
-- ---------------------------------------------------------------------------
