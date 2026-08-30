import { Button } from 'primereact/button'
import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  return (
    <div className="status-page">
      <h1>403</h1>
      <p>You do not have permission to view this page.</p>
      <Link to="/dashboard">
        <Button label="Back to dashboard" />
      </Link>
    </div>
  )
}
