const API_URL = import.meta.env.VITE_API_URL ?? ''

export type User = {
  id: number
  name: string
  email: string
  role: 'admin' | 'customer'
}

export type Organization = {
  id: number
  name: string
  organization_number: string | null
  contact_email: string | null
  contact_phone: string | null
  invoice_address: string | null
  internal_notes: string | null
  users_count?: number
  subscriptions_count?: number
  access_grants_count?: number
  users?: Array<User & { pivot?: { role: string } }>
  subscriptions?: Subscription[]
  access_grants?: AccessGrant[]
}

export type Plan = {
  id: number
  name: string
  slug: string
  access_type: 'full' | 'resource'
  price_ore: number | null
  billing_period: string | null
  description: string | null
  is_active: boolean
}

export type Subscription = {
  id: number
  organization_id: number
  plan_id: number
  status: string
  starts_at: string | null
  ends_at: string | null
  notes: string | null
  plan?: Plan
  organization?: Organization
}

export type Video = {
  id: number
  title: string
  episode_number: number | null
  vimeo_id: string | null
  status: string
  is_preview: boolean
}

export type Collection = {
  id: number
  name: string
  slug: string
  description: string | null
  videos?: Video[]
}

export type AccessGrant = {
  id: number
  organization_id: number
  grantable_type: string
  grantable_id: number
  notes: string | null
  grantable?: Video | Collection
}

export type HealthResponse = {
  status: string
  service: string
  timestamp: string
}

type Paginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

function getXsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function ensureCsrf(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const xsrf = getXsrfToken()
  if (xsrf) {
    headers.set('X-XSRF-TOKEN', xsrf)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      (payload as { message?: string }).message ||
      `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload as T
}

export async function fetchHealth(): Promise<HealthResponse> {
  return api<HealthResponse>('/api/health')
}

export async function login(email: string, password: string): Promise<User> {
  await ensureCsrf()
  const result = await api<{ user: User }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return result.user
}

export async function logout(): Promise<void> {
  await api('/logout', { method: 'POST' })
}

export async function fetchMe(): Promise<User> {
  return api<User>('/api/user')
}

export async function listOrganizations(q = ''): Promise<Paginated<Organization>> {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return api(`/api/admin/organizations${query}`)
}

export async function getOrganization(id: number): Promise<Organization> {
  return api(`/api/admin/organizations/${id}`)
}

export async function createOrganization(
  data: Partial<Organization> & { name: string },
): Promise<Organization> {
  return api('/api/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateOrganization(
  id: number,
  data: Partial<Organization>,
): Promise<Organization> {
  return api(`/api/admin/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function listUsers(q = ''): Promise<Paginated<User>> {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return api(`/api/admin/users${query}`)
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role?: string
  organization_id?: number
  organization_role?: string
}): Promise<User> {
  return api('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function attachUser(
  organizationId: number,
  userId: number,
  role = 'member',
): Promise<Organization> {
  return api(`/api/admin/organizations/${organizationId}/users`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role }),
  })
}

export async function detachUser(
  organizationId: number,
  userId: number,
): Promise<Organization> {
  return api(`/api/admin/organizations/${organizationId}/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function listPlans(): Promise<Plan[]> {
  return api('/api/admin/plans')
}

export async function createSubscription(data: {
  organization_id: number
  plan_id: number
  status: string
  starts_at?: string | null
  ends_at?: string | null
  notes?: string | null
}): Promise<Subscription> {
  return api('/api/admin/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSubscription(
  id: number,
  data: Partial<Subscription>,
): Promise<Subscription> {
  return api(`/api/admin/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function listVideos(): Promise<Video[]> {
  return api('/api/admin/videos')
}

export async function listCollections(): Promise<Collection[]> {
  return api('/api/admin/collections')
}

export async function createAccessGrant(data: {
  organization_id: number
  grantable_type: 'video' | 'collection'
  grantable_id: number
  notes?: string
}): Promise<AccessGrant> {
  return api('/api/admin/access-grants', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteAccessGrant(id: number): Promise<void> {
  return api(`/api/admin/access-grants/${id}`, { method: 'DELETE' })
}

export const SUBSCRIPTION_STATUSES = [
  'pending',
  'active',
  'past_due',
  'paused',
  'ended',
  'cancelled',
] as const
