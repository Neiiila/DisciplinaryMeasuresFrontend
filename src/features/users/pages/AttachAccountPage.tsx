import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import type { Employee } from '@/features/employees/types'
import { userRepository } from '@/features/users/api/userRepository'
import { ACCOUNT_STATUSES } from '@/features/users/types'
import { ROLES } from '@/shared/config/roles'
import { buildCompanyEmailSchema } from '@/shared/lib/companyValidation'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

const schema = z.object({
  employeeId: z.string().min(1, 'Select an employee.'),
  email: buildCompanyEmailSchema(),
  password: z.string().min(8, 'At least 8 characters.'),
  accountStatus: z.string(),
  role: z.string(),
  sendCredentials: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function AttachAccountPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { accountStatus: 'Active', role: ROLES.GUEST, sendCredentials: false },
  })

  useEffect(() => {
    employeeRepository.getAll().then(setEmployees)
  }, [])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      await userRepository.attachAccount({
        employeeId: values.employeeId,
        email: values.email,
        password: values.password,
        accountStatus: values.accountStatus as (typeof ACCOUNT_STATUSES)[number],
        role: values.role,
        sendCredentials: values.sendCredentials,
      })
      toast.success('Account attached')
      navigate('/dashboard/users')
    } catch (error) {
      toast.error('Could not attach account', getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Attach account</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stacked-form">
        <div className="field">
          <label htmlFor="employeeId">Employee</label>
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="employeeId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={employees.map((e) => ({ label: `${e.firstName} ${e.lastName} (${e.id})`, value: e.id }))}
                filter
                placeholder="Select an employee"
              />
            )}
          />
          {errors.employeeId && <small className="field-error">{errors.employeeId.message}</small>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="email">Email</label>
            <InputText id="email" {...register('email')} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <Password inputId="password" feedback={false} toggleMask {...register('password')} />
            {errors.password && <small className="field-error">{errors.password.message}</small>}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="accountStatus">Status</label>
            <Controller
              name="accountStatus"
              control={control}
              render={({ field }) => (
                <Dropdown id="accountStatus" value={field.value} onChange={(e) => field.onChange(e.value)} options={[...ACCOUNT_STATUSES]} />
              )}
            />
          </div>
          <div className="field">
            <label htmlFor="role">Role</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Dropdown id="role" value={field.value} onChange={(e) => field.onChange(e.value)} options={Object.values(ROLES)} />
              )}
            />
          </div>
          <div className="field checkbox-field">
            <Controller
              name="sendCredentials"
              control={control}
              render={({ field }) => (
                <Checkbox inputId="sendCredentials" checked={field.value} onChange={(e) => field.onChange(e.checked)} />
              )}
            />
            <label htmlFor="sendCredentials">Email credentials to the employee</label>
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" label="Attach account" loading={isSubmitting} />
        </div>
      </form>
    </div>
  )
}
