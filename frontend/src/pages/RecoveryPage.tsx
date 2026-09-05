import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'

type RecoveryPageProps = {
  initialMood: number
  onBack: () => void
  onContinue: (mood: number) => void
}

const moods = [
  { score: 1, face: '×', label: 'かなり疲れた' },
  { score: 2, face: '⌒', label: '少し疲れた' },
  { score: 3, face: '—', label: 'ふつう' },
  { score: 4, face: '◡', label: 'まずまず' },
  { score: 5, face: '✦', label: '元気' },
]

export function RecoveryPage({
  initialMood,
  onBack,
  onContinue,
}: RecoveryPageProps) {
  const [mood, setMood] = useState(initialMood)

  return (
    <div className="page focused-page recovery-checkin-page">
      <PageHeader
        eyebrow="RECOVERY · 1 / 3"
        onBack={onBack}
        title="今の調子は、どのくらい？"
      />

      <section className="checkin-card">
        <div className="mood-orb" aria-hidden="true">
          <span>{moods[mood - 1].face}</span>
          <i className="orb-leaf orb-leaf-one" />
          <i className="orb-leaf orb-leaf-two" />
        </div>
        <fieldset className="mood-fieldset">
          <legend>いちばん近いものを選んでください</legend>
          <div className="mood-options">
            {moods.map((item) => (
              <label className={mood === item.score ? 'is-selected' : ''} key={item.score}>
                <input
                  checked={mood === item.score}
                  name="mood"
                  onChange={() => setMood(item.score)}
                  type="radio"
                  value={item.score}
                />
                <strong>{item.score}</strong>
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="checkin-footer">
          <button className="primary-button" onClick={() => onContinue(mood)} type="button">
            回復方法を選ぶ
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </div>
  )
}
