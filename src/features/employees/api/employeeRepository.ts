import { httpClient } from '@/shared/api/httpClient'
import type { ArabicProfile, UserSummary } from '@/features/users/types'

/**
 * The employee directory is read-only and unscoped: any authenticated user
 * may list employees, which is what the request form's picker needs.
 *
 * Note there is no business-unit filtering here. The legacy API exposed
 * `/api/Employee/BU?bu=...` and the client chose between it and the unscoped
 * list based on the caller's role; the current backend has no such endpoint
 * and no business-unit claim on the token, so that branch is gone.
 */
export const employeeRepository = {
  async getAll(): Promise<UserSummary[]> {
    const { data } = await httpClient.get<UserSummary[]>('/api/employees')
    return data
  },

  /** Creates or replaces an employee's Arabic-script profile. Administrators only. */
  async setArabicProfile(id: string, profile: ArabicProfile): Promise<ArabicProfile> {
    const { data } = await httpClient.put<ArabicProfile>(`/api/employees/${id}/arabic-profile`, profile)
    return data
  },
}
