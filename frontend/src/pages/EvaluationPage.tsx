import { useState } from 'react'
import type { RecoveryEntry, RecoveryMethod } from '../types'

type EvaluationPageProps = {
  isSaving: boolean
  savedRecovery: RecoveryEntry | null
  method: RecoveryMethod
  onBack: () => void
  onSubmit: (rating: number, memo: string) => Promise<void>
}

export function EvaluationPage({
  isSaving,
  savedRecovery,
  method,
  onBack,
  onSubmit,
}: EvaluationPageProps) {
  const [rating, setRating] = useState(savedRecovery?.rating ?? 8)
  const [memo, setMemo] = useState(savedRecovery?.memo ?? '')

  return (
    <div className="page focused-page evaluation-page">
      <header className="evaluation-page-header">
        <button className="back-button" onClick={onBack} type="button">
          <span aria-hidden="true">←</span>
          戻る
        </button>
        <p className="eyebrow">RECOVERY · 3 / 3</p>
      </header>

      <section className="evaluation-card">
        <div className={'evaluation-method tone-' + method.tone}>
          <span aria-hidden="true">{method.symbol}</span>
          <div>
            <small>今回の回復クエスト</small>
            <strong>{method.title}</strong>
          </div>
        </div>

        <fieldset className="rating-fieldset" disabled={isSaving || savedRecovery !== null}>
          <legend>回復できた度合い</legend>
          <div className="rating-value" aria-live="polite">
            <strong>{rating}</strong>
            <span>/ 10</span>
          </div>
          <div className="rating-scale">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
              <label className={rating === value ? 'is-selected' : ''} key={value}>
                <input
                  checked={rating === value}
                  name="rating"
                  onChange={() => setRating(value)}
                  type="radio"
                  value={value}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
          <div className="scale-caption">
            <span>あまり回復できなかった</span>
            <span>とても回復できた</span>
          </div>
        </fieldset>

        <label className="memo-field" htmlFor="memo">
          <span>どんな変化がありましたか？</span>
          <small>任意</small>
          <textarea
            disabled={isSaving || savedRecovery !== null}
            id="memo"
            maxLength={180}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="例：頭の中が少し静かになって、肩の力が抜けた"
            rows={2}
            value={memo}
          />
          <span className="character-count">{memo.length} / 180</span>
        </label>

        <p className="evaluation-note">{savedRecovery
          ? '記録は保存済みです。再試行ではAI分析だけを行います。'
          : '感想と過去の回復記録をAI分析に利用します。メールアドレスやパスワードなどの秘密情報は入力しないでください。'}</p>

        <button
          className="primary-button evaluation-submit"
          disabled={isSaving}
          onClick={() => void onSubmit(rating, memo)}
          type="button"
        >
          {isSaving ? '保存・AI分析を処理しています…' : savedRecovery ? 'AI分析を再試行する' : '記録してAI分析を見る'}
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </div>
  )
}
