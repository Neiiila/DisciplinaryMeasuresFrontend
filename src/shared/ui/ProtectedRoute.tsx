import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { Role } from '@/shared/config/roles'

interface ProtectedRouteProps {
  children: ReactNode
  /** When omitted, any authenticated user may access the route. */
  allowedRoles?: Role[]
}

/**
 * Replaces the legacy app's five overlapping guards (`AuthGuardGuard`,
 * `RoleGuard`, `AdminGuard`, `ChiefGuard`, `SuperAdminGuard`) with a single
 * configurable component. It also fixes the inconsistency where some guards
 * redirected to `/access-denied` while the router only ever registered
 * `/unauthorized`.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
