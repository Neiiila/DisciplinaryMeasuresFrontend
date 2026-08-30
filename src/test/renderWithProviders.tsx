import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { ToastProvider } from '@/shared/ui/ToastProvider'
import { useAuthStore } from '@/features/auth/store/authStore'
import { decodeToken } from '@/shared/lib/jwt'
import { tokenStorage } from '@/shared/lib/tokenStorage'
import { makeToken } from '@/test/tokens'
import type { Role } from '@/shared/config/roles'

/** Puts a signed-in user into both the store and localStorage. */
export function signIn({
  userId = 'EMP001',
  displayName = 'Amina Haddad',
  role,
}: { userId?: string; displayName?: string; role?: Role } = {}) {
  const token = makeToken({ userId, displayName, role })
  tokenStorage.set(token)

  const decoded = decodeToken(token)!
  useAuthStore.setState({ user: { ...decoded, photoPath: null }, isAuthenticated: true })

  return { token, user: decoded }
}

export function signOut() {
  tokenStorage.clear()
  useAuthStore.setState({ user: null, isAuthenticated: false })
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Initial URL. Defaults to "/". */
  route?: string
  /** When set, the element is mounted at this path pattern so `useParams` works. */
  path?: string
}

/**
 * Renders a component inside the providers it needs in the real app —
 * router, toasts and the confirm-dialog host — so tests exercise the same
 * wiring production does.
 */
export function renderWithProviders(ui: ReactElement, { route = '/', path, ...options }: Options = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          <ConfirmDialog />
          {path ? <Routes>{<Route path={path} element={children} />}</Routes> : children}
        </ToastProvider>
      </MemoryRouter>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}
