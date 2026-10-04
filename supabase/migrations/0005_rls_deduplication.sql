-- Dubai Monthly Cars — RLS Policy Deduplication & Missing Policies
-- Run AFTER 0001_mvp_additive.sql on production
-- ⚠️ TAKE BACKUP BEFORE RUNNING
--
-- This migration:
-- 1. Drops duplicate/overlapping policies
-- 2. Creates consolidated, clean policies
-- 3. Adds missing policies (invoices UPDATE/DELETE, booking_changes DELETE, etc.)

-- ============================================================
-- 1. PROFILES - Consolidate 7 policies → 4
-- ============================================================
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Staff can update any profile" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Super admins can update any profile" on public.profiles;
drop policy if exists "super_admin_can_update_profiles" on public.profiles;

-- Clean consolidated policies
create policy "profiles_select_own_or_staff" on public.profiles
  for select to public using (auth.uid() = id or public.is_staff());

create policy "profiles_update_own" on public.profiles
  for update to public using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_update_staff" on public.profiles
  for update to public using (public.is_staff());

create policy "profiles_insert_admin" on public.profiles
  for insert to public with check (public.is_admin());

-- ============================================================
-- 2. DOCUMENTS - Consolidate 9 policies → 5
-- ============================================================
drop policy if exists "Users can view their own documents" on public.documents;
drop policy if exists "Staff can manage all documents" on public.documents;
drop policy if exists "Customers can view own documents" on public.documents;
drop policy if exists "KYC staff can view documents" on public.documents;
drop policy if exists "KYC staff can update documents" on public.documents;
drop policy if exists "staff_can_view_all_documents" on public.documents;
drop policy if exists "staff_can_update_documents" on public.documents;
drop policy if exists "Customers can upload pending own documents" on public.documents;
drop policy if exists "Users can update their own pending documents" on public.documents;

create policy "documents_select_own_or_staff" on public.documents
  for select to public using (auth.uid() = user_id or public.is_staff());

create policy "documents_manage_staff" on public.documents
  for all to public using (public.is_staff()) with check (public.is_staff());

create policy "documents_update_kyc_staff" on public.documents
  for update to authenticated using (public.is_kyc_staff()) with check (public.is_kyc_staff());

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

-- ============================================================
-- 3. VEHICLES - Consolidate 6 policies → 4
-- ============================================================
drop policy if exists "Anyone can view available vehicles" on public.vehicles;
drop policy if exists "Fleet managers can manage vehicles" on public.vehicles;
drop policy if exists "Anyone can view vehicles" on public.vehicles;
drop policy if exists "Admins can insert vehicles" on public.vehicles;
drop policy if exists "Admins can update vehicles" on public.vehicles;
drop policy if exists "Admins can delete vehicles" on public.vehicles;

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

-- DELETE handled by fleet_manager policy above (ALL includes DELETE)

-- ============================================================
-- 4. VEHICLE_IMAGES - Consolidate 5 policies → 4
-- ============================================================
drop policy if exists "Fleet managers can manage vehicle images" on public.vehicle_images;
drop policy if exists "Anyone can view vehicle images" on public.vehicle_images;
drop policy if exists "Admins can insert vehicle images" on public.vehicle_images;
drop policy if exists "Admins can update vehicle images" on public.vehicle_images;
drop policy if exists "Admins can delete vehicle images" on public.vehicle_images;

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

-- ============================================================
-- 5. CORPORATE_ACCOUNTS - Consolidate 3 policies → 2
-- ============================================================
drop policy if exists "Staff can view corporate accounts" on public.corporate_accounts;
drop policy if exists "Admins can manage corporate accounts" on public.corporate_accounts;
drop policy if exists "corporate_accounts_staff_all" on public.corporate_accounts;

create policy "corporate_accounts_select_staff" on public.corporate_accounts
  for select to public using (public.is_staff());

create policy "corporate_accounts_manage_admin_fleet_finance" on public.corporate_accounts
  for all to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin', 'fleet_manager', 'finance')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin', 'fleet_manager', 'finance')
    )
  );

-- ============================================================
-- 6. ADD_MISSING_POLICIES
-- ============================================================

-- INVOICES - Add UPDATE/DELETE for finance/super_admin
drop policy if exists "invoices_update_finance" on public.invoices;
drop policy if exists "invoices_delete_finance" on public.invoices;

create policy "invoices_update_finance" on public.invoices
  for update to public
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

create policy "invoices_delete_finance" on public.invoices
  for delete to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance')
    )
  );

-- BOOKING_CHANGES - Add DELETE for admin/fleet_manager/support
drop policy if exists "booking_changes_delete_admin" on public.booking_changes;

create policy "booking_changes_delete_admin" on public.booking_changes
  for delete to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'fleet_manager', 'support')
    )
  );

-- REFERRAL_SETTINGS - Add INSERT/DELETE for super_admin/finance
drop policy if exists "referral_settings_insert_admin" on public.referral_settings;
drop policy if exists "referral_settings_delete_admin" on public.referral_settings;

create policy "referral_settings_insert_admin" on public.referral_settings
  for insert to public
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance')
    )
  );

create policy "referral_settings_delete_admin" on public.referral_settings
  for delete to public
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'finance')
    )
  );

-- PROMO_CODES - Add customer INSERT for super_admin/finance (if needed)
-- Already covered by promo_codes_staff_all (ALL)

-- HUBS - Add UPDATE for staff (currently only admin/fleet_manager)
drop policy if exists "hubs_update_staff" on public.hubs;

