-- Dubai Monthly Cars — Base Schema Migration
-- Generated from live Supabase database (Production)
-- Run this FIRST on a fresh database, then apply 0001, 0002, 0003, 0004
-- 
-- ⚠️ BEFORE RUNNING ON PRODUCTION: Take a backup!
-- This is for reference and fresh environment setup only.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "btree_gist";

-- ============================================================
-- Custom Types / Enums
-- ============================================================
create type public.user_role as enum (
  'customer', 'admin', 'fleet_manager', 'finance', 'support', 
  'delivery', 'super_admin', 'delivery_staff'
);

create type public.vehicle_status as enum (
  'available', 'rented', 'maintenance', 'out_of_service'
);

create type public.document_status as enum (
  'pending', 'approved', 'rejected'
);

create type public.booking_status as enum (
  'pending_kyc', 'pending_payment', 'active', 'completed', 
  'cancelled', 'terminated', 'pending_agreement'
);

create type public.payment_status as enum (
  'pending', 'succeeded', 'failed', 'refunded'
);

create type public.payment_type as enum (
  'deposit', 'monthly_rental', 'add_on', 'damage', 'refund', 
  'monthly_rent', 'penalty'
);

create type public.document_type as enum (
  'emirates_id', 'driving_license', 'passport'
);

create type public.promo_code_type as enum (
  'percentage', 'fixed'
);

-- ============================================================
-- Helper Functions (Auth Checks for RLS)
-- ============================================================
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin', 'fleet_manager', 'finance', 'support', 'delivery', 'delivery_staff')
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
$$;

create or replace function public.is_fleet_manager()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'fleet_manager')
  )
$$;

create or replace function public.is_finance()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'finance')
  )
$$;

create or replace function public.is_kyc_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'support')
  )
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  )
$$;

-- Grant execute permissions
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_fleet_manager() to authenticated;
grant execute on function public.is_finance() to authenticated;
grant execute on function public.is_kyc_staff() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- ============================================================
-- Tables
-- ============================================================

-- profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  email text,
  preferred_language text default 'en' check (preferred_language in ('en', 'ar')),
  preferred_theme text default 'system' check (preferred_theme in ('light', 'dark', 'system')),
  role public.user_role default 'customer',
  is_blacklisted boolean default false,
  corporate_account_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- corporate_accounts
create table public.corporate_accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  trade_license text,
  contact_person text,
  contact_phone text,
  retainer_amount numeric default 0,
  guaranteed_vehicles integer default 0,
  status text default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add FK after corporate_accounts exists
alter table public.profiles
  add constraint profiles_corporate_account_id_fkey
  foreign key (corporate_account_id) references public.corporate_accounts(id);

-- hubs
create table public.hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  area text,
  city text not null default 'Dubai',
  latitude numeric,
  longitude numeric,
  phone text,
  opening_hours text default '9:00 AM - 9:00 PM',
  is_active boolean not null default true,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year integer,
  category text,
  transmission text check (transmission in ('Automatic', 'Manual')),
  fuel_type text check (fuel_type in ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
  seats integer,
  color text,
  plate_number text unique,
  current_mileage integer default 0,
  status public.vehicle_status default 'available',
  location text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  insurance_expiry date,
  insurance_provider text,
  registration_expiry date,
  next_service_due date,
  hub_id uuid references public.hubs(id)
);

-- vehicle_images
create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null,
  is_primary boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- pricing_tiers
create table public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  mileage_limit_km integer not null,
  insurance_level text,
  includes_delivery boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- vehicle_pricing
create table public.vehicle_pricing (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  tier_id uuid not null references public.pricing_tiers(id) on delete cascade,
  monthly_price_aed numeric not null,
  security_deposit_aed numeric not null,
  unique (vehicle_id, tier_id)
);

