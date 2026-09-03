import {
  defaultAnalysis,
  mockAiSuggestions,
  mockAnalytics,
  mockRecoveries,
} from '../data/mockData'
import type {
  AiAnalysis,
  AnalyticsData,
  RecoveryEntry,
  RecoveryMethod,
  User,
} from '../types'

const simulateNetwork = (milliseconds = 350) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds))

type SaveRecoveryInput = {
  method: RecoveryMethod
  memo: string
  moodBefore: number
  rating: number
}

export const heartQuestService = {
  async login(email: string): Promise<User> {
    // TODO(API): Firebase Authentication の signInWithEmailAndPassword へ置き換える。
    await simulateNetwork()
    return {
      id: 'demo-user',
      displayName: 'はるか',
      email: email || 'demo@heartquest.local',
    }
  },

  async getRecoveries(): Promise<RecoveryEntry[]> {
    // TODO(API): GET /recoveries（Firebase ID Token付き）へ置き換える。
    await simulateNetwork(200)
    return [...mockRecoveries]
  },

  async getRecommendations(): Promise<RecoveryMethod[]> {
    // TODO(API): POST /ai/recommend へ、過去の履歴と回復前の状態を送る。
    await simulateNetwork(700)
    return [...mockAiSuggestions]
  },

  async saveRecovery(input: SaveRecoveryInput): Promise<RecoveryEntry> {
    // TODO(API): POST /recoveries 後、PUT /recoveries/{id}/rating へ分けて送信する。
    await simulateNetwork(450)
    const aiScore = Math.min(10, Math.max(1, input.rating + 0.4))
    return {
      id: 'recovery-' + Date.now(),
      activity: input.method.title,
      memo: input.memo,
      rating: input.rating,
      aiScore,
      aiComment:
        input.rating >= 8
          ? '今回の方法は、今の状態に合った高い回復効果が見られました。'
          : '少し回復できています。時間帯や実施時間を変えて比べてみましょう。',
      createdAt: new Date().toISOString(),
    }
  },

  async analyzeRecovery(
    entry: RecoveryEntry,
    moodBefore: number,
  ): Promise<AiAnalysis> {
    // TODO(API): POST /ai/analyze へ回復前状態・方法・感想・10段階評価を送る。
    await simulateNetwork(650)
    return {
      ...defaultAnalysis,
      score: entry.aiScore,
      title:
        entry.rating >= 8
          ? entry.activity + 'が、よい回復につながりました'
          : '小さな変化を、次の回復につなげましょう',
      summary:
        '回復前の状態は' +
        moodBefore +
        '/5、実施後の自己評価は' +
        entry.rating +
        '/10でした。感想と過去の傾向を合わせると、無理なく集中を外す時間が効果的です。',
    }
  },

  async getAnalytics(): Promise<AnalyticsData> {
    // TODO(API): GET /analytics/ranking と GET /analytics/monthly に置き換える。
    await simulateNetwork(250)
    return mockAnalytics
  },
}
