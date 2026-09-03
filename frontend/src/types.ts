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

export type RecoveryMethod = {
  id: string
  title: string
  description: string
  duration: string
  category: string
  symbol: string
  tone: 'mint' | 'blue' | 'gold' | 'rose'
  source: 'classic' | 'discovery' | 'custom'
  reason?: string
}

export type RecoveryEntry = {
  id: string
  activity: string
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
  monthly: Array<{ label: string; score: number }>
  breakdown: Array<{ label: string; percentage: number; color: string }>
  ranking: Array<{ label: string; score: number; count: number }>
}
