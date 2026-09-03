import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import type { RecoveryMethod } from '../types'

type EvaluationPageProps = {
  isSaving: boolean
  method: RecoveryMethod
  onBack: () => void
  onSubmit: (rating: number, memo: string) => Promise<void>
}

export function EvaluationPage({
  isSaving,
  method,
  onBack,
  onSubmit,
}: EvaluationPageProps) {
  const [rating, setRating] = useState(8)
  const [memo, setMemo] = useState('')

  return (
    <div className="page focused-page">
      <PageHeader
        description="あなた自身の感覚が、次の提案をもっと自分らしくします。"
        eyebrow="REFLECTION · 3 / 3"
        onBack={onBack}
        title="回復できましたか？"
      />

      <section className="evaluation-card">
        <div className={'evaluation-method tone-' + method.tone}>
          <span aria-hidden="true">{method.symbol}</span>
          <div>
            <small>今回の回復クエスト</small>
            <strong>{method.title}</strong>
          </div>
        </div>

        <fieldset className="rating-fieldset">
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
            id="memo"
            maxLength={180}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="例：頭の中が少し静かになって、肩の力が抜けた"
            rows={4}
            value={memo}
          />
          <span className="character-count">{memo.length} / 180</span>
        </label>

        <button
          className="primary-button evaluation-submit"
          disabled={isSaving}
          onClick={() => void onSubmit(rating, memo)}
          type="button"
        >
          {isSaving ? 'AIが分析しています…' : '記録してAI分析を見る'}
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </div>
  )
}
