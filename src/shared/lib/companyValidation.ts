import { z } from 'zod'
import { env } from '@/shared/config/env'

/**
 * The legacy app baked its employer's identifier convention ("must start
 * with `te`") and email domain ("must end with `@te.com`") directly into
 * regular expressions inside components and a "generic" validator helper.
 * That made the whole codebase non-reusable outside of that one company.
 *
 * Here the convention is read from configuration (`VITE_EMPLOYEE_ID_PREFIX`,
 * `VITE_COMPANY_EMAIL_DOMAIN`) and only enforced when a value is actually
 * configured, so the same build works for any organization.
 */
export function buildEmployeeIdSchema() {
  let schema = z.string().min(1, 'Employee id is required.')
  if (env.employeeIdPrefix) {
    schema = schema.regex(
      new RegExp(`^${escapeRegExp(env.employeeIdPrefix)}`, 'i'),
      `Must start with "${env.employeeIdPrefix}".`,
    )
  }
  return schema
}

export function buildCompanyEmailSchema() {
  let schema = z.string().email('Enter a valid email address.')
  if (env.companyEmailDomain) {
    schema = schema.refine((value) => value.toLowerCase().endsWith(`@${env.companyEmailDomain.toLowerCase()}`), {
      message: `Email must end with "@${env.companyEmailDomain}".`,
    })
  }
  return schema
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
