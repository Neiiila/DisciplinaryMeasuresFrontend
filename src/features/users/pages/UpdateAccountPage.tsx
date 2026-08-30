import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { userRepository } from '@/features/users/api/userRepository'
import { ACCOUNT_STATUSES } from '@/features/users/types'
import { ROLES } from '@/shared/config/roles'
import { buildCompanyEmailSchema } from '@/shared/lib/companyValidation'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

const schema = z.object({
  email: buildCompanyEmailSchema(),
  password: z.string(),
  accountStatus: z.string(),
  role: z.string(),
  sendCredentials: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function UpdateAccountPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', accountStatus: 'Active', role: ROLES.GUEST, sendCredentials: false },
  })

  useEffect(() => {
    if (!id) return
    userRepository.getById(id).then((account) =>
      reset({
        email: account.email,
        password: '',
        accountStatus: account.accountStatus,
        role: account.role,
        sendCredentials: false,
      }),
    )
  }, [id, reset])

  async function onSubmit(values: FormValues) {
    if (!id) return
    setIsSubmitting(true)
    try {
      await userRepository.updateAccount(id, {
        email: values.email,
        password: values.password,
        accountStatus: values.accountStatus as (typeof ACCOUNT_STATUSES)[number],
        role: values.role,
        sendCredentials: values.sendCredentials,
      })
      toast.success('Account updated')
      navigate('/dashboard/users')
    } catch (error) {
      toast.error('Update failed', getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function remove() {
    if (!id) return
    try {
      await userRepository.softRemove(id)
      toast.success('Account removed')
      navigate('/dashboard/users')
    } catch (error) {
      toast.error('Removal failed', getErrorMessage(error))
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Edit account</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stacked-form">
        <div className="field-row">
          <div className="field">
            <label htmlFor="email">Email</label>
            <InputText id="email" {...register('email')} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </div>
          <div className="field">
            <label htmlFor="password">New password (optional)</label>
            <Password inputId="password" feedback={false} toggleMask {...register('password')} />
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
          <Button type="submit" label="Save changes" loading={isSubmitting} />
          <Button type="button" label="Remove account" severity="danger" outlined onClick={remove} />
        </div>
      </form>
    </div>
  )
}