-- add_ons
create table public.add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_aed numeric not null,
  price_type text not null check (price_type in ('one_time', 'monthly')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  tier_id uuid not null references public.pricing_tiers(id) on delete cascade,
  start_date date not null,
  end_date date,
  duration_months integer not null check (duration_months in (1, 3, 6, 12)),
  monthly_price_aed numeric not null,
  deposit_aed numeric not null,
  total_add_ons_aed numeric default 0,
  delivery_type text check (delivery_type in ('pickup', 'home_delivery')),
  delivery_address text,
  status public.booking_status default 'pending_kyc',
  agreement_signed_at timestamptz,
  agreement_pdf_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  auto_renew boolean not null default true,
  next_due_date date,
  months_paid integer not null default 0,
  pickup_hub_id uuid references public.hubs(id),
  active_booking_period daterange generated always as (
    case
      when status not in ('cancelled', 'completed', 'terminated')
      then daterange(start_date, coalesce(end_date, start_date), '[]')
      else null
    end
  ) stored
);

-- booking_add_ons
create table public.booking_add_ons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  add_on_id uuid not null references public.add_ons(id) on delete cascade,
  quantity integer default 1,
  price_aed numeric not null
);

-- documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.document_type not null,
  storage_path text not null,
  status public.document_status default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  expires_at date,
  created_at timestamptz default now()
);

-- payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  amount_aed numeric not null,
  type public.payment_type not null,
  status public.payment_status default 'pending',
  provider text,
  provider_payment_id text,
  invoice_url text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz default now(),
  billing_cycle_start date,
  billing_cycle_end date,
  retry_count integer not null default 0,
  last_retry_at timestamptz,
  failure_reason text,
  penalty_aed numeric not null default 0,
  gateway_subscription_id text,
  refund_reason text,
  refund_method text check (refund_method in ('wallet', 'bank_transfer', 'original_method')),
  refund_processed_by uuid references public.profiles(id),
  refunded_at timestamptz,
  original_payment_id uuid references public.payments(id)
);

-- maintenance_records
create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  type text check (type in ('service', 'repair', 'inspection')),
  description text,
  scheduled_date date,
  completed_date date,
  mileage_at_service integer,
  cost_aed numeric,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'overdue')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- condition_reports
create table public.condition_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  type text not null check (type in ('pickup', 'return')),
  notes text,
  mileage integer,
  fuel_level text,
  reported_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- condition_report_photos
create table public.condition_report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.condition_reports(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

-- damage_reports
create table public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  description text,
  estimated_cost_aed numeric,
  charged_against_deposit boolean default false,
  status text default 'reported' check (status in ('reported', 'under_review', 'charged', 'resolved')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- damage_report_photos
create table public.damage_report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.damage_reports(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

-- support_tickets
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ticket_messages
create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text,
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (booking_id)
);

-- referrals
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid references public.profiles(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'completed', 'rewarded')),
  reward_aed numeric,
  created_at timestamptz default now()
);

-- promo_codes
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.promo_code_type not null,
  discount_value numeric not null,
  max_uses integer,
  used_count integer default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- activity_logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- watchlist
create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, vehicle_id)
);

-- invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  payment_id uuid references public.payments(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  subtotal_aed numeric not null,
  vat_aed numeric not null,
  total_aed numeric not null,
  vat_rate numeric not null default 5,
  status text not null default 'issued' check (status in ('draft', 'issued', 'paid', 'void')),
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  line_items jsonb not null default '[]',
  customer_snapshot jsonb,
  created_at timestamptz default now()
);

