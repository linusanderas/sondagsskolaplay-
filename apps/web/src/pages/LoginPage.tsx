import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@sondagsskolaplay.local')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const next = await login(email, password)
      if (next.role !== 'admin') {
        setError('Kontot saknar admin-behörighet.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggning misslyckades')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page narrow">
      <p className="brand">Söndagsskola Play</p>
      <h1>Admin-inloggning</h1>
      <p className="lede">Logga in för att hantera församlingar, abonnemang och åtkomst.</p>

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          E-post
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Lösenord
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Loggar in…' : 'Logga in'}
        </button>
      </form>
    </main>
  )
}
