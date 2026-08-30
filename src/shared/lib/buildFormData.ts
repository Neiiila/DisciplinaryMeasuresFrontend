/** Flattens a plain object (plus optional files) into `FormData` for multipart requests. */
export function buildFormData(
  fields: Record<string, string | number | boolean | null | undefined>,
  files: Record<string, File | File[] | null | undefined> = {},
): FormData {
  const formData = new FormData()

  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value))
    }
  }

  for (const [key, value] of Object.entries(files)) {
    if (!value) continue
    if (Array.isArray(value)) {
      value.forEach((file) => formData.append(key, file))
    } else {
      formData.append(key, value)
    }
  }

  return formData
}