-- booking_changes
create table public.booking_changes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  change_type text not null check (change_type in ('extension', 'termination', 'swap')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reason text,
  metadata jsonb not null default '{}',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- referral_settings
create table public.referral_settings (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  reward_amount_aed numeric not null default 200,
  referrer_bonus_aed numeric not null default 200,
  min_booking_amount_aed numeric not null default 1000,
  max_referrals_per_user integer default 50,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (Enable on all tables)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.corporate_accounts enable row level security;
alter table public.hubs enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.pricing_tiers enable row level security;
alter table public.vehicle_pricing enable row level security;
alter table public.add_ons enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_add_ons enable row level security;
alter table public.documents enable row level security;
alter table public.payments enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.condition_reports enable row level security;
alter table public.condition_report_photos enable row level security;
alter table public.damage_reports enable row level security;
alter table public.damage_report_photos enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.referrals enable row level security;
alter table public.promo_codes enable row level security;
alter table public.activity_logs enable row level security;
alter table public.watchlist enable row level security;
alter table public.invoices enable row level security;
alter table public.booking_changes enable row level security;
alter table public.referral_settings enable row level security;
alter table public.hubs enable row level security;

-- ============================================================
-- RLS Policies (from live DB - consolidated, deduplicated)
-- ============================================================

-- profiles
create policy "profiles_select_own_or_staff" on public.profiles
  for select to public using (auth.uid() = id or public.is_staff());

create policy "profiles_update_own" on public.profiles
  for update to public using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_update_staff" on public.profiles
  for update to public using (public.is_staff());

create policy "profiles_insert_admin" on public.profiles
  for insert to public with check (public.is_admin());

-- corporate_accounts
create policy "corporate_accounts_select_staff" on public.corporate_accounts
  for select to public using (public.is_staff());

create policy "corporate_accounts_manage_admin" on public.corporate_accounts
  for all to public using (public.is_admin()) with check (public.is_admin());

create policy "corporate_accounts_staff_all" on public.corporate_accounts
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager', 'finance')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager', 'finance')
    )
  );

-- hubs
create policy "hubs_select_active_or_auth" on public.hubs
  for select to public using (is_active = true or auth.uid() is not null);

create policy "hubs_manage_admin_fleet" on public.hubs
  for all to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  );

-- vehicles
create policy "vehicles_select_all" on public.vehicles
  for select to public using (true);

create policy "vehicles_manage_fleet" on public.vehicles
  for all to public using (public.is_fleet_manager()) with check (public.is_fleet_manager());

create policy "vehicles_insert_admin_fleet" on public.vehicles
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  );

create policy "vehicles_update_admin_fleet" on public.vehicles
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  );

create policy "vehicles_delete_admin_fleet" on public.vehicles
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  );

-- vehicle_images
create policy "vehicle_images_select_all" on public.vehicle_images
  for select to public using (true);

create policy "vehicle_images_manage_fleet" on public.vehicle_images
  for all to public using (public.is_fleet_manager()) with check (public.is_fleet_manager());

create policy "vehicle_images_insert_admin_fleet" on public.vehicle_images
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  );

create policy "vehicle_images_update_admin_fleet" on public.vehicle_images
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  );

create policy "vehicle_images_delete_admin_fleet" on public.vehicle_images
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager')
    )
  );

-- pricing_tiers
create policy "pricing_tiers_select_all" on public.pricing_tiers
  for select to public using (true);

create policy "pricing_tiers_manage_admin" on public.pricing_tiers
  for all to public using (public.is_admin()) with check (public.is_admin());

-- vehicle_pricing
create policy "vehicle_pricing_select_all" on public.vehicle_pricing
  for select to public using (true);

create policy "vehicle_pricing_manage_fleet" on public.vehicle_pricing
  for all to public using (public.is_fleet_manager()) with check (public.is_fleet_manager());

-- add_ons
create policy "add_ons_select_active_or_staff" on public.add_ons
  for select to public using (is_active = true or public.is_staff());

create policy "add_ons_manage_admin" on public.add_ons
  for all to public using (public.is_admin()) with check (public.is_admin());

-- bookings
create policy "bookings_select_own_or_staff" on public.bookings
  for select to public using (auth.uid() = customer_id or public.is_staff());

create policy "bookings_insert_own" on public.bookings
  for insert to public with check (auth.uid() = customer_id);

