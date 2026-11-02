import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createOrganization,
  listOrganizations,
  type Organization,
} from '../../lib/api'

export function OrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([])
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load(search = q) {
    setLoading(true)
    setError(null)
    try {
      const result = await listOrganizations(search)
      setItems(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte hämta')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load('')
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createOrganization({
        name,
        contact_email: email || null,
      })
      setName('')
      setEmail('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skapa')
    }
  }

  return (
    <main className="page wide">
      <h1>Församlingar / kunder</h1>
      <p className="lede">Lista, skapa och öppna kunder för abonnemang och åtkomst.</p>

      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault()
          void load(q)
        }}
      >
        <input
          placeholder="Sök namn, e-post, org.nr…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit">Sök</button>
      </form>

      <form className="stack-form panel" onSubmit={onCreate}>
        <h2>Ny församling</h2>
        <label>
          Namn
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Kontakt-e-post
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit">Skapa</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p>Laddar…</p>}

      {!loading && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Namn</th>
              <th>Kontakt</th>
              <th>Användare</th>
              <th>Abonnemang</th>
              <th>Grants</th>
            </tr>
          </thead>
          <tbody>
            {items.map((org) => (
              <tr key={org.id}>
                <td>
                  <Link to={`/admin/organizations/${org.id}`}>{org.name}</Link>
                </td>
                <td>{org.contact_email ?? '—'}</td>
                <td>{org.users_count ?? 0}</td>
                <td>{org.subscriptions_count ?? 0}</td>
                <td>{org.access_grants_count ?? 0}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5}>Inga församlingar ännu.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  )
}
