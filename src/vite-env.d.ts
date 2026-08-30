/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_COMPANY_NAME: string
  readonly VITE_EMPLOYEE_ID_PREFIX: string
  readonly VITE_COMPANY_EMAIL_DOMAIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
