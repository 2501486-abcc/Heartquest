import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '../firebase'
import { authenticatedFetch, responseError } from './api'
import type {
  AiAnalysis,
  AnalyticsData,
  Bookmark,
  RecoveryEntry,
  RecoveryMethod,
  User,
} from '../types'

type BackendUser = {
  id: number
  firebase_uid: string
  display_name: string
}

type BackendRecovery = {
  id: number
  user_id: number
  activity: string
  category: string
  memo: string | null
  rating: number | null
  ai_score: number | null
  ai_comment: string | null
  created_at: string
}

type BackendBookmark = {
  id: number
  user_id: number
  title: string
  description: string | null
  category: string | null
  source: string | null
  created_at: string
}

type BackendRecommendation = Pick<
  RecoveryMethod, 'title' | 'description' | 'duration' | 'category' | 'reason'
> & { source: 'classic' | 'discovery' }

type BackendAnalysis = Omit<AiAnalysis, 'nextAction'> & { next_action: string }

type SaveRecoveryInput = {
  method: RecoveryMethod
  memo: string
  moodBefore: number
  rating: number
}

type BackendMonthlyAnalytics = {
  month: string
  score: number
  count: number
}

type BackendRankingAnalytics = {
  activity: string
  score: number
  count: number
}

type BackendBreakdownAnalytics = {
  category: string
  percentage: number
  count: number
}

const breakdownColors = [
  '#5f9275',
  '#84a9b5',
  '#dc9187',
  '#d8b470',
  '#927aa3',
  '#7d9c63',
]

let pendingRegistrationDisplayName: string | null = null

const toFrontendUser = (backendUser: BackendUser, firebaseUser: FirebaseUser): User => ({
  id: String(backendUser.id),
  displayName: backendUser.display_name,
  email: firebaseUser.email ?? '',
})

const toRecoveryEntry = (recovery: BackendRecovery): RecoveryEntry => ({
  id: String(recovery.id),
  activity: recovery.activity,
  category: recovery.category,
  memo: recovery.memo ?? '',
  rating: recovery.rating ?? 0,
  aiScore: recovery.ai_score ?? recovery.rating ?? 0,
  aiComment: recovery.ai_comment ?? '',
  createdAt: recovery.created_at,
})

const toBookmark = (bookmark: BackendBookmark): Bookmark => ({
  id: String(bookmark.id),
  title: bookmark.title,
  description: bookmark.description ?? '',
  category: bookmark.category ?? '',
  source: bookmark.source ?? '',
  createdAt: bookmark.created_at,
})

const defaultDisplayName = (firebaseUser: FirebaseUser) => {
  const displayName = firebaseUser.displayName?.trim()
  if (displayName) return displayName.slice(0, 30)

  const emailName = firebaseUser.email?.split('@')[0]?.trim()
  return (emailName || 'HeartQuest User').slice(0, 30)
}

async function ensureHeartQuestUser(
  firebaseUser: FirebaseUser,
  initialDisplayName = defaultDisplayName(firebaseUser),
): Promise<User> {
  const response = await authenticatedFetch('/users/me', {
    method: 'POST',
    body: JSON.stringify({ display_name: initialDisplayName }),
  })

  if (!response.ok) {
    throw new Error(await responseError(response))
  }

  const backendUser = (await response.json()) as BackendUser
  return toFrontendUser(backendUser, firebaseUser)
}

