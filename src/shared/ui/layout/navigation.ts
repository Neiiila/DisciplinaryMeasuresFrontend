import { ROLES, type Role } from '@/shared/config/roles'

export interface NavItem {
  label: string
  to: string
  icon: string
  roles?: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/dashboard', icon: 'pi pi-home' },
  {
    label: 'Users',
    to: '/dashboard/users',
    icon: 'pi pi-users',
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    label: 'Employees',
    to: '/dashboard/employees',
    icon: 'pi pi-id-card',
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    label: 'Sanction requests',
    to: '/dashboard/sanctions',
    icon: 'pi pi-shield',
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    label: 'New sanction request',
    to: '/dashboard/sanctions/new',
    icon: 'pi pi-plus-circle',
    roles: [ROLES.ADMIN, ROLES.CHIEF, ROLES.SUPER_ADMIN],
  },
  {
    label: 'My requests',
    to: '/dashboard/sanctions/mine',
    icon: 'pi pi-send',
    roles: [ROLES.ADMIN, ROLES.CHIEF],
  },
  {
    label: 'Received requests',
    to: '/dashboard/sanctions/received',
    icon: 'pi pi-inbox',
    roles: [ROLES.ADMIN, ROLES.CHIEF, ROLES.SUPER_ADMIN],
  },
  {
    label: 'Meetings',
    to: '/dashboard/meetings',
    icon: 'pi pi-calendar',
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
]

export function visibleNavItems(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}
