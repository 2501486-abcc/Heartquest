import { PageHeader } from '../components/PageHeader'
import { RecoveryMethodCard } from '../components/RecoveryMethodCard'
import type { RecoveryMethod } from '../types'

type AiSuggestionsPageProps = {
  bookmarkedIds: string[]
  isLoading: boolean
  methods: RecoveryMethod[]
  onBack: () => void
  onBookmark: (method: RecoveryMethod) => void
  onRefresh: () => void
  onSelect: (method: RecoveryMethod) => void
}

export function AiSuggestionsPage({
  bookmarkedIds,
  isLoading,
  methods,
  onBack,
  onBookmark,
  onRefresh,
  onSelect,
}: AiSuggestionsPageProps) {
  return (
    <div className="page">
      <PageHeader
        description="最近の記録と、今のコンディションをもとに選びました。"
        eyebrow="AI RECOVERY GUIDE"
        onBack={onBack}
        title="今のあなたへの3つの提案"
      />

      <div className="ai-context-note">
        <span aria-hidden="true">✦</span>
        <p>
          <strong>今回の見立て</strong>
          短時間で気分を切り替えられ、これまでとは違う感覚も使える方法を組み合わせました。
        </p>
      </div>

      {isLoading ? (
        <div className="suggestion-loading" aria-live="polite">
          <div className="loading-orbit"><span>✦</span></div>
          <h2>あなたの記録を読み解いています</h2>
          <p>効果の高かった方法と、新しい選択肢を探しています…</p>
        </div>
      ) : (
        <>
          <section className="suggestion-grid">
            {methods.map((method) => (
              <RecoveryMethodCard
                bookmarked={bookmarkedIds.includes(method.id)}
                key={method.id}
                method={method}
                onBookmark={onBookmark}
                onSelect={onSelect}
                showReason
              />
            ))}
          </section>
          <button className="refresh-button" onClick={onRefresh} type="button">
            <span aria-hidden="true">↻</span>
            別の提案を見る
          </button>
        </>
      )}
    </div>
  )
}
