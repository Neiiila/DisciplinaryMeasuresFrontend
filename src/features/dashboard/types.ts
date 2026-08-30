export interface OverviewStatistics {
  totalEmployees: number
  totalRequests: number
  totalMeetings: number
  totalUsers: number
}

export interface DailyRequestCount {
  date: string
  count: number
  businessUnit?: string
}

export interface StatusCount {
  status: string
  count: number
}

export interface MonthlyDecisionCount {
  month: number
  status: string
  count: number
}
