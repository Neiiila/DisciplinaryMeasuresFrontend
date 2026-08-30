/**
 * Every environment-driven value the app needs, read once.
 *
 * The legacy Angular client hardcoded its API host in each of its fifteen
 * services, plus company-specific literals in component templates. Routing
 * all of that through this module means a deployment changes `.env`, never
 * application code.
 */
export const env = {
  apiBaseUrl: stripTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7113'),
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Your Company',
  employeeIdPrefix: import.meta.env.VITE_EMPLOYEE_ID_PREFIX ?? '',
  companyEmailDomain: import.meta.env.VITE_COMPANY_EMAIL_DOMAIN ?? '',
} as const

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/** Resolves a server-relative stored file path (photo, attachment) to an absolute URL. */
export function toAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${env.apiBaseUrl}/${path.replace(/^\//, '')}`
}
