import { ConfirmDialog } from 'primereact/confirmdialog'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/AppRoutes'
import { ToastProvider } from '@/shared/ui/ToastProvider'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmDialog />
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}
