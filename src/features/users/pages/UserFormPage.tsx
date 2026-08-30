import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { FileUpload, type FileUploadHandlerEvent } from 'primereact/fileupload'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Password } from 'primereact/password'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import { userRepository } from '@/features/users/api/userRepository'
import type { UserSummary } from '@/features/users/types'
import { toApiError } from '@/shared/api/apiError'
import { ROLES, ROLE_LABELS, type Role } from '@/shared/config/roles'
import { companyEmailSchema, employeeIdSchema } from '@/shared/lib/companyValidation'
import { useToast } from '@/shared/ui/ToastProvider'

const GENDERS = ['Female', 'Male', 'Other']

const schema = z.object({
  id: employeeIdSchema(),
  firstName: z.string().min(1, 'Required.'),
  lastName: z.string().min(1, 'Required.'),
  cin: z.string(),
  email: z.union([companyEmailSchema(), z.literal('')]),
  password: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  gender: z.string(),
  supervisorId: z.string(),
  role: z.string(),
  hiringDate: z.string(),
  status: z.string(),
  contractType: z.string(),
  position: z.string(),
  localJobTitle: z.string(),
  siteCode: z.string(),
  site: z.string(),
  department: z.string(),
  businessUnit: z.string(),
  segment: z.string(),
})

type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = {
  id: '',
  firstName: '',
  lastName: '',
  cin: '',
  email: '',
  password: '',
  address: '',
  phoneNumber: '',
  gender: '',
  supervisorId: '',
  role: ROLES.EMPLOYEE,
  hiringDate: '',
  status: '',
  contractType: '',
  position: '',
  localJobTitle: '',
  siteCode: '',
  site: '',
  department: '',
  businessUnit: '',
  segment: '',
}

/** Empty strings are how the form represents "not set"; the API wants null. */
const orNull = (value: string) => (value.trim() === '' ? null : value.trim())

export function UserFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const [supervisors, setSupervisors] = useState<UserSummary[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    employeeRepository.getAll().then(setSupervisors).catch(() => setSupervisors([]))
  }, [])

  useEffect(() => {
    if (!id) return

    userRepository
      .getById(id)
      .then((user) =>
        reset({
          ...EMPTY,
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          cin: user.cin ?? '',
          email: user.email ?? '',
          address: user.address ?? '',
          phoneNumber: user.phoneNumber ?? '',
          gender: user.gender ?? '',
          supervisorId: user.supervisorId ?? '',
          role: user.role,
          hiringDate: user.employment.hiringDate ?? '',
          status: user.employment.status ?? '',
          contractType: user.employment.contractType ?? '',
          position: user.employment.position ?? '',
          localJobTitle: user.employment.localJobTitle ?? '',
          siteCode: user.employment.siteCode ?? '',
          site: user.employment.site ?? '',
          department: user.employment.department ?? '',
          businessUnit: user.employment.businessUnit ?? '',
          segment: user.employment.segment ?? '',
        }),
      )
      .catch((error) => toast.error('Could not load the user', toApiError(error).message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reset])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    const employment = {
      hiringDate: orNull(values.hiringDate),
      status: orNull(values.status),
      contractType: orNull(values.contractType),
      position: orNull(values.position),
      localJobTitle: orNull(values.localJobTitle),
      siteCode: orNull(values.siteCode),
      site: orNull(values.site),
      department: orNull(values.department),
      businessUnit: orNull(values.businessUnit),
      segment: orNull(values.segment),
    }

    const common = {
      firstName: values.firstName,
      lastName: values.lastName,
      cin: orNull(values.cin),
      email: orNull(values.email),
      address: orNull(values.address),
      phoneNumber: orNull(values.phoneNumber),
      gender: orNull(values.gender),
      supervisorId: orNull(values.supervisorId),
      role: values.role as Role,
      employment,
    }

    try {
      if (isEdit && id) {
        await userRepository.update(id, common, photo)
        toast.success('User updated')
      } else {
        await userRepository.create({ ...common, id: values.id, password: orNull(values.password) }, photo)
        toast.success('User created')
      }
      navigate('/dashboard/users')
    } catch (error) {
      toast.error('Save failed', toApiError(error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit user' : 'Add user'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stacked-form">
        {!isEdit && (
          <Message
            severity="info"
            text="Supplying a password opens a sign-in account straight away. Leave it blank to create an employee record only — an account can be opened later."
          />
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="id">Matriculation number</label>
            <InputText id="id" disabled={isEdit} {...register('id')} />
            {errors.id && <small className="field-error">{errors.id.message}</small>}
          </div>
          <div className="field">
            <label htmlFor="cin">National id</label>
            <InputText id="cin" {...register('cin')} />
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
                  onChange={(e) => field.onChange(e.value ?? '')}
                  options={GENDERS}
                  showClear
                />
              )}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="email">Email</label>
            <InputText id="email" {...register('email')} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </div>
          {!isEdit && (
            <div className="field">
              <label htmlFor="password">Password (optional)</label>
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
            </div>
          )}
          <div className="field">
            <label htmlFor="role">Role</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="role"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={Object.values(ROLES).map((role) => ({ label: ROLE_LABELS[role], value: role }))}
                />
              )}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="phoneNumber">Phone</label>
            <InputText id="phoneNumber" {...register('phoneNumber')} />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <InputText id="address" {...register('address')} />
          </div>
          <div className="field">
            <label htmlFor="supervisorId">Supervisor</label>
            <Controller
              name="supervisorId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="supervisorId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value ?? '')}
                  options={supervisors.map((s) => ({ label: `${s.fullName} (${s.id})`, value: s.id }))}
                  filter
                  showClear
                  placeholder="None"
                />
              )}
            />
          </div>
        </div>

        <fieldset className="sub-form">
          <legend>Employment</legend>
          <div className="field-row">
            <div className="field">
              <label htmlFor="hiringDate">Hiring date</label>
              <InputText id="hiringDate" type="date" {...register('hiringDate')} />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <InputText id="status" {...register('status')} />
            </div>
            <div className="field">
              <label htmlFor="contractType">Contract type</label>
              <InputText id="contractType" {...register('contractType')} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="position">Position</label>
              <InputText id="position" {...register('position')} />
            </div>
            <div className="field">
              <label htmlFor="localJobTitle">Job title</label>
              <InputText id="localJobTitle" {...register('localJobTitle')} />
            </div>
            <div className="field">
              <label htmlFor="department">Department</label>
              <InputText id="department" {...register('department')} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="site">Site</label>
              <InputText id="site" {...register('site')} />
            </div>
            <div className="field">
              <label htmlFor="siteCode">Site code</label>
              <InputText id="siteCode" {...register('siteCode')} />
            </div>
            <div className="field">
              <label htmlFor="businessUnit">Business unit</label>
              <InputText id="businessUnit" {...register('businessUnit')} />
            </div>
            <div className="field">
              <label htmlFor="segment">Segment</label>
              <InputText id="segment" {...register('segment')} />
            </div>
          </div>
        </fieldset>

        <div className="field">
          <label>Photo</label>
          <FileUpload
            mode="basic"
            accept="image/*"
            customUpload
            auto
            chooseLabel={photo ? photo.name : 'Upload a photo'}
            uploadHandler={(event: FileUploadHandlerEvent) => setPhoto(event.files[0] ?? null)}
          />
        </div>

        <div className="form-actions">
          <Button type="submit" label={isEdit ? 'Save changes' : 'Create user'} loading={isSubmitting} />
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            outlined
            onClick={() => navigate('/dashboard/users')}
          />
        </div>
      </form>
    </div>
  )
}
