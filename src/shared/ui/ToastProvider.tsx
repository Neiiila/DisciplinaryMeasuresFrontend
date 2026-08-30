import { Toast } from 'primereact/toast'
import { createContext, useContext, useRef, type ReactNode } from 'react'

interface ToastContextValue {
  success: (summary: string, detail?: string) => void
  error: (summary: string, detail?: string) => void
  info: (summary: string, detail?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastRef = useRef<Toast>(null)

  const value: ToastContextValue = {
    success: (summary, detail) =>
      toastRef.current?.show({ severity: 'success', summary, detail, life: 4000 }),
    error: (summary, detail) =>
      toastRef.current?.show({ severity: 'error', summary, detail, life: 6000 }),
    info: (summary, detail) =>
      toastRef.current?.show({ severity: 'info', summary, detail, life: 4000 }),
  }

  return (
    <ToastContext.Provider value={value}>
      <Toast ref={toastRef} position="top-right" />
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
