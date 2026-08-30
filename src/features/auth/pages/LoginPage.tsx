import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store/authStore'
import { toApiError } from '@/shared/api/apiError'
import { env } from '@/shared/config/env'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your matriculation number or email.'),
  password: z.string().min(1, 'Enter your password.'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsSubmitting(true)
    try {
      await login(values)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from ?? '/dashboard', { replace: true })
    } catch (error) {
      // A 403 here means the account exists but is Pending or Revoked, which
      // is worth saying plainly rather than as a generic failure.
      setServerError(toApiError(error, 'Sign-in failed.').message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{env.companyName}</h1>
        <p className="auth-subtitle">Sign in to Disciplinary Measures</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
          <div className="field">
            <label htmlFor="identifier">Matriculation number or email</label>
            <InputText id="identifier" autoFocus {...register('identifier')} />
            {errors.identifier && (
              <small className="field-error" role="alert">
                {errors.identifier.message}
              </small>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Password
                  inputId="password"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  feedback={false}
                  toggleMask
                />
              )}
            />
            {errors.password && (
              <small className="field-error" role="alert">
                {errors.password.message}
              </small>
            )}
          </div>

          {serverError && (
            <div className="field-error server-error" role="alert">
              {serverError}
            </div>
          )}

          <Button type="submit" label="Sign in" loading={isSubmitting} className="w-full" />
        </form>

        <p className="auth-footer">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
