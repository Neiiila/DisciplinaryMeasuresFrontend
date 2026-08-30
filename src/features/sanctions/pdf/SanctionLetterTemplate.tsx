import { forwardRef } from 'react'
import { env } from '@/shared/config/env'
import { DECISION_LABELS } from '@/features/sanctions/pdf/decisionLabels'
import type { SanctionDecisionCode } from '@/features/sanctions/types'

export interface SanctionLetterData {
  employeeName: string
  employeeId: string
  faultTitleAr: string
  decisionCode: SanctionDecisionCode
  date: string
}

/**
 * Off-screen printable letter, captured to PDF via `renderElementToPdfFile`.
 * Genericized: the letterhead now reads the configurable `env.companyName`
 * instead of the hardcoded "TE Connectivity Morocco" text and logo the
 * legacy template shipped with.
 */
export const SanctionLetterTemplate = forwardRef<HTMLDivElement, { data: SanctionLetterData }>(
  function SanctionLetterTemplate({ data }, ref) {
    const decision = DECISION_LABELS[data.decisionCode]

    return (
      <div ref={ref} className="pdf-template" dir="rtl">
        <header className="pdf-header">
          <h2>{env.companyName}</h2>
        </header>

        <h3>{decision.ar}</h3>

        <p>
          نحيط علما الموظف(ة) <strong>{data.employeeName}</strong> (المعرف: {data.employeeId}) بأنه تقرر بحقه
          إصدار &quot;{decision.ar}&quot; بتاريخ {data.date}، وذلك بخصوص: {data.faultTitleAr}.
        </p>

        <footer className="pdf-footer">
          <p>{env.companyName}</p>
        </footer>
      </div>
    )
  },
)
