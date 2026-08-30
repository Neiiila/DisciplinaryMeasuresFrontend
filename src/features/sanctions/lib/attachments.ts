export type AttachmentKind = 'image' | 'pdf' | 'video' | 'document' | 'spreadsheet' | 'other'

const EXTENSION_KINDS: Record<string, AttachmentKind> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  pdf: 'pdf',
  mp4: 'video', mov: 'video', avi: 'video', webm: 'video',
  doc: 'document', docx: 'document',
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
}

export interface Attachment {
  url: string
  name: string
  kind: AttachmentKind
}

/**
 * The legacy `DetailsSanctionComponent` and `HrSanctionDetailsComponent`
 * both re-implemented this exact same "guess the file type from its
 * extension" logic independently. Consolidating it here means the two
 * screens that render attachments (request details and the HR review
 * wizard) can never drift out of sync again.
 */
export function parseAttachments(raw: string | null | undefined): Attachment[] {
  if (!raw) return []
  return raw
    .split('||')
    .filter(Boolean)
    .map((url) => {
      const name = url.split('/').pop() ?? url
      const extension = name.split('.').pop()?.toLowerCase() ?? ''
      return { url, name, kind: EXTENSION_KINDS[extension] ?? 'other' }
    })
}
