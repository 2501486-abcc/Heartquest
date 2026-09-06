import type { RecoveryMethod } from '../types'

type RecoveryMethodCardProps = {
  bookmarked?: boolean
  isBookmarking?: boolean
  method: RecoveryMethod
  onBookmark?: (method: RecoveryMethod) => void
  onSelect: (method: RecoveryMethod) => void
  showReason?: boolean
}

export function RecoveryMethodCard({
  bookmarked = false,
  isBookmarking = false,
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
          <span className="method-category">カテゴリ：{method.category}</span>
          <span>{method.duration}</span>
        </span>
        <h3>{method.title}</h3>
        <p>
          {method.description}
          {showReason && method.reason ? ` ${method.reason}` : ''}
        </p>
      </div>
      {onBookmark ? (
        <button
          aria-label={bookmarked ? method.title + 'の保存を解除' : method.title + 'を保存'}
          aria-busy={isBookmarking}
          className={'bookmark-button' + (bookmarked ? ' is-bookmarked' : '')}
          disabled={isBookmarking}
          onClick={() => onBookmark(method)}
          type="button"
        >
          {bookmarked ? '★' : '☆'}
        </button>
      ) : null}
      <button
        aria-label={`${method.title}を選ぶ`}
        className="method-card-select-surface"
        onClick={() => onSelect(method)}
        type="button"
      />
    </article>
  )
}
