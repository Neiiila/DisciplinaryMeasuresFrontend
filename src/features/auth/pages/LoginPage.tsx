import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Password } from 'primereact/password'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { env } from '@/shared/config/env'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your email or employee id.'),
  password: z.string().min(1, 'Enter your password.'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsSubmitting(true)
    try {
      await login(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Invalid credentials.'))
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
            <label htmlFor="identifier">Email or employee id</label>
            <InputText id="identifier" {...register('identifier')} autoFocus />
            {errors.identifier && <small className="field-error">{errors.identifier.message}</small>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <Password
              inputId="password"
              feedback={false}
              toggleMask
              {...register('password')}
            />
            {errors.password && <small className="field-error">{errors.password.message}</small>}
          </div>

          {serverError && <div className="field-error server-error">{serverError}</div>}

          <Button type="submit" label="Sign in" loading={isSubmitting} className="w-full" />
        </form>

        <p className="auth-footer">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
