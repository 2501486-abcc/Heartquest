import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import type { RecoveryMethod } from '../types'

type MethodSelectionPageProps = {
  onAiSuggestions: () => void
  onBack: () => void
  onSelect: (method: RecoveryMethod) => void
}

export function MethodSelectionPage({
  onAiSuggestions,
  onBack,
  onSelect,
}: MethodSelectionPageProps) {
  const [customTitle, setCustomTitle] = useState('')

  const selectCustomMethod = () => {
    if (!customTitle.trim()) return
    onSelect({
      id: 'custom-' + Date.now(),
      title: customTitle.trim(),
      description: '自分で決めた回復方法',
      duration: '自由',
      category: 'マイプラン',
      symbol: '✎',
      tone: 'rose',
      source: 'custom',
    })
  }

  return (
    <div className="page method-selection-page">
      <PageHeader
        eyebrow="RECOVERY · 2 / 3"
        onBack={onBack}
        title="今日は、どうやって回復する？"
      />

      <section className="ai-invite-card">
        <div className="ai-spark" aria-hidden="true">✦</div>
        <div>
          <span>AI RECOVERY GUIDE</span>
          <h2>迷ったら、AIと一緒に探せます</h2>
          <p>これまでの記録から「定番」と「まだ試していない方法」を提案します。</p>
        </div>
        <button className="secondary-button light-button" onClick={onAiSuggestions} type="button">
          AIに提案してもらう
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="custom-method">
        <div>
          <p className="eyebrow">YOUR OWN IDEA</p>
          <h2>自分で回復方法を決める</h2>
        </div>
        <div className="custom-method-form">
          <label className="sr-only" htmlFor="custom-method">回復方法</label>
          <input
            id="custom-method"
            onChange={(event) => setCustomTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') selectCustomMethod()
            }}
            placeholder="例：ベランダでコーヒーを飲む"
            value={customTitle}
          />
          <button
            className="secondary-button"
            disabled={!customTitle.trim()}
            onClick={selectCustomMethod}
            type="button"
          >
            この方法で進む
          </button>
        </div>
      </section>
    </div>
  )
}
