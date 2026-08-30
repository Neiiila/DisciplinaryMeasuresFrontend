/**
 * Central place for every environment-driven value the app needs.
 *
 * The legacy Angular app hardcoded `https://localhost:7155` inside every
 * single service file, plus a scattering of company-specific literals
 * ("TE Connectivity", the "te" id prefix, the "@te.com" email domain).
 * Reading everything through this one module means a deployment only ever
 * needs to change `.env`, never application code.
 */
export const env = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7155'),
  whatsappServiceUrl: normalizeBaseUrl(
    import.meta.env.VITE_WHATSAPP_SERVICE_URL ?? 'http://localhost:3000',
  ),
  companyName: import.meta.env.VITE_COMPANY_NAME ?? 'Your Company',
  employeeIdPrefix: import.meta.env.VITE_EMPLOYEE_ID_PREFIX ?? '',
  companyEmailDomain: import.meta.env.VITE_COMPANY_EMAIL_DOMAIN ?? '',
} as const

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}
