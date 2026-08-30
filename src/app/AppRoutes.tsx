import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { EmployeeFormPage } from '@/features/employees/pages/EmployeeFormPage'
import { EmployeeListPage } from '@/features/employees/pages/EmployeeListPage'
import { MeetingListPage } from '@/features/meetings/pages/MeetingListPage'
import { AddSanctionRequestPage } from '@/features/sanctions/pages/AddSanctionRequestPage'
import { MyRequestsPage } from '@/features/sanctions/pages/MyRequestsPage'
import { ReceivedRequestsPage } from '@/features/sanctions/pages/ReceivedRequestsPage'
import { SanctionListPage } from '@/features/sanctions/pages/SanctionListPage'
import { HrDecisionWizardPage } from '@/features/sanctions/wizard/HrDecisionWizardPage'
import { AttachAccountPage } from '@/features/users/pages/AttachAccountPage'
import { UpdateAccountPage } from '@/features/users/pages/UpdateAccountPage'
import { UserListPage } from '@/features/users/pages/UserListPage'
import { ROLES } from '@/shared/config/roles'
import { GuestOnlyRoute } from '@/shared/ui/GuestOnlyRoute'
import { AppLayout } from '@/shared/ui/layout/AppLayout'
import { AccessDeniedPage } from '@/shared/ui/pages/AccessDeniedPage'
import { NotFoundPage } from '@/shared/ui/pages/NotFoundPage'
import { ProtectedRoute } from '@/shared/ui/ProtectedRoute'

const MANAGEMENT_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN]
const REQUESTER_ROLES = [ROLES.ADMIN, ROLES.CHIEF, ROLES.SUPER_ADMIN]

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        }
      />
      <Route path="/register" element={<RegisterPage />} />
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

        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <UserListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <AttachAccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id/edit"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <UpdateAccountPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/new"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/:id/edit"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="sanctions"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <SanctionListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="sanctions/new"
          element={
            <ProtectedRoute allowedRoles={REQUESTER_ROLES}>
              <AddSanctionRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="sanctions/mine"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CHIEF]}>
              <MyRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="sanctions/received"
          element={
            <ProtectedRoute allowedRoles={REQUESTER_ROLES}>
              <ReceivedRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="sanctions/decision/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <HrDecisionWizardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="meetings"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <MeetingListPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
