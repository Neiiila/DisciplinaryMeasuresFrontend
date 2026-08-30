import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'
import { buildEmployeeIdSchema, buildCompanyEmailSchema } from '@/shared/lib/companyValidation'

const schema = z
  .object({
    id: buildEmployeeIdSchema(),
    email: buildCompanyEmailSchema(),
    firstName: z.string().min(1, 'Required.').regex(/^[a-zA-Z\s-]+$/, 'Letters only.'),
    lastName: z.string().min(1, 'Required.').regex(/^[a-zA-Z\s-]+$/, 'Letters only.'),
    password: z
      .string()
      .min(8, 'At least 8 characters.')
      .regex(/[a-zA-Z]/, 'Must contain a letter.')
      .regex(/\d/, 'Must contain a digit.'),
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'Passwords do not match.',
    path: ['passwordConfirmation'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const registerAccount = useAuthStore((state) => state.register)
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      await registerAccount(values)
      toast.success('Account created', 'You can now sign in.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error('Registration failed', getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create an account</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
          <div className="field-row">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <InputText id="firstName" {...register('firstName')} />
              {errors.firstName && <small className="field-error">{errors.firstName.message}</small>}
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <InputText id="lastName" {...register('lastName')} />
              {errors.lastName && <small className="field-error">{errors.lastName.message}</small>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="id">Employee id</label>
            <InputText id="id" {...register('id')} />
            {errors.id && <small className="field-error">{errors.id.message}</small>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <InputText id="email" {...register('email')} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <Password inputId="password" feedback={false} toggleMask {...register('password')} />
              {errors.password && <small className="field-error">{errors.password.message}</small>}
            </div>
            <div className="field">
              <label htmlFor="passwordConfirmation">Confirm password</label>
              <Password
                inputId="passwordConfirmation"
                feedback={false}
                toggleMask
                {...register('passwordConfirmation')}
              />
              {errors.passwordConfirmation && (
                <small className="field-error">{errors.passwordConfirmation.message}</small>
              )}
            </div>
          </div>

          <Button type="submit" label="Register" loading={isSubmitting} className="w-full" />
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
