import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { userRepository } from '@/features/users/api/userRepository'
import type { AppNotification } from '@/features/users/types'

const POLL_INTERVAL_MS = 30_000

/**
 * The signed-in user's notifications.
 *
 * The backend also exposes a SignalR hub at `/hubs/notifications`, which is
 * the better long-term transport. Polling the REST endpoint is used here
 * because it needs no extra dependency and is trivially testable; swapping
 * in the hub is a change to this hook alone, since the header consumes only
 * its return value.
 */
export function useNotifications() {
  const userId = useAuthStore((state) => state.user?.userId)
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const load = useCallback(async () => {
    try {
      setNotifications(await userRepository.getMyNotifications())
    } catch {
      // Notifications are ancillary: a failure here must not surface as an
      // error toast over whatever the user is actually doing.
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      return
    }

    void load()
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [userId, load])

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return { notifications, unreadCount, refresh: load }
}
