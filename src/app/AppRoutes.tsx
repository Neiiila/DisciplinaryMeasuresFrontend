import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { EmployeeDirectoryPage } from '@/features/employees/pages/EmployeeDirectoryPage'
import { AddressedToMePage } from '@/features/sanctions/pages/AddressedToMePage'
import { MyRequestsPage } from '@/features/sanctions/pages/MyRequestsPage'
import { RaiseSanctionRequestPage } from '@/features/sanctions/pages/RaiseSanctionRequestPage'
import { SanctionListPage } from '@/features/sanctions/pages/SanctionListPage'
import { UserFormPage } from '@/features/users/pages/UserFormPage'
import { UserListPage } from '@/features/users/pages/UserListPage'
import { ROLES } from '@/shared/config/roles'
import { GuestOnlyRoute } from '@/shared/ui/GuestOnlyRoute'
import { AppLayout } from '@/shared/ui/layout/AppLayout'
import { AccessDeniedPage } from '@/shared/ui/pages/AccessDeniedPage'
import { NotFoundPage } from '@/shared/ui/pages/NotFoundPage'
import { ProtectedRoute } from '@/shared/ui/ProtectedRoute'

const ADMIN_ONLY = [ROLES.ADMINISTRATOR]

/**
 * Route-level authorisation mirrors the backend's own: `[Authorize]`
 * everywhere inside /dashboard, plus the Administrator policy on the routes
 * whose endpoints carry it. The guard is a convenience, not the enforcement
 * point — the API rejects the call regardless.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnlyRoute>
            <RegisterPage />
          </GuestOnlyRoute>
        }
      />
      <Route path="/unauthorized" element={<AccessDeniedPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<EmployeeDirectoryPage />} />

        <Route path="sanctions/mine" element={<MyRequestsPage />} />
        <Route path="sanctions/addressed-to-me" element={<AddressedToMePage />} />
        <Route path="sanctions/new" element={<RaiseSanctionRequestPage />} />
        <Route
          path="sanctions"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <SanctionListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <UserListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <UserFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id/edit"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <UserFormPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
