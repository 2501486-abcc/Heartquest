import { PageHeader } from '../components/PageHeader'
import { RecoveryMethodCard } from '../components/RecoveryMethodCard'
import type { RecoveryMethod } from '../types'

type AiSuggestionsPageProps = {
  bookmarkedIds: string[]
  bookmarkNotice: string
  bookmarkingIds: string[]
  isLoading: boolean
  methods: RecoveryMethod[]
  onBack: () => void
  onBookmark: (method: RecoveryMethod) => void
  onRefresh: () => void
  onSelect: (method: RecoveryMethod) => void
}

export function AiSuggestionsPage({
  bookmarkedIds,
  bookmarkNotice,
  bookmarkingIds,
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
          <strong>提案について</strong>
          今の気分と直近の回復記録から、定番の方法と新しい選択肢をAIが提案します。
        </p>
      </div>

      {bookmarkNotice ? (
        <div className="bookmark-notice" role="status">
          {bookmarkNotice}
        </div>
      ) : null}

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
                isBookmarking={bookmarkingIds.includes(method.id)}
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
