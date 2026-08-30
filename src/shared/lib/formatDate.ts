import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

/** Formats an ISO timestamp for display, tolerating nulls and bad input. */
export function formatDate(value: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!value) return '—'
  const date = parseISO(value)
  return isValid(date) ? format(date, pattern) : '—'
}

export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value, 'd MMM yyyy HH:mm')
}

/** "3 hours ago" for recent timestamps, an absolute date beyond a day. */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseISO(value)
  if (!isValid(date)) return '—'

  const ageMs = Date.now() - date.getTime()
  const oneDayMs = 24 * 60 * 60 * 1000

  return ageMs < oneDayMs && ageMs >= 0
    ? formatDistanceToNow(date, { addSuffix: true })
    : format(date, 'd MMM yyyy HH:mm')
}