create policy "bookings_update_pending_own" on public.bookings
  for update to public
  using (
    auth.uid() = customer_id
    and status in ('pending_kyc', 'pending_payment')
  );

create policy "bookings_manage_staff" on public.bookings
  for all to public using (public.is_staff()) with check (public.is_staff());

-- booking_add_ons
create policy "booking_add_ons_select_own_or_staff" on public.booking_add_ons
  for select to public
  using (
    exists (
      select 1 from public.bookings
      where id = booking_add_ons.booking_id
        and (customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "booking_add_ons_insert_own" on public.booking_add_ons
  for insert to public
  with check (
    exists (
      select 1 from public.bookings
      where id = booking_add_ons.booking_id
        and customer_id = auth.uid()
    )
  );

create policy "booking_add_ons_manage_staff" on public.booking_add_ons
  for all to public using (public.is_staff()) with check (public.is_staff());

-- documents
create policy "documents_select_own_or_staff" on public.documents
  for select to public using (auth.uid() = user_id or public.is_staff());

create policy "documents_select_auth_own" on public.documents
  for select to authenticated using (user_id = auth.uid());

create policy "documents_select_kyc_staff" on public.documents
  for select to authenticated using (user_id = auth.uid() or public.is_kyc_staff());

create policy "documents_select_staff_all" on public.documents
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'fleet_manager', 'finance', 'support', 'delivery', 'delivery_staff')
    )
  );

create policy "documents_manage_staff" on public.documents
  for all to public using (public.is_staff()) with check (public.is_staff());

create policy "documents_update_kyc_staff" on public.documents
  for update to authenticated
  using (public.is_kyc_staff()) with check (public.is_kyc_staff());

create policy "documents_update_staff_all" on public.documents
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'fleet_manager', 'finance', 'support', 'delivery', 'delivery_staff')
    )
  );

create policy "documents_insert_pending_own" on public.documents
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
  );

create policy "documents_update_pending_own" on public.documents
  for update to authenticated
  using (
    user_id = auth.uid() and status = 'pending'
  )
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
  );

-- payments
create policy "payments_select_own_or_finance" on public.payments
  for select to public using (auth.uid() = customer_id or public.is_finance());

create policy "payments_manage_finance" on public.payments
  for all to public using (public.is_finance()) with check (public.is_finance());

create policy "payments_insert_own" on public.payments
  for insert to public with check (auth.uid() = customer_id);

-- maintenance_records
create policy "maintenance_manage_fleet" on public.maintenance_records
  for all to public using (public.is_fleet_manager()) with check (public.is_fleet_manager());

create policy "maintenance_select_staff" on public.maintenance_records
  for select to public using (public.is_staff());

