import { Outlet } from 'react-router-dom'
import { Header } from '@/shared/ui/layout/Header'
import { Sidebar } from '@/shared/ui/layout/Sidebar'

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
