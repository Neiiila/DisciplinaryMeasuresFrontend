import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { env } from '@/shared/config/env'
import { visibleNavItems } from '@/shared/ui/layout/navigation'

export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role)
  const items = role ? visibleNavItems(role) : []

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">{env.companyName}</div>
      <nav>
        <ul className="sidebar-nav">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
