export const USER_ROLES = [
  'customer',
  'super_admin',
  'admin',
  'fleet_manager',
  'finance',
  'support',
  'delivery',
  'delivery_staff',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export type StaffRole = Exclude<UserRole, 'customer'>

export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'out_of_service'

export type BookingStatus = 'pending_kyc' | 'pending_payment' | 'active' | 'completed' | 'cancelled' | 'terminated' | 'pending_agreement'

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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          email: string | null
          preferred_language: 'en' | 'ar'
          preferred_theme: 'light' | 'dark' | 'system'
          role: UserRole
          is_blacklisted: boolean
          corporate_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      vehicles: {
        Row: {
          id: string
          make: string
          model: string
          year: number | null
          category: string | null
          transmission: string | null
          fuel_type: string | null
          seats: number | null
          color: string | null
          plate_number: string
          current_mileage: number | null
          status: 'available' | 'rented' | 'maintenance' | 'out_of_service'
          location: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          vehicle_id: string
          tier_id: string
          start_date: string
          end_date: string | null
          duration_months: number
          monthly_price_aed: number | string
          deposit_aed: number | string
          total_add_ons_aed: number | string
          delivery_type: 'pickup' | 'home_delivery'
          delivery_address: string | null
          status: 'pending_kyc' | 'pending_payment' | 'active' | 'completed' | 'cancelled' | 'terminated' | 'pending_agreement'
          agreement_signed_at: string | null
          agreement_pdf_path: string | null
          created_at: string
          updated_at: string
          auto_renew: boolean
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }
      pricing_tiers: {
        Row: {
          id: string
          name: string
          description: string | null
          mileage_limit_km: number
          insurance_level: string | null
          includes_delivery: boolean | null
          sort_order: number | null
        }
        Insert: Omit<Database['public']['Tables']['pricing_tiers']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['pricing_tiers']['Row']>
      }
      vehicle_pricing: {
        Row: {
          id: string
          vehicle_id: string
          tier_id: string
          monthly_price_aed: number | string
          security_deposit_aed: number | string
        }
        Insert: Omit<Database['public']['Tables']['vehicle_pricing']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['vehicle_pricing']['Row']>
      }
      vehicle_images: {
        Row: {
          id: string
          vehicle_id: string
          storage_path: string
          is_primary: boolean | null
          sort_order: number | null
        }
        Insert: Omit<Database['public']['Tables']['vehicle_images']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['vehicle_images']['Row']>
      }
      add_ons: {
        Row: {
          id: string
          name: string
          description: string | null
          price_aed: number | string
          price_type: 'one_time' | 'monthly'
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['add_ons']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['add_ons']['Row']>
      }
      booking_add_ons: {
        Row: {
          id: string
          booking_id: string
          add_on_id: string
          quantity: number
          price_aed: number | string
        }
        Insert: Omit<Database['public']['Tables']['booking_add_ons']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['booking_add_ons']['Row']>
      }
      documents: {
        Row: {
          id: string
          user_id: string
          type: 'emirates_id' | 'driving_license' | 'passport'
          storage_path: string
          status: 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
          expires_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['documents']['Row']>
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          amount_aed: number | string
          type: string
          status: 'pending' | 'succeeded' | 'failed' | 'refunded'
          provider: string | null
          provider_payment_id: string | null
          due_date: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Row']>
      }
      condition_reports: {
        Row: {
          id: string
          booking_id: string
          type: 'pickup' | 'return'
          mileage: number
          fuel_level: string
          notes: string | null
          reported_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['condition_reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['condition_reports']['Row']>
      }
      condition_report_photos: {
        Row: {
          id: string
          report_id: string
          storage_path: string
        }
        Insert: Omit<Database['public']['Tables']['condition_report_photos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['condition_report_photos']['Row']>
      }
      damage_reports: {
        Row: {
          id: string
          booking_id: string
          description: string
          estimated_cost_aed: number | null
          charged_against_deposit: boolean
          status: 'reported' | 'under_review' | 'charged' | 'resolved'
          created_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['damage_reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['damage_reports']['Row']>
      }
      damage_report_photos: {
        Row: {
          id: string
          report_id: string
          storage_path: string
        }
        Insert: Omit<Database['public']['Tables']['damage_report_photos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['damage_report_photos']['Row']>
      }
      maintenance_records: {
        Row: {
          id: string
          vehicle_id: string
          type: 'service' | 'repair' | 'inspection'
          description: string
          scheduled_date: string
          completed_date: string | null
          mileage_at_service: number | null
          cost_aed: number | null
          status: 'scheduled' | 'completed' | 'overdue'
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['maintenance_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['maintenance_records']['Row']>
      }
      corporate_accounts: {
        Row: {
          id: string
          company_name: string
          trade_license: string | null
          contact_person: string | null
          contact_phone: string | null
          email: string | null
          retainer_amount: number | null
          guaranteed_vehicles: number | null
          status: 'active' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['corporate_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['corporate_accounts']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          type: string | null
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      activity_logs: {
        Row: {
          id: string
          actor_id: string
          action: string
          entity_type: string
          entity_id: string
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activity_logs']['Row']>
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          vehicle_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string | null
          status: 'pending' | 'completed' | 'rewarded'
          reward_aed: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['referrals']['Row']>
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['watchlist']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['watchlist']['Row']>
      }
      promo_codes: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          valid_from: string | null
          valid_until: string | null
          max_uses: number | null
          used_count: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['promo_codes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['promo_codes']['Row']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      vehicle_status: 'available' | 'rented' | 'maintenance' | 'out_of_service'
      booking_status: 'pending_kyc' | 'pending_payment' | 'active' | 'completed' | 'cancelled' | 'terminated' | 'pending_agreement'
      document_status: 'pending' | 'approved' | 'rejected'
      payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded'
      document_type: 'emirates_id' | 'driving_license' | 'passport'
      payment_type: 'deposit' | 'monthly_rental' | 'monthly_rent' | 'add_on' | 'refund' | 'damage' | 'penalty'
      promo_code_type: 'percentage' | 'fixed'
    }
  }
}
