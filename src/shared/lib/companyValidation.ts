import { z } from 'zod'
import { env } from '@/shared/config/env'

/**
 * The legacy codebase baked its employer's conventions into regular
 * expressions scattered across components: identifiers had to match `^te`
 * and emails `@te\.com$`. That made the application unusable anywhere else.
 *
 * Both rules are now configuration, and each is only enforced when a value
 * is actually set — so the default build accepts any identifier and any
 * email domain.
 */
export function employeeIdSchema() {
  const base = z.string().min(1, 'Matriculation number is required.')

  if (!env.employeeIdPrefix) return base

  return base.regex(
    new RegExp(`^${escapeRegExp(env.employeeIdPrefix)}`, 'i'),
    `Must start with "${env.employeeIdPrefix}".`,
  )
}

export function companyEmailSchema() {
  const base = z.string().email('Enter a valid email address.')

  if (!env.companyEmailDomain) return base

  const domain = env.companyEmailDomain.toLowerCase()

  return base.refine((value) => value.toLowerCase().endsWith(`@${domain}`), {
    message: `Email must end with "@${env.companyEmailDomain}".`,
  })
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
