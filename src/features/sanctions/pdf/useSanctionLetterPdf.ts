import { useRef } from 'react'
import { renderElementToPdfFile } from '@/shared/lib/pdfFromElement'
import type { SanctionLetterData } from '@/features/sanctions/pdf/SanctionLetterTemplate'

export function useSanctionLetterPdf() {
  const templateRef = useRef<HTMLDivElement>(null)

  async function generate(data: SanctionLetterData): Promise<File> {
    if (!templateRef.current) {
      throw new Error('The letter template has not rendered yet.')
    }
    const fileName = `${data.employeeId}-${data.decisionCode}-${data.date}.pdf`
    return renderElementToPdfFile(templateRef.current, fileName)
  }

  return { templateRef, generate }
}
