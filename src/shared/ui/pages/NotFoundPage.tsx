import { Button } from 'primereact/button'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="status-page">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/dashboard">
        <Button label="Back to dashboard" />
      </Link>
    </div>
  )
}
