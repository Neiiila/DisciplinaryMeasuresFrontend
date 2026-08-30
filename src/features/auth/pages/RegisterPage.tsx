import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Password } from 'primereact/password'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store/authStore'
import { toApiError } from '@/shared/api/apiError'
import { companyEmailSchema, employeeIdSchema } from '@/shared/lib/companyValidation'

const schema = z
  .object({
    id: employeeIdSchema(),
    firstName: z.string().min(1, 'Required.'),
    lastName: z.string().min(1, 'Required.'),
    email: companyEmailSchema(),
    cin: z.string(),
    phoneNumber: z.string(),
    address: z.string(),
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      cin: '',
      phoneNumber: '',
      address: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsSubmitting(true)
    try {
      await registerAccount({
        id: values.id,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        cin: values.cin || null,
        phoneNumber: values.phoneNumber || null,
        address: values.address || null,
      })
      setSubmitted(true)
    } catch (error) {
      setServerError(toApiError(error, 'Registration failed.').message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Registration issues no token: the account is created Pending and an
  // administrator has to activate it, so there is nowhere to navigate to.
  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Account created</h1>
          <Message
            severity="info"
            text="Your account is awaiting activation by an administrator. You will be able to sign in once it has been approved."
          />
          <p className="auth-footer">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
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

          <div className="field-row">
            <div className="field">
              <label htmlFor="id">Matriculation number</label>
              <InputText id="id" {...register('id')} />
              {errors.id && <small className="field-error">{errors.id.message}</small>}
            </div>
            <div className="field">
              <label htmlFor="cin">National id (optional)</label>
              <InputText id="cin" {...register('cin')} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <InputText id="email" {...register('email')} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="phoneNumber">Phone (optional)</label>
              <InputText id="phoneNumber" {...register('phoneNumber')} />
            </div>
            <div className="field">
              <label htmlFor="address">Address (optional)</label>
              <InputText id="address" {...register('address')} />
            </div>
          </div>

          <div className="field-row">
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
              {errors.password && <small className="field-error">{errors.password.message}</small>}
            </div>
            <div className="field">
              <label htmlFor="passwordConfirmation">Confirm password</label>
              <Controller
                name="passwordConfirmation"
                control={control}
                render={({ field }) => (
                  <Password
                    inputId="passwordConfirmation"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    feedback={false}
                    toggleMask
                  />
                )}
              />
              {errors.passwordConfirmation && (
                <small className="field-error">{errors.passwordConfirmation.message}</small>
              )}
            </div>
          </div>

          {serverError && (
            <div className="field-error server-error" role="alert">
              {serverError}
            </div>
          )}

          <Button type="submit" label="Register" loading={isSubmitting} className="w-full" />
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
