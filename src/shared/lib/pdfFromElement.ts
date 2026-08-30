import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Adapter around html2canvas + jsPDF: every screen that needs a document
 * (the sanction letter, the meeting report) renders its own hidden HTML
 * template and calls this one function instead of each re-implementing
 * canvas-to-PDF plumbing, as the legacy `SanctionPdfGeneratorComponent` and
 * `SanctionReportPdfGeneratorComponent` did independently.
 */
export async function renderElementToPdfFile(element: HTMLElement, fileName: string): Promise<File> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true })
  const imageData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = (canvas.height * pageWidth) / canvas.width

  pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight)
  const blob = pdf.output('blob')
  return new File([blob], fileName, { type: 'application/pdf' })
}
