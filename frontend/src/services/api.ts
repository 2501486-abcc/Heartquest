import { auth } from '../firebase'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('Firebase user is not authenticated')
  }

  const idToken = await currentUser.getIdToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${idToken}`)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })
}

export async function responseError(response: Response) {
  try {
    const body = (await response.json()) as { detail?: string }
    return body.detail || `API request failed (${response.status})`
  } catch {
    return `API request failed (${response.status})`
  }
}
