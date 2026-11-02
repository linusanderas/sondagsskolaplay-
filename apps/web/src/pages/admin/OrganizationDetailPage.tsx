import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  SUBSCRIPTION_STATUSES,
  attachUser,
  createAccessGrant,
  createSubscription,
  createUser,
  deleteAccessGrant,
  detachUser,
  getOrganization,
  listCollections,
  listPlans,
  listUsers,
  listVideos,
  updateOrganization,
  updateSubscription,
  type AccessGrant,
  type Collection,
  type Organization,
  type Plan,
  type User,
  type Video,
} from '../../lib/api'

export function OrganizationDetailPage() {
  const { id } = useParams()
  const orgId = Number(id)

  const [org, setOrg] = useState<Organization | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('password')
  const [attachUserId, setAttachUserId] = useState('')

  const [planId, setPlanId] = useState('')
  const [subStatus, setSubStatus] = useState('active')
  const [subNotes, setSubNotes] = useState('')

  const [grantType, setGrantType] = useState<'video' | 'collection'>('collection')
  const [grantId, setGrantId] = useState('')
  const [grantNotes, setGrantNotes] = useState('')

  async function reload() {
    const [organization, planList, videoList, collectionList, userList] =
      await Promise.all([
        getOrganization(orgId),
        listPlans(),
        listVideos(),
        listCollections(),
        listUsers(),
      ])
    setOrg(organization)
    setEditName(organization.name)
    setEditEmail(organization.contact_email ?? '')
    setEditNotes(organization.internal_notes ?? '')
    setPlans(planList)
    setVideos(videoList)
    setCollections(collectionList)
    setUsers(userList.data)
    if (!planId && planList[0]) {
      setPlanId(String(planList[0].id))
    }
  }

  useEffect(() => {
    if (!orgId) return
    void reload().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda')
    })
  }, [orgId])

  async function withFeedback(action: () => Promise<void>, ok: string) {
    setError(null)
    setMessage(null)
    try {
      await action()
      setMessage(ok)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  async function onSaveOrg(event: FormEvent) {
    event.preventDefault()
    await withFeedback(async () => {
      await updateOrganization(orgId, {
        name: editName,
        contact_email: editEmail || null,
        internal_notes: editNotes || null,
      })
    }, 'Församling sparad.')
  }

  async function onCreateUser(event: FormEvent) {
    event.preventDefault()
    await withFeedback(async () => {
      await createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: 'customer',
        organization_id: orgId,
        organization_role: 'member',
      })
      setNewUserName('')
      setNewUserEmail('')
    }, 'Användare skapad och kopplad.')
  }

  async function onAttachUser(event: FormEvent) {
    event.preventDefault()
    await withFeedback(async () => {
      await attachUser(orgId, Number(attachUserId), 'member')
      setAttachUserId('')
    }, 'Användare kopplad.')
  }

  async function onCreateSubscription(event: FormEvent) {
    event.preventDefault()
    await withFeedback(async () => {
      await createSubscription({
        organization_id: orgId,
        plan_id: Number(planId),
        status: subStatus,
        notes: subNotes || null,
        starts_at: new Date().toISOString(),
      })
      setSubNotes('')
    }, 'Abonnemang skapat.')
  }

  async function onCreateGrant(event: FormEvent) {
    event.preventDefault()
    await withFeedback(async () => {
      await createAccessGrant({
        organization_id: orgId,
        grantable_type: grantType,
        grantable_id: Number(grantId),
        notes: grantNotes || undefined,
      })
      setGrantNotes('')
    }, 'AccessGrant tilldelad.')
  }

  function grantLabel(grant: AccessGrant): string {
    const type = grant.grantable_type.includes('Collection')
      ? 'Collection'
      : grant.grantable_type.includes('Video')
        ? 'Video'
        : grant.grantable_type
    const name =
      grant.grantable && 'title' in grant.grantable
        ? grant.grantable.title
        : grant.grantable && 'name' in grant.grantable
          ? grant.grantable.name
          : `#${grant.grantable_id}`
    return `${type}: ${name}`
  }

  if (!org) {
    return (
      <main className="page">
        {error ? <p className="error">{error}</p> : <p>Laddar…</p>}
      </main>
    )
  }

  const grantOptions = grantType === 'video' ? videos : collections

  return (
    <main className="page wide">
      <p>
        <Link to="/admin">← Alla församlingar</Link>
      </p>
      <h1>{org.name}</h1>
      <p className="lede">
        Redigera kund, koppla användare, sätt manuell subscription-status och tilldela
        AccessGrant (urval). Full plan ger alla videor via subscription — ingen
        fakturaintegration.
      </p>

      {error && <p className="error">{error}</p>}
      {message && <p className="ok">{message}</p>}

      <form className="stack-form panel" onSubmit={onSaveOrg}>
        <h2>Uppgifter</h2>
        <label>
          Namn
          <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
        </label>
        <label>
          Kontakt-e-post
          <input
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
        </label>
        <label>
          Interna anteckningar
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
          />
        </label>
        <button type="submit">Spara</button>
      </form>

      <section className="panel">
        <h2>Användare</h2>
        <ul className="plain-list">
          {(org.users ?? []).map((user) => (
            <li key={user.id}>
              <span>
                {user.name} · {user.email} · {user.pivot?.role ?? 'member'}
              </span>
              <button
                type="button"
                className="linkish"
                onClick={() =>
                  void withFeedback(
                    () => detachUser(orgId, user.id).then(() => undefined),
                    'Användare bortkopplad.',
                  )
                }
              >
                Ta bort
              </button>
            </li>
          ))}
          {(org.users ?? []).length === 0 && <li>Inga kopplade användare.</li>}
        </ul>

        <form className="stack-form" onSubmit={onCreateUser}>
          <h3>Skapa och koppla användare</h3>
          <label>
            Namn
            <input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </label>
          <label>
            E-post
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Lösenord
            <input
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit">Skapa användare</button>
        </form>

        <form className="inline-form" onSubmit={onAttachUser}>
          <select
            value={attachUserId}
            onChange={(e) => setAttachUserId(e.target.value)}
            required
          >
            <option value="">Koppla befintlig användare…</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button type="submit">Koppla</button>
        </form>
      </section>

      <section className="panel">
        <h2>Abonnemang (manuell status)</h2>
        <ul className="plain-list">
          {(org.subscriptions ?? []).map((sub) => (
            <li key={sub.id} className="stack-item">
              <div>
                <strong>{sub.plan?.name ?? `Plan #${sub.plan_id}`}</strong>
                <span className="muted">
                  {' '}
                  · {sub.plan?.access_type === 'full' ? 'alla videor' : 'urval via grants'}
                </span>
              </div>
              <label className="inline-label">
                Status
                <select
                  value={sub.status}
                  onChange={(e) =>
                    void withFeedback(async () => {
                      await updateSubscription(sub.id, { status: e.target.value })
                    }, 'Status uppdaterad.')
                  }
                >
                  {SUBSCRIPTION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              {sub.notes && <p className="muted">{sub.notes}</p>}
            </li>
          ))}
          {(org.subscriptions ?? []).length === 0 && <li>Inga abonnemang.</li>}
        </ul>

        <form className="stack-form" onSubmit={onCreateSubscription}>
          <h3>Nytt abonnemang</h3>
          <label>
            Plan
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              required
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.access_type})
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={subStatus} onChange={(e) => setSubStatus(e.target.value)}>
              {SUBSCRIPTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Anteckning
            <input value={subNotes} onChange={(e) => setSubNotes(e.target.value)} />
          </label>
          <button type="submit">Skapa abonnemang</button>
        </form>
      </section>

      <section className="panel">
        <h2>AccessGrant (urval)</h2>
        <p className="muted">
          Använd för resurspaket / manuella undantag. Full plan behöver normalt inga grants.
        </p>
        <ul className="plain-list">
          {(org.access_grants ?? []).map((grant) => (
            <li key={grant.id}>
              <span>{grantLabel(grant)}</span>
              <button
                type="button"
                className="linkish"
                onClick={() =>
                  void withFeedback(
                    () => deleteAccessGrant(grant.id),
                    'Grant borttagen.',
                  )
                }
              >
                Ta bort
              </button>
            </li>
          ))}
          {(org.access_grants ?? []).length === 0 && <li>Inga grants.</li>}
        </ul>

        <form className="stack-form" onSubmit={onCreateGrant}>
          <h3>Tilldela</h3>
          <label>
            Typ
            <select
              value={grantType}
              onChange={(e) => {
                setGrantType(e.target.value as 'video' | 'collection')
                setGrantId('')
              }}
            >
              <option value="collection">Collection</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label>
            Mål
            <select
              value={grantId}
              onChange={(e) => setGrantId(e.target.value)}
              required
            >
              <option value="">Välj…</option>
              {grantOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {'title' in item ? item.title : item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Anteckning
            <input value={grantNotes} onChange={(e) => setGrantNotes(e.target.value)} />
          </label>
          <button type="submit">Tilldela</button>
        </form>
      </section>
    </main>
  )
}
