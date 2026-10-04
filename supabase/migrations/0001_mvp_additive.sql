-- Dubai Monthly Cars — MVP Additive Migration
-- REVIEW BEFORE APPLYING (Supabase Dashboard > SQL Editor, or `supabase db push`).
-- All statements are ADDITIVE (IF NOT EXISTS / CREATE POLICY IF NOT EXISTS).
-- Nothing is dropped or disabled. RLS stays ON everywhere.
-- Service-role key must remain server-side only.
--
-- This migration adds tables/policies that may not exist in base schema:
--   promo_codes   (admin finance promo manager) - columns differ from base
--   reviews       (customer ratings & reviews) - vehicle_id added
--   activity_logs (admin staff activity log) - metadata column added
--
-- Run AFTER 0000_base_schema.sql

-- ============================================================
-- promo_codes - ADD missing columns to base schema table
-- ============================================================
-- Base schema has: discount_type, discount_value, valid_from, valid_until
-- This migration adds: discount_percent (legacy), expires_at (legacy date)
-- We keep both for backward compatibility

alter table public.promo_codes
  add column if not exists discount_percent integer check (discount_percent between 1 and 90);

alter table public.promo_codes
  add column if not exists expires_at date;

alter table public.promo_codes
  add column if not exists max_uses integer;

-- Update existing rows: if discount_percent is null but discount_type/value exist, compute
update public.promo_codes
set discount_percent = case 
  when discount_type = 'percentage' then discount_value::int
  else null
end
where discount_percent is null;

-- RLS Policies (idempotent)
drop policy if exists "promo_codes_staff_all" on public.promo_codes;
create policy "promo_codes_staff_all" on public.promo_codes
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "promo_codes_customer_read_active" on public.promo_codes;
create policy "promo_codes_customer_read_active" on public.promo_codes
  for select to authenticated
  using (is_active = true and (expires_at is null or expires_at >= current_date));

-- ============================================================
-- reviews - ADD vehicle_id column (base schema already has it)
-- ============================================================
-- Base schema already includes vehicle_id and unique(booking_id)
-- Just ensure RLS policies exist

drop policy if exists "reviews_owner_rw" on public.reviews;
create policy "reviews_owner_rw" on public.reviews
  for all to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

drop policy if exists "reviews_staff_read" on public.reviews;
create policy "reviews_staff_read" on public.reviews
  for select to authenticated
  using (public.is_staff());

-- ============================================================
-- activity_logs - ADD metadata column (base schema already has it)
-- ============================================================
-- Base schema already includes metadata jsonb
-- Just ensure RLS policies exist

drop policy if exists "activity_logs_staff_read" on public.activity_logs;
create policy "activity_logs_staff_read" on public.activity_logs
  for select to authenticated
  using (public.is_staff());

-- No public INSERT policy on purpose: writes go through the service-role
-- client in admin Server Actions only.

-- ============================================================
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
-- ============================================================