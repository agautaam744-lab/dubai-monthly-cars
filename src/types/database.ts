export type UserRole = 'customer' | 'admin' | 'fleet_manager' | 'finance' | 'support' | 'delivery'

export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'out_of_service'

export type BookingStatus = 'pending_kyc' | 'pending_payment' | 'active' | 'completed' | 'cancelled' | 'terminated'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'