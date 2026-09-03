import type {
  AiAnalysis,
  AnalyticsData,
  RecoveryEntry,
  RecoveryMethod,
} from '../types'

export const recoveryMethods: RecoveryMethod[] = [
  {
    id: 'walk',
    title: '緑のある道を散歩',
    description: '外の空気を吸いながら、ゆっくり歩く',
    duration: '15〜20分',
    category: 'からだ',
    symbol: '♧',
    tone: 'mint',
    source: 'classic',
  },
  {
    id: 'music',
    title: '好きな音楽を3曲',
    description: '画面を閉じて、音だけに身を任せる',
    duration: '10分',
    category: 'こころ',
    symbol: '♫',
    tone: 'blue',
    source: 'classic',
  },
  {
    id: 'stretch',
    title: 'ゆっくりストレッチ',
    description: '肩と首を中心に、呼吸を止めずに伸ばす',
    duration: '5分',
    category: 'からだ',
    symbol: '↟',
    tone: 'gold',
    source: 'classic',
  },
  {
    id: 'bath',
    title: 'スマホを置いて入浴',
    description: '情報から離れて、温かさに集中する',
    duration: '20分',
    category: '休息',
    symbol: '♨',
    tone: 'rose',
    source: 'classic',
  },
]

export const mockAiSuggestions: RecoveryMethod[] = [
  {
    id: 'ai-breath',
    title: '窓辺で4・7・8呼吸',
    description: '4秒吸って、7秒止めて、8秒でゆっくり吐く',
    duration: '4分',
    category: '定番',
    symbol: '≈',
    tone: 'mint',
    source: 'classic',
    reason: '短い休憩でも切り替えやすい方法です。忙しい日の記録と相性がよさそうです。',
  },
  {
    id: 'ai-tea',
    title: '香りを選ぶティータイム',
    description: '飲みたい香りをひとつ選び、温度と香りを味わう',
    duration: '12分',
    category: '新しい発見',
    symbol: '♨',
    tone: 'gold',
    source: 'discovery',
    reason: 'まだ記録にない「嗅覚」を使う休息です。音楽以外の感覚にも意識を向けられます。',
  },
  {
    id: 'ai-photo',
    title: '近所の色を3つ集める',
    description: '外を少し歩き、気になった色を写真に残す',
    duration: '15分',
    category: '新しい発見',
    symbol: '◫',
    tone: 'blue',
    source: 'discovery',
    reason: '効果の高かった散歩に、小さな探索要素を足した未経験のアレンジです。',
  },
]

export const mockRecoveries: RecoveryEntry[] = [
  {
    id: 'recovery-1',
    activity: '川沿いを散歩',
    memo: '夕方の風が気持ちよかった',
    rating: 8,
    aiScore: 8.4,
    aiComment: '短い運動と屋外の刺激が、気分の切り替えに役立っています。',
    createdAt: '2026-09-02T18:30:00+09:00',
  },
  {
    id: 'recovery-2',
    activity: '好きな音楽を聴く',
    memo: '3曲だけ集中して聴いた',
    rating: 7,
    aiScore: 7.2,
    aiComment: '時間を区切ったことで、休憩後の作業復帰もスムーズでした。',
    createdAt: '2026-09-01T21:10:00+09:00',
  },
  {
    id: 'recovery-3',
    activity: 'ゆっくり入浴',
    memo: 'スマホを持ち込まずに休んだ',
    rating: 9,
    aiScore: 8.8,
    aiComment: '情報から離れる休息が、身体と頭の両方の回復につながっています。',
    createdAt: '2026-08-30T22:00:00+09:00',
  },
]

export const defaultAnalysis: AiAnalysis = {
  score: 8.4,
  title: '外の空気が、よい切り替えになっています',
  summary:
    '散歩のあとは自己評価とAI評価の両方が高く、短時間でも気分転換につながる傾向があります。',
  insights: [
    '15〜20分の軽い運動で評価が安定しています',
    '夕方の屋外活動は平均スコアが1.2高めです',
    '音から離れる休息を組み合わせると、さらに効果が期待できます',
  ],
  nextAction: '次回は散歩の最後に、1分だけ深呼吸を加えてみましょう。',
}

export const mockAnalytics: AnalyticsData = {
  monthly: [
    { label: '4月', score: 5.8 },
    { label: '5月', score: 6.4 },
    { label: '6月', score: 7.1 },
    { label: '7月', score: 6.8 },
    { label: '8月', score: 7.8 },
    { label: '9月', score: 8.1 },
  ],
  breakdown: [
    { label: '散歩', percentage: 35, color: '#5f9275' },
    { label: '音楽', percentage: 25, color: '#84a9b5' },
    { label: '入浴', percentage: 20, color: '#dc9187' },
    { label: 'その他', percentage: 20, color: '#d8b470' },
  ],
  ranking: [
    { label: '入浴', score: 8.8, count: 5 },
    { label: '散歩', score: 8.2, count: 9 },
    { label: 'ストレッチ', score: 7.6, count: 4 },
    { label: '音楽', score: 7.1, count: 7 },
  ],
}
