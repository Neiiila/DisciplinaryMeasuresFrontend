import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ROLES } from '@/shared/config/roles'
import { ProtectedRoute } from '@/shared/ui/ProtectedRoute'
import { renderWithProviders, signIn, signOut } from '@/test/renderWithProviders'

function Guarded({ roles }: { roles?: (typeof ROLES)[keyof typeof ROLES][] }) {
  return (
    <Routes>
      <Route
        path="/secret"
        element={
          <ProtectedRoute allowedRoles={roles}>
            <p>classified</p>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<p>sign in page</p>} />
      <Route path="/unauthorized" element={<p>access denied</p>} />
    </Routes>
  )
}

describe('ProtectedRoute', () => {
  it('sends an anonymous visitor to the sign-in page', () => {
    signOut()
    renderWithProviders(<Guarded />, { route: '/secret' })

    expect(screen.getByText('sign in page')).toBeInTheDocument()
    expect(screen.queryByText('classified')).not.toBeInTheDocument()
  })

  it('lets any signed-in user through when no roles are required', () => {
    signIn({ role: ROLES.GUEST })
    renderWithProviders(<Guarded />, { route: '/secret' })

    expect(screen.getByText('classified')).toBeInTheDocument()
  })

  it('lets a permitted role through', () => {
    signIn({ role: ROLES.ADMINISTRATOR })
    renderWithProviders(<Guarded roles={[ROLES.ADMINISTRATOR]} />, { route: '/secret' })

    expect(screen.getByText('classified')).toBeInTheDocument()
  })

  /**
   * The regression this pins down: the legacy guards sent rejected users to
   * "/access-denied", a path the router never registered, so the redirect
   * fell through to the catch-all 404.
   */
  it('sends a signed-in user without the role to /unauthorized, not a 404', () => {
    signIn({ role: ROLES.EMPLOYEE })
    renderWithProviders(<Guarded roles={[ROLES.ADMINISTRATOR]} />, { route: '/secret' })

    expect(screen.getByText('access denied')).toBeInTheDocument()
    expect(screen.queryByText('classified')).not.toBeInTheDocument()
  })

  it('does not leak protected content to a Guest when Administrator is required', () => {
    signIn({ role: ROLES.GUEST })
    renderWithProviders(<Guarded roles={[ROLES.ADMINISTRATOR]} />, { route: '/secret' })

    expect(screen.queryByText('classified')).not.toBeInTheDocument()
  })
})
