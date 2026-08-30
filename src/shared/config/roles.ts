export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  CHIEF: 'chief',
  GUEST: 'guest',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.CHIEF]: 'Supervisor',
  [ROLES.GUEST]: 'Guest',
}
