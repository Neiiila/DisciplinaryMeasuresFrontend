import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { FileUpload, type FileUploadHandlerEvent } from 'primereact/fileupload'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store/authStore'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import type { Employee } from '@/features/employees/types'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import type { Fault } from '@/features/sanctions/types'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useToast } from '@/shared/ui/ToastProvider'

const NEW_FAULT_OPTION = '__new__'

const schema = z.object({
  employeeId: z.string().min(1, 'Select an employee.'),
  faultId: z.string().min(1, 'Select a fault.'),
  newFaultTitle: z.string().optional(),
  newFaultTitleAr: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  requestDate: z.string().min(1, 'Required.'),
})

type FormValues = z.infer<typeof schema>

export function AddSanctionRequestPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const toast = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [faults, setFaults] = useState<Fault[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { requestDate: new Date().toISOString().slice(0, 10) },
  })

  const faultId = watch('faultId')
  const isNewFault = faultId === NEW_FAULT_OPTION

  useEffect(() => {
    employeeRepository.getAll().then(setEmployees)
    sanctionRepository.getFaults().then(setFaults)
  }, [])

  async function onSubmit(values: FormValues) {
    if (!user) return
    setIsSubmitting(true)
    try {
      const fault: Fault = isNewFault
        ? { title: values.newFaultTitle ?? '', titleAr: values.newFaultTitleAr ?? '', isValidated: false }
        : (faults.find((f) => String(f.id) === values.faultId) as Fault)

      await sanctionRepository.create({
        employeeId: values.employeeId,
        requesterId: user.userId,
        fault,
        isNewFault,
        description: values.description,
        requestDate: values.requestDate,
        details: '',
        files,
      })
      toast.success('Sanction request submitted')
      navigate('/dashboard/sanctions/mine')
    } catch (error) {
      toast.error('Submission failed', getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>New sanction request</h1>
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

        <div className="field">
          <label htmlFor="faultId">Fault</label>
          <Controller
            name="faultId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="faultId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={[
                  ...faults.map((f) => ({ label: f.title, value: String(f.id) })),
                  { label: 'Other (describe below)', value: NEW_FAULT_OPTION },
                ]}
                filter
                placeholder="Select a fault"
              />
            )}
          />
          {errors.faultId && <small className="field-error">{errors.faultId.message}</small>}
        </div>

        {isNewFault && (
          <div className="field-row">
            <div className="field">
              <label htmlFor="newFaultTitle">Fault title</label>
              <InputTextarea id="newFaultTitle" rows={1} {...register('newFaultTitle')} />
            </div>
            <div className="field">
              <label htmlFor="newFaultTitleAr">Fault title (Arabic)</label>
              <InputTextarea id="newFaultTitleAr" rows={1} dir="rtl" {...register('newFaultTitleAr')} />
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="description">Description</label>
          <InputTextarea id="description" rows={4} {...register('description')} />
          {errors.description && <small className="field-error">{errors.description.message}</small>}
        </div>

        <div className="field">
          <label htmlFor="requestDate">Date</label>
          <input id="requestDate" type="date" className="p-inputtext" {...register('requestDate')} />
        </div>

        <div className="field">
          <label htmlFor="attachments">Attachments</label>
          <FileUpload
            multiple
            customUpload
            uploadHandler={(event: FileUploadHandlerEvent) => setFiles(event.files)}
            chooseLabel="Add files"
          />
        </div>

        <div className="form-actions">
          <Button type="submit" label="Submit request" loading={isSubmitting} />
        </div>
      </form>
    </div>
  )
}
