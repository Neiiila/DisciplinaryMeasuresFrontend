import { ROLES, type Role } from '@/shared/config/roles'

export interface NavItem {
  label: string
  to: string
  icon: string
  /** Omitted means every authenticated role may see it. */
  roles?: Role[]
}

const ADMIN_ONLY = [ROLES.ADMINISTRATOR]

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/dashboard', icon: 'pi pi-home' },
  { label: 'My requests', to: '/dashboard/sanctions/mine', icon: 'pi pi-send' },
  { label: 'Addressed to me', to: '/dashboard/sanctions/addressed-to-me', icon: 'pi pi-inbox' },
  { label: 'Raise a request', to: '/dashboard/sanctions/new', icon: 'pi pi-plus-circle' },
  { label: 'Directory', to: '/dashboard/employees', icon: 'pi pi-id-card' },
  { label: 'All requests', to: '/dashboard/sanctions', icon: 'pi pi-shield', roles: ADMIN_ONLY },
  { label: 'Users', to: '/dashboard/users', icon: 'pi pi-users', roles: ADMIN_ONLY },
]

export function visibleNavItems(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}