export const heartQuestService = {
  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password)
  },

  async register(email: string, password: string, displayName: string): Promise<User> {
    pendingRegistrationDisplayName = displayName.trim()
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      return await ensureHeartQuestUser(credential.user, pendingRegistrationDisplayName)
    } finally {
      pendingRegistrationDisplayName = null
    }
  },

  observeAuthState(
    onChange: (user: User | null, error?: Error) => void,
  ): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        onChange(null)
        return
      }

      try {
        onChange(await ensureHeartQuestUser(
          firebaseUser,
          pendingRegistrationDisplayName ?? defaultDisplayName(firebaseUser),
        ))
      } catch (error) {
        onChange(null, error instanceof Error ? error : new Error('Authentication failed'))
      }
    })
  },

  async logout(): Promise<void> {
    await signOut(auth)
  },

  async updateDisplayName(displayName: string): Promise<User> {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      throw new Error('Firebase user is not authenticated')
    }

    const response = await authenticatedFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ display_name: displayName.trim() }),
    })
    if (!response.ok) {
      throw new Error(await responseError(response))
    }

    return toFrontendUser((await response.json()) as BackendUser, firebaseUser)
  },

  async getRecoveries(): Promise<RecoveryEntry[]> {
    const response = await authenticatedFetch('/recoveries')
    if (!response.ok) {
      throw new Error(await responseError(response))
    }

    const recoveries = (await response.json()) as BackendRecovery[]
    return recoveries.map(toRecoveryEntry)
  },

  async getRecommendations(currentMood: number): Promise<RecoveryMethod[]> {
    const response = await authenticatedFetch('/ai/recommend', {
      method: 'POST',
      body: JSON.stringify({ current_mood: currentMood }),
    })
    if (!response.ok) throw new Error(await responseError(response))
    const result = (await response.json()) as { recommendations: BackendRecommendation[] }
    return result.recommendations.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      symbol: item.source === 'classic' ? '❋' : '✦',
      tone: item.source === 'classic' ? 'mint' : 'blue',
    }))
  },

  async getBookmarks(): Promise<Bookmark[]> {
    const response = await authenticatedFetch('/bookmarks')
    if (!response.ok) {
      throw new Error(await responseError(response))
    }

    const bookmarks = (await response.json()) as BackendBookmark[]
    return bookmarks.map(toBookmark)
  },

  async createBookmark(method: RecoveryMethod): Promise<Bookmark> {
    const response = await authenticatedFetch('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({
        title: method.title,
        description: method.description,
        category: method.category,
        source: method.source,
      }),
    })

    if (!response.ok) {
      throw new Error(await responseError(response))
    }

    return toBookmark((await response.json()) as BackendBookmark)
  },

  async deleteBookmark(bookmarkId: string): Promise<void> {
    const response = await authenticatedFetch(`/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(await responseError(response))
    }
  },

  async saveRecovery(input: SaveRecoveryInput): Promise<RecoveryEntry> {
    const response = await authenticatedFetch('/recoveries', {
      method: 'POST',
      body: JSON.stringify({
        activity: input.method.title,
        category: input.method.category,
        before_mood: input.moodBefore,
        before_state: ['かなり疲れた', '少し疲れた', 'ふつう', 'まずまず', '元気'][input.moodBefore - 1],
        memo: input.memo,
        rating: input.rating,
        source: input.method.source,
      }),
    })

    if (!response.ok) {
      throw new Error(await responseError(response))
    }

    return toRecoveryEntry((await response.json()) as BackendRecovery)
  },

  async analyzeRecovery(
    entry: RecoveryEntry,
  ): Promise<AiAnalysis> {
    const response = await authenticatedFetch('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ recovery_id: Number(entry.id) }),
    })
    if (!response.ok) throw new Error(await responseError(response))
    const result = (await response.json()) as BackendAnalysis
    return {
      score: result.score,
      title: result.title,
      summary: result.summary,
      insights: result.insights,
      nextAction: result.next_action,
    }
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const [monthlyResponse, rankingResponse, breakdownResponse] = await Promise.all([
      authenticatedFetch('/analytics/monthly'),
      authenticatedFetch('/analytics/ranking'),
      authenticatedFetch('/analytics/breakdown'),
    ])

    for (const response of [monthlyResponse, rankingResponse, breakdownResponse]) {
      if (!response.ok) {
        throw new Error(await responseError(response))
      }
    }

    const [monthly, ranking, breakdown] = await Promise.all([
      monthlyResponse.json() as Promise<BackendMonthlyAnalytics[]>,
      rankingResponse.json() as Promise<BackendRankingAnalytics[]>,
      breakdownResponse.json() as Promise<BackendBreakdownAnalytics[]>,
    ])

    return {
      monthly: monthly.map((item) => ({
        ...item,
        label: `${Number(item.month.slice(5, 7))}月`,
      })),
      ranking: ranking.map((item) => ({
        label: item.activity,
        score: item.score,
        count: item.count,
      })),
      breakdown: breakdown.map((item, index) => ({
        label: item.category,
        percentage: item.percentage,
        count: item.count,
        color: breakdownColors[index % breakdownColors.length],
      })),
    }
  },
}
