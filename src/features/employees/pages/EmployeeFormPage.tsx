import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { FileUpload, type FileUploadHandlerEvent } from 'primereact/fileupload'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import { userRepository } from '@/features/users/api/userRepository'
import { ACCOUNT_STATUSES } from '@/features/users/types'
import { ROLES } from '@/shared/config/roles'
import { buildEmployeeIdSchema, buildCompanyEmailSchema } from '@/shared/lib/companyValidation'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

const GENDERS = ['Male', 'Female']

const employeeSchema = z.object({
  id: buildEmployeeIdSchema(),
  cin: z.string().min(1, 'Required.'),
  gender: z.string().min(1, 'Required.'),
  firstName: z.string().min(1, 'Required.'),
  lastName: z.string().min(1, 'Required.'),
  address: z.string().min(1, 'Required.'),
  phone: z.string().min(1, 'Required.'),
  status: z.string().min(1, 'Required.'),
  position: z.string().min(1, 'Required.'),
  site: z.string().min(1, 'Required.'),
  department: z.string().min(1, 'Required.'),
  businessUnit: z.string().min(1, 'Required.'),
  segment: z.string().min(1, 'Required.'),
  localJobTitle: z.string().min(1, 'Required.'),
  hiringDate: z.string().min(1, 'Required.'),
  contractType: z.string().min(1, 'Required.'),
  supervisor: z.string().nullable(),
  withAccount: z.boolean(),
  accountEmail: z.union([buildCompanyEmailSchema(), z.literal('')]),
  accountStatus: z.string(),
  accountPassword: z.string(),
  accountRole: z.string(),
  sendCredentials: z.boolean(),
})

type FormValues = z.infer<typeof employeeSchema>

const emptyValues: FormValues = {
  id: '',
  cin: '',
  gender: '',
  firstName: '',
  lastName: '',
  address: '',
  phone: '',
  status: 'Active',
  position: '',
  site: '',
  department: '',
  businessUnit: '',
  segment: '',
  localJobTitle: '',
  hiringDate: '',
  contractType: 'Permanent',
  supervisor: null,
  withAccount: false,
  accountEmail: '',
  accountStatus: 'Active',
  accountPassword: '',
  accountRole: ROLES.GUEST,
  sendCredentials: false,
}

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const [photo, setPhoto] = useState<File | null>(null)
  const [supervisors, setSupervisors] = useState<{ id: string; name: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(employeeSchema), defaultValues: emptyValues })

  const withAccount = watch('withAccount')

  useEffect(() => {
    employeeRepository.getAll().then((employees) =>
      setSupervisors(employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))),
    )
  }, [])

  useEffect(() => {
    if (!id) return
    employeeRepository.getById(id).then((employee) =>
      reset({
        ...emptyValues,
        ...employee,
      }),
    )
  }, [id, reset])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const employee = { ...values, email: values.accountEmail }
      if (isEditMode && id) {
        await userRepository.update(id, {
          employee: { ...employee, accountStatus: 'Active', role: '' },
          photo,
        })
        toast.success('Employee updated')
      } else {
        await userRepository.create({
          employee,
          account: values.withAccount
            ? {
                email: values.accountEmail,
                accountStatus: values.accountStatus as (typeof ACCOUNT_STATUSES)[number],
                password: values.accountPassword,
                role: values.accountRole,
              }
            : null,
          photo,
          sendCredentials: values.sendCredentials,
        })
        toast.success('Employee created')
      }
      navigate('/dashboard/employees')
    } catch (error) {
      toast.error('Save failed', getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit employee' : 'Add employee'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stacked-form">
        <div className="field-row">
          <div className="field">
            <label htmlFor="id">Employee id</label>
            <InputText id="id" {...register('id')} disabled={isEditMode} />
            {errors.id && <small className="field-error">{errors.id.message}</small>}
          </div>
          <div className="field">
            <label htmlFor="cin">National id (CIN)</label>
            <InputText id="cin" {...register('cin')} />
            {errors.cin && <small className="field-error">{errors.cin.message}</small>}
          </div>
        </div>

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
          <div className="field">
            <label htmlFor="gender">Gender</label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="gender"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={GENDERS}
                />
              )}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="address">Address</label>
            <InputText id="address" {...register('address')} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <InputText id="phone" {...register('phone')} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="position">Position</label>
            <InputText id="position" {...register('position')} />
          </div>
          <div className="field">
            <label htmlFor="site">Site</label>
            <InputText id="site" {...register('site')} />
          </div>
          <div className="field">
            <label htmlFor="department">Department</label>
            <InputText id="department" {...register('department')} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="businessUnit">Business unit</label>
            <InputText id="businessUnit" {...register('businessUnit')} />
          </div>
          <div className="field">
            <label htmlFor="segment">Segment</label>
            <InputText id="segment" {...register('segment')} />
          </div>
          <div className="field">
            <label htmlFor="localJobTitle">Job title</label>
            <InputText id="localJobTitle" {...register('localJobTitle')} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="hiringDate">Hiring date</label>
            <InputText id="hiringDate" type="date" {...register('hiringDate')} />
          </div>
          <div className="field">
            <label htmlFor="contractType">Contract type</label>
            <InputText id="contractType" {...register('contractType')} />
          </div>
          <div className="field">
            <label htmlFor="supervisor">Supervisor</label>
            <Controller
              name="supervisor"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="supervisor"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={supervisors}
                  optionLabel="name"
                  optionValue="id"
                  showClear
                  filter
                />
              )}
            />
          </div>
          <div className="field">
            <label htmlFor="photo">Photo</label>
            <FileUpload
              mode="basic"
              accept="image/*"
              chooseLabel="Upload photo"
              customUpload
              uploadHandler={(event: FileUploadHandlerEvent) => setPhoto(event.files[0] ?? null)}
            />
          </div>
        </div>

        {!isEditMode && (
          <>
            <div className="field checkbox-field">
              <Controller
                name="withAccount"
                control={control}
                render={({ field }) => (
                  <Checkbox inputId="withAccount" checked={field.value} onChange={(e) => field.onChange(e.checked)} />
                )}
              />
              <label htmlFor="withAccount">Create a login account for this employee</label>
            </div>

            {withAccount && (
              <fieldset className="sub-form">
                <legend>Account</legend>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="accountEmail">Email</label>
                    <InputText id="accountEmail" {...register('accountEmail')} />
                    {errors.accountEmail && <small className="field-error">{errors.accountEmail.message}</small>}
                  </div>
                  <div className="field">
                    <label htmlFor="accountPassword">Password</label>
                    <Password inputId="accountPassword" feedback={false} toggleMask {...register('accountPassword')} />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="accountStatus">Status</label>
                    <Controller
                      name="accountStatus"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          id="accountStatus"
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          options={[...ACCOUNT_STATUSES]}
                        />
                      )}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="accountRole">Role</label>
                    <Controller
                      name="accountRole"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          id="accountRole"
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                          options={Object.values(ROLES)}
                        />
                      )}
                    />
                  </div>
                  <div className="field checkbox-field">
                    <Controller
                      name="sendCredentials"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          inputId="sendCredentials"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.checked)}
                        />
                      )}
                    />
                    <label htmlFor="sendCredentials">Email credentials to the employee</label>
                  </div>
                </div>
              </fieldset>
            )}
          </>
        )}

        <div className="form-actions">
          <Button type="submit" label={isEditMode ? 'Save changes' : 'Create employee'} loading={isSubmitting} />
        </div>
      </form>
    </div>
  )
}
