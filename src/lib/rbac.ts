import type { StaffRole } from '@/types/database'

export const STAFF_ROLES = [
  'super_admin',
  'fleet_manager',
  'finance',
  'support',
  'delivery',
] as const satisfies readonly StaffRole[]

export type AdminRole = (typeof STAFF_ROLES)[number]

export function isStaffRole(value: unknown): value is AdminRole {
  return (
    typeof value === 'string' &&
    (STAFF_ROLES as readonly string[]).includes(value)
  )
}

export function isSuperAdmin(value: unknown): value is 'super_admin' {
  return value === 'super_admin'
}
