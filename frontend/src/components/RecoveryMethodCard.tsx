import type { RecoveryMethod } from '../types'

type RecoveryMethodCardProps = {
  bookmarked?: boolean
  method: RecoveryMethod
  onBookmark?: (method: RecoveryMethod) => void
  onSelect: (method: RecoveryMethod) => void
  showReason?: boolean
}

export function RecoveryMethodCard({
  bookmarked = false,
  method,
  onBookmark,
  onSelect,
  showReason = false,
}: RecoveryMethodCardProps) {
  return (
    <article className="method-card">
      <div className={'method-symbol tone-' + method.tone} aria-hidden="true">
        {method.symbol}
      </div>
      <div className="method-card-copy">
        <span className="method-meta">
          {method.category} · {method.duration}
        </span>
        <h3>{method.title}</h3>
        <p>{method.description}</p>
        {showReason && method.reason ? (
          <div className="suggestion-reason">
            <strong>AIのおすすめ理由</strong>
            <span>{method.reason}</span>
          </div>
        ) : null}
      </div>
      {onBookmark ? (
        <button
          aria-label={bookmarked ? method.title + 'の保存を解除' : method.title + 'を保存'}
          className={'bookmark-button' + (bookmarked ? ' is-bookmarked' : '')}
          onClick={() => onBookmark(method)}
          type="button"
        >
          {bookmarked ? '★' : '☆'}
        </button>
      ) : null}
      <button className="method-select-button" onClick={() => onSelect(method)} type="button">
        これを試す
        <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}