create policy "hubs_update_staff" on public.hubs
  for update to public
  using (public.is_staff())
  with check (public.is_staff());

-- ACTIVITY_LOGS - Ensure INSERT for staff (already exists but verify)
drop policy if exists "activity_logs_insert_staff" on public.activity_logs;
create policy "activity_logs_insert_staff" on public.activity_logs
  for insert to public with check (public.is_staff());

-- ============================================================
-- 7. REVIEWS - Consolidate 5 policies → 3 (base schema has them, ensure clean)
-- ============================================================
drop policy if exists "reviews_owner_rw" on public.reviews;
drop policy if exists "reviews_staff_read" on public.reviews;
drop policy if exists "Customers can create reviews for their bookings" on public.reviews;
drop policy if exists "Customers can update their own reviews" on public.reviews;
drop policy if exists "Anyone can view reviews" on public.reviews;

create policy "reviews_select_all" on public.reviews
  for select to public using (true);

create policy "reviews_owner_rw" on public.reviews
  for all to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "reviews_staff_read" on public.reviews
  for select to authenticated
  using (public.is_staff());

-- ============================================================
-- 8. REFERRALS - Consolidate 4 policies → 3
-- ============================================================
drop policy if exists "referrals_owner_rw" on public.referrals;
drop policy if exists "referrals_staff_read" on public.referrals;
drop policy if exists "Users can view their own referrals" on public.referrals;
drop policy if exists "Users can create referrals" on public.referrals;

create policy "referrals_select_own_or_staff" on public.referrals
  for select to public
  using (auth.uid() = referrer_id or auth.uid() = referred_id or public.is_staff());

create policy "referrals_insert_own" on public.referrals
  for insert to public with check (auth.uid() = referrer_id);

create policy "referrals_staff_read" on public.referrals
  for select to authenticated
  using (public.is_staff());

-- ============================================================
-- 9. PROMO_CODES - Consolidate 4 policies → 3
-- ============================================================
drop policy if exists "promo_codes_staff_all" on public.promo_codes;
drop policy if exists "promo_codes_customer_read" on public.promo_codes;
drop policy if exists "Anyone can view active promo codes" on public.promo_codes;
drop policy if exists "Admins can manage promo codes" on public.promo_codes;

create policy "promo_codes_select_active_or_staff" on public.promo_codes
  for select to public using (is_active = true or public.is_staff());

create policy "promo_codes_manage_admin" on public.promo_codes
  for all to public using (public.is_admin()) with check (public.is_admin());

create policy "promo_codes_staff_finance" on public.promo_codes
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

-- ============================================================
-- 10. ACTIVITY_LOGS - Consolidate 3 policies → 2
-- ============================================================
drop policy if exists "activity_logs_staff_read" on public.activity_logs;
drop policy if exists "Staff can view activity logs" on public.activity_logs;
drop policy if exists "Staff can insert activity logs" on public.activity_logs;

create policy "activity_logs_select_staff" on public.activity_logs
  for select to public using (public.is_staff());

create policy "activity_logs_insert_staff" on public.activity_logs
  for insert to public with check (public.is_staff());

-- ============================================================
-- 11. WATCHLIST - Consolidate 4 policies → 2
-- ============================================================
drop policy if exists "watchlist_owner_rw" on public.watchlist;
drop policy if exists "Users can delete own watchlist" on public.watchlist;
drop policy if exists "Users can view own watchlist" on public.watchlist;
drop policy if exists "Users can insert own watchlist" on public.watchlist;

create policy "watchlist_owner_rw" on public.watchlist
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "watchlist_select_own" on public.watchlist
  for select to public using (auth.uid() = user_id);

-- ============================================================
-- 12. PAYMENTS - Verify finance policy covers all (base schema has it)
-- ============================================================
-- Base schema has: payments_manage_finance (ALL), payments_select_own_or_finance, payments_insert_own
-- No changes needed.

-- ============================================================
-- 13. BOOKING_ADD_ONS - Verify staff policy covers all (base schema has it)
-- ============================================================
-- Base schema has: booking_add_ons_manage_staff (ALL), etc.
-- No changes needed.

-- ============================================================
-- 14. CONDITION_REPORTS / DAMAGE_REPORTS - Verify staff policies (base schema has)
-- ============================================================
-- Base schema has consolidated staff policies for these.
-- No changes needed.

-- ============================================================
-- 15. SUPPORT_TICKETS / TICKET_MESSAGES - Verify (base schema has)
-- ============================================================
-- No changes needed.

-- ============================================================
-- 16. NOTIFICATIONS - Verify (base schema has)
-- ============================================================
-- No changes needed.

-- ============================================================
-- 17. MAINTENANCE_RECORDS - Verify (base schema has)
-- ============================================================
-- No changes needed.

-- ============================================================
-- 18. PRICING_TIERS / VEHICLE_PRICING - Verify (base schema has)
-- ============================================================
-- No changes needed.

-- ============================================================
-- 19. ADD_ONS - Verify (base schema has)
-- ============================================================
-- No changes needed.

-- ============================================================
-- 20. HUBS - Already handled above
-- ============================================================

-- ============================================================
-- Grant execute on all helper functions (ensure)
-- ============================================================
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_fleet_manager() to authenticated;
grant execute on function public.is_finance() to authenticated;
grant execute on function public.is_kyc_staff() to authenticated;
grant execute on function public.is_super_admin() to authenticated;