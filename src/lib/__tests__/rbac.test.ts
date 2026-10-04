import { 
  STAFF_ROLES, 
  isStaffRole, 
  isSuperAdmin,
  type AdminRole 
} from '@/lib/rbac'

describe('rbac', () => {
  describe('STAFF_ROLES', () => {
    it('includes all required roles', () => {
      expect(STAFF_ROLES).toContain('super_admin')
      expect(STAFF_ROLES).toContain('admin')
      expect(STAFF_ROLES).toContain('fleet_manager')
      expect(STAFF_ROLES).toContain('finance')
      expect(STAFF_ROLES).toContain('support')
      expect(STAFF_ROLES).toContain('delivery')
      expect(STAFF_ROLES).toContain('delivery_staff')
    })

    it('does not include customer', () => {
      expect(STAFF_ROLES).not.toContain('customer')
    })

    it('has 7 roles', () => {
      expect(STAFF_ROLES).toHaveLength(7)
    })
  })

  describe('isStaffRole', () => {
    it('returns true for valid staff roles', () => {
      STAFF_ROLES.forEach(role => {
        expect(isStaffRole(role)).toBe(true)
      })
    })

    it('returns false for customer', () => {
      expect(isStaffRole('customer')).toBe(false)
    })

    it('returns false for invalid roles', () => {
      expect(isStaffRole('invalid')).toBe(false)
      expect(isStaffRole('')).toBe(false)
      expect(isStaffRole(null)).toBe(false)
      expect(isStaffRole(undefined)).toBe(false)
      expect(isStaffRole(123)).toBe(false)
    })
  })

  describe('isSuperAdmin', () => {
    it('returns true for super_admin', () => {
      expect(isSuperAdmin('super_admin')).toBe(true)
    })

    it('returns false for other roles', () => {
      expect(isSuperAdmin('admin')).toBe(false)
      expect(isSuperAdmin('fleet_manager')).toBe(false)
      expect(isSuperAdmin('customer')).toBe(false)
      expect(isSuperAdmin('')).toBe(false)
    })
  })

  describe('AdminRole type', () => {
    it('matches STAFF_ROLES', () => {
      // TypeScript compile-time check - if this compiles, types match
      const roles: AdminRole[] = [...STAFF_ROLES]
      expect(roles).toHaveLength(7)
    })
  })
})