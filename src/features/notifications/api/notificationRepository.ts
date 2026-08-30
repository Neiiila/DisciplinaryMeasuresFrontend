import { httpClient } from '@/shared/api/httpClient'
import type { AppNotification } from '@/features/notifications/types'

export const notificationRepository = {
  async getForUser(userId: string): Promise<AppNotification[]> {
    const { data } = await httpClient.get<AppNotification[]>('/Notifications', { params: { id: userId } })
    return data
  },
}
