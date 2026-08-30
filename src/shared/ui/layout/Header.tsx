import { OverlayPanel } from 'primereact/overlaypanel'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { ROLE_LABELS } from '@/shared/config/roles'
import { formatRelative } from '@/shared/lib/formatDate'

export function Header() {
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount } = useNotifications()
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
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        onClick={(event) => notificationsPanel.current?.toggle(event)}
      >
        <i className="pi pi-bell" aria-hidden="true" />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      <OverlayPanel ref={notificationsPanel} className="notifications-panel">
        {notifications.length === 0 ? (
          <p className="empty-state">No notifications.</p>
        ) : (
          <ul className="notifications-list">
            {notifications.map((notification) => (
              <li key={notification.id} className={notification.isRead ? undefined : 'unread'}>
                <p>{notification.message}</p>
                <small>{formatRelative(notification.raisedOn)}</small>
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
        <i className="pi pi-user-circle" aria-hidden="true" />
        <span className="profile-name">
          {user?.displayName}
          {user && <small>{ROLE_LABELS[user.role]}</small>}
        </span>
      </button>
      <OverlayPanel ref={profilePanel}>
        <button type="button" className="menu-item" onClick={handleLogout}>
          <i className="pi pi-sign-out" aria-hidden="true" /> Sign out
        </button>
      </OverlayPanel>
    </header>
  )
}
