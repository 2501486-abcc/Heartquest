export type Screen =
  | 'login'
  | 'home'
  | 'recovery'
  | 'methods'
  | 'ai-suggestions'
  | 'evaluation'
  | 'analysis'
  | 'charts'

export type User = {
  id: string
  displayName: string
  email: string
}

export const RECOVERY_CATEGORIES = [
  '運動',
  '休息',
  '睡眠',
  'リラックス',
  '自然',
  '音楽',
  '食事',
  '趣味',
  '交流',
] as const

export type RecoveryCategory = typeof RECOVERY_CATEGORIES[number]

export type RecoveryMethod = {
  id: string
  title: string
  description: string
  duration: string
  category: RecoveryCategory
  symbol: string
  tone: 'mint' | 'blue' | 'gold' | 'rose'
  source: 'classic' | 'discovery' | 'custom'
  reason?: string
}

export type Bookmark = {
  id: string
  title: string
  description: string
  category: string
  source: string
  createdAt: string
}

export type RecoveryEntry = {
  id: string
  activity: string
  category?: string
  memo: string
  rating: number
  aiScore: number
  aiComment: string
  createdAt: string
}

export type AiAnalysis = {
  score: number
  title: string
  summary: string
  insights: string[]
  nextAction: string
}

export type AnalyticsData = {
  monthly: Array<{ month: string; label: string; score: number; count: number }>
  breakdown: Array<{ label: string; percentage: number; count: number; color: string }>
  ranking: Array<{ label: string; score: number; count: number }>
}
