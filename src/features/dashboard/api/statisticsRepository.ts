import { httpClient } from '@/shared/api/httpClient'
import type {
  DailyRequestCount,
  MonthlyDecisionCount,
  OverviewStatistics,
  StatusCount,
} from '@/features/dashboard/types'

export const statisticsRepository = {
  async getOverview(): Promise<OverviewStatistics> {
    const { data } = await httpClient.get<OverviewStatistics>('/api/Statistics')
    return data
  },

  async getDailyRequests(from: string, to: string): Promise<DailyRequestCount[]> {
    const { data } = await httpClient.get<DailyRequestCount[]>('/api/Statistics/dailyRequestsPerPeriode', {
      params: { date1: from, date2: to },
    })
    return data
  },

  async getDailyRequestsByBusinessUnits(
    from: string,
    to: string,
    businessUnits: string[],
  ): Promise<DailyRequestCount[]> {
    const params = new URLSearchParams({ date1: from, date2: to })
    businessUnits.forEach((bu) => params.append('bus', bu))
    const { data } = await httpClient.get<DailyRequestCount[]>(
      `/api/Statistics/dailyRequestsPerPeriodePerBUs?${params.toString()}`,
    )
    return data
  },

  async getTotalRequestsByStatus(): Promise<StatusCount[]> {
    const { data } = await httpClient.get<StatusCount[]>('/api/Statistics/getTotalRequestByStatuses')
    return data
  },

  async getMonthlyDecisionCounts(year: number): Promise<MonthlyDecisionCount[]> {
    const { data } = await httpClient.get<MonthlyDecisionCount[]>(
      '/api/Statistics/getMonthlyDecisionCountsByStatus',
      { params: { year } },
    )
    return data
  },
}
