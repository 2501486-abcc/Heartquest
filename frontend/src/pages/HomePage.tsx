import type { CSSProperties } from 'react'
import type { RecoveryEntry, Screen, User } from '../types'

type HomePageProps = {
  onNavigate: (screen: Screen) => void
  recoveries: RecoveryEntry[]
  user: User
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))

const formatCurrentDate = () => {
  const now = new Date()
  const weekday = new Intl.DateTimeFormat('ja-JP', { weekday: 'long' }).format(now)

  return `${now.getFullYear()}年　${now.getMonth() + 1}月${now.getDate()}日　${weekday}`
}

export function HomePage({ onNavigate, recoveries, user }: HomePageProps) {
  const average = recoveries.length
    ? recoveries.reduce((total, recovery) => total + recovery.rating, 0) /
      recoveries.length
    : 0

  return (
    <div className="page home-page">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{formatCurrentDate()}</p>
          <h1>こんにちは、{user.displayName}さん。</h1>
          <p className="page-lead">今日は、どんなふうに自分を休ませてあげますか？</p>
        </div>
        <div className="streak-badge" aria-label="3日連続で記録中">
          <span aria-hidden="true">✦</span>
          <strong>3</strong>
          <span>日連続</span>
        </div>
      </section>

      <section className="recovery-hero">
        <div className="recovery-copy">
          <span className="soft-label">TODAY'S QUEST</span>
          <h2>今のあなたに、<br />小さな回復を。</h2>
          <p>1分のチェックインから、ぴったりの休み方を一緒に探します。</p>
          <button
            className="primary-button"
            onClick={() => onNavigate('recovery')}
            type="button"
          >
            回復クエストをはじめる
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="recovery-visual" aria-hidden="true">
          <div className="sun-shape">☼</div>
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <span className="sparkle sparkle-one">✦</span>
          <span className="sparkle sparkle-two">·</span>
        </div>
      </section>

      <section className="home-grid">
        <article className="summary-card">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">THIS WEEK</p>
              <h2>今週の回復</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate('charts')} type="button">
              詳しく見る →
            </button>
          </div>
          <div className="summary-content">
            <div
              className="score-ring"
              style={{ '--score': `${average * 10}%` } as CSSProperties}
              aria-label={`平均評価 ${average.toFixed(1)}`}
            >
              <strong>{average.toFixed(1)}</strong>
              <span>/ 10</span>
            </div>
            <div className="summary-copy">
              <strong>いいペースです</strong>
              <p>先週より平均スコアが0.8アップ。短い散歩がよく効いています。</p>
              <div className="mini-bars" aria-hidden="true">
                {[5, 7, 6, 8, 7, 9, 8].map((value, index) => (
                  <span key={index} style={{ height: `${value * 8}%` }} />
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="history-card">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">RECENT LOG</p>
              <h2>最近の記録</h2>
            </div>
            <button className="icon-button" aria-label="分析を見る" onClick={() => onNavigate('analysis')} type="button">
              ↗
            </button>
          </div>
          <ul className="history-list">
            {recoveries.slice(0, 3).map((recovery) => (
              <li key={recovery.id}>
                <span className="history-icon" aria-hidden="true">
                  {recovery.activity.includes('散歩')
                    ? '♧'
                    : recovery.activity.includes('音楽')
                      ? '♫'
                      : '♨'}
                </span>
                <span className="history-copy">
                  <strong>{recovery.activity}</strong>
                  <span>{formatDate(recovery.createdAt)}</span>
                </span>
                <span className="history-score">{recovery.rating}<small>/10</small></span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}
