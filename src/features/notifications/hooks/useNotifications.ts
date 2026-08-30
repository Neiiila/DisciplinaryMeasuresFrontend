import { useEffect, useState } from 'react'
import { notificationRepository } from '@/features/notifications/api/notificationRepository'
import type { AppNotification } from '@/features/notifications/types'
import { useAuthStore } from '@/features/auth/store/authStore'

const POLL_INTERVAL_MS = 30_000

/**
 * The legacy app kept a permanent SignalR connection open just to receive
 * notifications, but wired it to a hardcoded placeholder user id rather
 * than the signed-in user. Polling the existing REST endpoint on a short
 * interval is simpler to reason about and correct by construction; a real
 * push channel (SignalR/WebSocket) can be swapped in behind this same hook
 * later without touching the header component that consumes it.
 */
export function useNotifications() {
  const userId = useAuthStore((state) => state.user?.userId)
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function load() {
      try {
        const data = await notificationRepository.getForUser(userId!)
        if (!cancelled) setNotifications(data)
      } catch {
        // Notifications are non-critical; silently retry on the next tick.
      }
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [userId])

  return notifications
}
