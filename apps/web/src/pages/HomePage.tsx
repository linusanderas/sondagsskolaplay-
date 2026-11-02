import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchHealth, type HealthResponse } from '../lib/api'

export function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHealth()
      .then((data) => {
        if (!cancelled) setHealth(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Kunde inte nå API')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page">
      <p className="brand">Söndagsskola Play</p>
      <h1>Stubbe</h1>
      <p className="lede">
        Laravel API + React SPA. Admin-MVP för kunder finns under{' '}
        <Link to="/login">/login</Link>.
      </p>

      <section className="status" aria-live="polite">
        <h2>API-status</h2>
        {error && <p className="error">{error}</p>}
        {!error && !health && <p>Kontrollerar…</p>}
        {health && (
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{health.service}</dd>
            </div>
            <div>
              <dt>Tid</dt>
              <dd>{health.timestamp}</dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  )
}
