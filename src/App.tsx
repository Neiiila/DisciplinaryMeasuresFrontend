import { ConfirmDialog } from 'primereact/confirmdialog'
import { useEffect } from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { AppRoutes } from '@/app/AppRoutes'
import { useAuthStore } from '@/features/auth/store/authStore'
import { setUnauthorizedHandler } from '@/shared/api/httpClient'
import { ToastProvider } from '@/shared/ui/ToastProvider'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmDialog />
        <UnauthorizedRedirect />
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}

/**
 * Bridges the HTTP client's 401 handling to the router: a rejected token
 * clears the session and sends the user to the sign-in page, in-app, rather
 * than through a full page reload.
 */
function UnauthorizedRedirect() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      navigate('/login', { replace: true })
    })
  }, [navigate, logout])

  return null
}
