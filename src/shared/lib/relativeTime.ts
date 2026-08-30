import { formatDistanceToNow, differenceInDays, format } from 'date-fns'

export function toRelativeTime(dateTime: string | Date): string {
  const date = new Date(dateTime)
  if (Math.abs(differenceInDays(new Date(), date)) >= 1) {
    return format(date, 'MMM d, yyyy HH:mm')
  }
  return formatDistanceToNow(date, { addSuffix: true })
}
