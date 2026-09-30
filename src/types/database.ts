export type UserRole = 'customer' | 'admin' | 'fleet_manager' | 'finance' | 'support' | 'delivery'

export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'out_of_service'

export type BookingStatus = 'pending_kyc' | 'pending_payment' | 'active' | 'completed' | 'cancelled' | 'terminated'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

// Supabase joined-row helpers (untyped client returns `any`; these give
// map callbacks precise shapes without `any` annotations).
export type ToOne<T> = T | T[] | null

export function first<T>(rel: ToOne<T>): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export interface VehicleRef {
  id?: string
  make: string
  model: string
  year?: number | null
  category?: string | null
  location?: string | null
  plate_number?: string | null
  status?: string
  current_mileage?: number | null
}

export interface TierRef {
  id?: string
  name: string
  mileage_limit_km?: number | null
  insurance_level?: string | null
}

export interface CustomerRef {
  full_name?: string | null
  email?: string | null
  phone?: string | null
}

export interface BookingRow {
  id: string
  status: string
  start_date: string
  end_date?: string | null
  duration_months?: number | null
  vehicle_id?: string | null
  customer_id?: string
  monthly_price_aed?: number | string | null
  deposit_aed?: number | string | null
  total_add_ons_aed?: number | string | null
  created_at?: string
  vehicles?: ToOne<VehicleRef>
  pricing_tiers?: ToOne<TierRef>
  profiles?: ToOne<CustomerRef>
}

export interface PaymentRow {
  id: string
  booking_id?: string | null
  customer_id?: string
  amount_aed?: number | string | null
  type?: string | null
  status: string
  provider?: string | null
  paid_at?: string | null
  due_date?: string | null
  created_at?: string
  profiles?: ToOne<CustomerRef>
}

export interface DamageReportRow {
  id: string
  description?: string | null
  estimated_cost_aed?: number | string | null
  charged_against_deposit?: boolean | null
  status: string
  created_at?: string
  bookings?: {
    id?: string
    vehicles?: ToOne<VehicleRef>
    profiles?: ToOne<CustomerRef>
  } | null
}

export interface MaintenanceRow {
  id: string
  type?: string | null
  description?: string | null
  scheduled_date?: string | null
  cost_aed?: number | string | null
  status: string
  vehicles?: ToOne<VehicleRef>
}

export interface CorporateAccountRow {
  id: string
  company_name: string
  status: string
  contact_person?: string | null
  contact_phone?: string | null
  trade_license?: string | null
  retainer_amount?: number | string | null
  guaranteed_vehicles?: number | string | null
}

export interface NotificationRow {
  id: string
  title?: string | null
  body?: string | null
  type?: string | null
  is_read?: boolean | null
  created_at?: string
}