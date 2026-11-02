import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export function AdminLayout() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <main className="page">
        <p>Laddar…</p>
      </main>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <Link to="/admin" className="brand-link">
            Söndagsskola Play · Admin
          </Link>
          <p className="muted">{user.email}</p>
        </div>
        <nav className="admin-nav">
          <Link to="/admin">Församlingar</Link>
          <Link to="/">Startsida</Link>
          <button type="button" className="linkish" onClick={() => void logout()}>
            Logga ut
          </button>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
