import { OverlayPanel } from 'primereact/overlaypanel'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { ROLE_LABELS } from '@/shared/config/roles'
import { toRelativeTime } from '@/shared/lib/relativeTime'

export function Header() {
  const { user, logout } = useAuthStore()
  const notifications = useNotifications()
  const navigate = useNavigate()
  const notificationsPanel = useRef<OverlayPanel>(null)
  const profilePanel = useRef<OverlayPanel>(null)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="app-header-spacer" />

      <button
        type="button"
        className="icon-button"
        onClick={(event) => notificationsPanel.current?.toggle(event)}
        aria-label="Notifications"
      >
        <i className="pi pi-bell" />
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>
      <OverlayPanel ref={notificationsPanel} className="notifications-panel">
        {notifications.length === 0 ? (
          <p className="empty-state">No notifications.</p>
        ) : (
          <ul className="notifications-list">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <p>{notification.message}</p>
                <small>{toRelativeTime(notification.dateTime)}</small>
              </li>
            ))}
          </ul>
        )}
      </OverlayPanel>

      <button
        type="button"
        className="profile-button"
        onClick={(event) => profilePanel.current?.toggle(event)}
      >
        <i className="pi pi-user-circle" />
        <span>{user ? ROLE_LABELS[user.role] : ''}</span>
      </button>
      <OverlayPanel ref={profilePanel}>
        <button type="button" className="menu-item" onClick={handleLogout}>
          <i className="pi pi-sign-out" /> Sign out
        </button>
      </OverlayPanel>
    </header>
  )
}
