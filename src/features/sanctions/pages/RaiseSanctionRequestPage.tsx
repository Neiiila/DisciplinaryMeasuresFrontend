import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { FileUpload, type FileUploadHandlerEvent } from 'primereact/fileupload'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Message } from 'primereact/message'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { employeeRepository } from '@/features/employees/api/employeeRepository'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import type { Fault } from '@/features/sanctions/types'
import type { UserSummary } from '@/features/users/types'
import { toApiError } from '@/shared/api/apiError'
import { useToast } from '@/shared/ui/ToastProvider'

/** Sentinel for "the fault I need is not in the catalogue". */
const PROPOSE_NEW = 'propose-new'

const schema = z
  .object({
    employeeId: z.string().min(1, 'Choose the employee this concerns.'),
    faultChoice: z.string().min(1, 'Choose a fault.'),
    proposedTitle: z.string(),
    proposedCategory: z.string(),
    description: z.string().min(1, 'A description is required.'),
    details: z.string(),
  })
  .refine((values) => values.faultChoice !== PROPOSE_NEW || values.proposedTitle.trim().length > 0, {
    message: 'Give the proposed fault a title.',
    path: ['proposedTitle'],
  })

type FormValues = z.infer<typeof schema>

export function RaiseSanctionRequestPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [employees, setEmployees] = useState<UserSummary[]>([])
  const [faults, setFaults] = useState<Fault[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      faultChoice: '',
      proposedTitle: '',
      proposedCategory: '',
      description: '',
      details: '',
    },
  })

  const isProposing = watch('faultChoice') === PROPOSE_NEW

  useEffect(() => {
    employeeRepository
      .getAll()
      .then(setEmployees)
      .catch((error) => toast.error('Could not load employees', toApiError(error).message))

    sanctionRepository
      .getFaults()
      .then(setFaults)
      .catch((error) => toast.error('Could not load the fault catalogue', toApiError(error).message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      // The API requires exactly one of faultId / proposedFault.
      const proposing = values.faultChoice === PROPOSE_NEW

      await sanctionRepository.raise({
        employeeId: values.employeeId,
        description: values.description,
        details: values.details,
        faultId: proposing ? null : Number(values.faultChoice),
        proposedFault: proposing
          ? { title: values.proposedTitle.trim(), category: values.proposedCategory.trim() }
          : null,
        attachment,
      })

      toast.success('Request raised', 'It is now with the first validator in the chain.')
      navigate('/dashboard/sanctions/mine')
    } catch (error) {
      toast.error('Could not raise the request', toApiError(error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Raise a sanction request</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="stacked-form">
        <Message
          severity="info"
          text="The request is raised in your name and routed to the employee's supervisor chain for approval."
        />

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
                options={employees.map((employee) => ({
                  label: `${employee.fullName} (${employee.id})`,
                  value: employee.id,
                }))}
                filter
                placeholder="Select an employee"
              />
            )}
          />
          {errors.employeeId && <small className="field-error">{errors.employeeId.message}</small>}
        </div>

        <div className="field">
          <label htmlFor="faultChoice">Fault</label>
          <Controller
            name="faultChoice"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="faultChoice"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={[
                  ...faults.map((fault) => ({
                    label: `${fault.title} — ${fault.category}`,
                    value: String(fault.id),
                  })),
                  { label: 'Not listed — propose a new fault', value: PROPOSE_NEW },
                ]}
                filter
                placeholder="Select a fault"
              />
            )}
          />
          {errors.faultChoice && <small className="field-error">{errors.faultChoice.message}</small>}
        </div>

        {isProposing && (
          <fieldset className="sub-form">
            <legend>Proposed fault</legend>
            <p className="muted">
              A proposed fault is recorded unvalidated and has to be confirmed by an administrator before it
              joins the catalogue.
            </p>
            <div className="field-row">
              <div className="field">
                <label htmlFor="proposedTitle">Title</label>
                <InputText id="proposedTitle" {...register('proposedTitle')} />
                {errors.proposedTitle && (
                  <small className="field-error">{errors.proposedTitle.message}</small>
                )}
              </div>
              <div className="field">
                <label htmlFor="proposedCategory">Category</label>
                <InputText id="proposedCategory" {...register('proposedCategory')} />
              </div>
            </div>
          </fieldset>
        )}

        <div className="field">
          <label htmlFor="description">Description</label>
          <InputTextarea id="description" rows={3} {...register('description')} />
          {errors.description && <small className="field-error">{errors.description.message}</small>}
        </div>

        <div className="field">
          <label htmlFor="details">Further details (optional)</label>
          <InputTextarea id="details" rows={4} {...register('details')} />
        </div>

        <div className="field">
          <label>Attachment (optional)</label>
          <FileUpload
            mode="basic"
            customUpload
            auto
            chooseLabel={attachment ? attachment.name : 'Attach a file'}
            uploadHandler={(event: FileUploadHandlerEvent) => setAttachment(event.files[0] ?? null)}
          />
        </div>

        <div className="form-actions">
          <Button type="submit" label="Raise request" loading={isSubmitting} />
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            outlined
            onClick={() => navigate('/dashboard/sanctions/mine')}
          />
        </div>
      </form>
    </div>
  )
}