-- condition_reports
create policy "condition_reports_select_own_or_staff" on public.condition_reports
  for select to public
  using (
    exists (
      select 1 from public.bookings
      where id = condition_reports.booking_id
        and (customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "condition_reports_insert_own_or_staff" on public.condition_reports
  for insert to public
  with check (
    exists (
      select 1 from public.bookings
      where id = condition_reports.booking_id
        and (customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "condition_reports_manage_staff" on public.condition_reports
  for all to public using (public.is_staff()) with check (public.is_staff());

-- condition_report_photos
create policy "condition_report_photos_select_own_or_staff" on public.condition_report_photos
  for select to public
  using (
    exists (
      select 1 from public.condition_reports cr
      join public.bookings b on b.id = cr.booking_id
      where cr.id = condition_report_photos.report_id
        and (b.customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "condition_report_photos_insert_own_or_staff" on public.condition_report_photos
  for insert to public
  with check (
    exists (
      select 1 from public.condition_reports cr
      join public.bookings b on b.id = cr.booking_id
      where cr.id = condition_report_photos.report_id
        and (b.customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "condition_report_photos_manage_staff" on public.condition_report_photos
  for all to public using (public.is_staff()) with check (public.is_staff());

-- damage_reports
create policy "damage_reports_select_own_or_staff" on public.damage_reports
  for select to public
  using (
    exists (
      select 1 from public.bookings
      where id = damage_reports.booking_id
        and (customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "damage_reports_insert_own" on public.damage_reports
  for insert to public
  with check (
    exists (
      select 1 from public.bookings
      where id = damage_reports.booking_id
        and customer_id = auth.uid()
    )
  );

create policy "damage_reports_manage_staff" on public.damage_reports
  for all to public using (public.is_staff()) with check (public.is_staff());

-- damage_report_photos
create policy "damage_report_photos_select_own_or_staff" on public.damage_report_photos
  for select to public
  using (
    exists (
      select 1 from public.damage_reports dr
      join public.bookings b on b.id = dr.booking_id
      where dr.id = damage_report_photos.report_id
        and (b.customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "damage_report_photos_insert_own_or_staff" on public.damage_report_photos
  for insert to public
  with check (
    exists (
      select 1 from public.damage_reports dr
      join public.bookings b on b.id = dr.booking_id
      where dr.id = damage_report_photos.report_id
        and (b.customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "damage_report_photos_manage_staff" on public.damage_report_photos
  for all to public using (public.is_staff()) with check (public.is_staff());

-- support_tickets
create policy "support_tickets_select_own_or_staff" on public.support_tickets
  for select to public using (auth.uid() = customer_id or public.is_staff());

create policy "support_tickets_insert_own" on public.support_tickets
  for insert to public with check (auth.uid() = customer_id);

create policy "support_tickets_manage_staff" on public.support_tickets
  for all to public using (public.is_staff()) with check (public.is_staff());

-- ticket_messages
create policy "ticket_messages_select_own_or_staff" on public.ticket_messages
  for select to public
  using (
    exists (
      select 1 from public.support_tickets
      where id = ticket_messages.ticket_id
        and (customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "ticket_messages_insert_own_or_staff" on public.ticket_messages
  for insert to public
  with check (
    exists (
      select 1 from public.support_tickets
      where id = ticket_messages.ticket_id
        and (customer_id = auth.uid() or public.is_staff())
    )
  );

-- notifications
create policy "notifications_select_own" on public.notifications
  for select to public using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update to public using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_insert_staff" on public.notifications
  for insert to public with check (public.is_staff());

-- reviews
create policy "reviews_select_all" on public.reviews
  for select to public using (true);

create policy "reviews_insert_own" on public.reviews
  for insert to public with check (auth.uid() = customer_id);

create policy "reviews_update_own" on public.reviews
  for update to public using (auth.uid() = customer_id);

create policy "reviews_owner_rw" on public.reviews
  for all to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "reviews_staff_read" on public.reviews
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'support', 'fleet_manager', 'finance')
    )
  );

-- referrals
create policy "referrals_select_own_or_staff" on public.referrals
  for select to public
  using (
    auth.uid() = referrer_id or auth.uid() = referred_id or public.is_staff()
  );

create policy "referrals_insert_own" on public.referrals
  for insert to public with check (auth.uid() = referrer_id);

create policy "referrals_owner_rw" on public.referrals
  for all to authenticated
  using (referrer_id = auth.uid()) with check (referrer_id = auth.uid());

create policy "referrals_staff_read" on public.referrals
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'support', 'fleet_manager', 'finance')
    )
  );

-- promo_codes
create policy "promo_codes_select_active_or_staff" on public.promo_codes
  for select to public using (is_active = true or public.is_staff());

create policy "promo_codes_manage_admin" on public.promo_codes
  for all to public using (public.is_admin()) with check (public.is_admin());

create policy "promo_codes_staff_all" on public.promo_codes
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance')
    )
  );

create policy "promo_codes_customer_read" on public.promo_codes
  for select to authenticated
  using (
    is_active = true
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
  );

-- activity_logs
create policy "activity_logs_select_staff" on public.activity_logs
  for select to public using (public.is_staff());

create policy "activity_logs_insert_staff" on public.activity_logs
  for insert to public with check (public.is_staff());

create policy "activity_logs_staff_read" on public.activity_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'support', 'fleet_manager', 'finance')
    )
  );

-- watchlist
create policy "watchlist_select_own" on public.watchlist
  for select to public using (auth.uid() = user_id);

create policy "watchlist_insert_own" on public.watchlist
  for insert to public with check (auth.uid() = user_id);

create policy "watchlist_delete_own" on public.watchlist
  for delete to public using (auth.uid() = user_id);

create policy "watchlist_owner_rw" on public.watchlist
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- invoices
create policy "invoices_select_own" on public.invoices
  for select to public using (auth.uid() = customer_id);

create policy "invoices_select_admin_finance_support" on public.invoices
  for select to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance', 'support')
    )
  );

create policy "invoices_insert_auth" on public.invoices
  for insert to public with check (true);

-- booking_changes
create policy "booking_changes_select_own" on public.booking_changes
  for select to public using (auth.uid() = requested_by);

create policy "booking_changes_insert_own" on public.booking_changes
  for insert to public with check (auth.uid() = requested_by);

create policy "booking_changes_select_admin" on public.booking_changes
  for select to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager', 'support')
    )
  );

create policy "booking_changes_update_admin" on public.booking_changes
  for update to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager', 'support')
    )
  );

-- referral_settings
create policy "referral_settings_select_admin" on public.referral_settings
  for select to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance', 'support')
    )
  );

create policy "referral_settings_update_admin" on public.referral_settings
  for update to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance')
    )
  );

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_bookings_customer_id on public.bookings(customer_id);
create index if not exists idx_bookings_vehicle_id on public.bookings(vehicle_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_active_period on public.bookings using gist (vehicle_id, active_booking_period);
create index if not exists idx_payments_customer_id on public.payments(customer_id);
create index if not exists idx_payments_booking_id on public.payments(booking_id);
create index if not exists idx_payments_provider_payment_id on public.payments(provider_payment_id) where provider_payment_id is not null;
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_vehicles_status on public.vehicles(status);
create index if not exists idx_maintenance_vehicle_id on public.maintenance_records(vehicle_id);
create index if not exists idx_condition_reports_booking_id on public.condition_reports(booking_id);
create index if not exists idx_damage_reports_booking_id on public.damage_reports(booking_id);
create index if not exists idx_support_tickets_customer_id on public.support_tickets(customer_id);
create index if not exists idx_ticket_messages_ticket_id on public.ticket_messages(ticket_id);
create index if not exists idx_reviews_booking_id on public.reviews(booking_id);
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_activity_logs_actor_id on public.activity_logs(actor_id);
create index if not exists idx_booking_changes_booking_id on public.booking_changes(booking_id);

-- ============================================================
-- Updated At Trigger (generic)
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger corporate_accounts_updated_at
  before update on public.corporate_accounts
  for each row execute function public.handle_updated_at();

create trigger vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.handle_updated_at();

create trigger hubs_updated_at
  before update on public.hubs
  for each row execute function public.handle_updated_at();

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.handle_updated_at();

create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.handle_updated_at();

create trigger referral_settings_updated_at
  before update on public.referral_settings
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Storage Buckets (Reference - create manually in Dashboard)
-- ============================================================
-- Buckets needed:
--   kyc-documents       (private)
--   agreements          (private)
--   vehicle-images      (public read OK)
--   condition-photos    (private)
--   damage-reports      (private)
--
-- Create via Dashboard > Storage or:
-- insert into storage.buckets (id, name, public) values
--   ('kyc-documents', 'kyc-documents', false),
--   ('agreements', 'agreements', false),
--   ('vehicle-images', 'vehicle-images', true),
--   ('condition-photos', 'condition-photos', false),
--   ('damage-reports', 'damage-reports', false)
-- on conflict (id) do nothing;