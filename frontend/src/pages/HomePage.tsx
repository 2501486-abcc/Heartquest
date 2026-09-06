import { useState } from 'react'
import type { User } from '../types'

type HomePageProps = {
  onContinue: (mood: number) => void
  user: User
}

const moods = [
  { label: 'かなり疲れた' },
  { label: '少し疲れた' },
  { label: 'ふつう' },
  { label: '穏やか' },
  { label: '元気' },
]

export function HomePage({ onContinue, user }: HomePageProps) {
  const [moodIndex, setMoodIndex] = useState(2)
  const selectedMood = moods[moodIndex]
  const moodValue = moodIndex + 1

  const moveMood = (difference: number) => {
    setMoodIndex((current) => Math.min(4, Math.max(0, current + difference)))
  }

  return (
    <div className="page hq-home-page">
      <section className="hq-home-checkin" aria-labelledby="home-checkin-title">
        <div className="hq-home-intro">
          <p>{user.displayName}さん、今日もおつかれさまです。</p>
          <h1 id="home-checkin-title">いまの自分に、<br />近い気分は？</h1>
        </div>

        <div className="hq-mood-picker">
          <button
            aria-label="一つ前の気分"
            disabled={moodIndex === 0}
            onClick={() => moveMood(-1)}
            type="button"
          >
            ‹
          </button>
          <div aria-live="polite">
            <span
              aria-hidden="true"
              className={`hq-mood-character is-mood-${moodIndex + 1}`}
            />
            <strong>{selectedMood.label}</strong>
            <small>{moodValue} / 5</small>
          </div>
          <button
            aria-label="一つ次の気分"
            disabled={moodIndex === 4}
            onClick={() => moveMood(1)}
            type="button"
          >
            ›
          </button>
        </div>

        <div className="hq-home-actions">
          <button className="hq-primary-action" onClick={() => onContinue(moodValue)} type="button">
            次へ進む
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </div>
  )
}
