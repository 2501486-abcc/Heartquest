import { useState } from 'react'
import type { AiAnalysis, RecoveryEntry, Screen } from '../types'

type AnalysisPageProps = {
  analysis: AiAnalysis | null
  latestRecovery?: RecoveryEntry
  onNavigate: (screen: Screen) => void
  recoveries: RecoveryEntry[]
}

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(new Date(date))

export function AnalysisPage({ analysis, latestRecovery, onNavigate, recoveries }: AnalysisPageProps) {
  const [period, setPeriod] = useState<'today' | 'recent'>('today')
  const recentRecoveries = recoveries.filter((item) => item.rating > 0).slice(0, 3).reverse()
  const recentAverage = recentRecoveries.length
    ? recentRecoveries.reduce((total, item) => total + item.rating, 0) / recentRecoveries.length
    : 0
  const hasStoredSummary = Boolean(latestRecovery?.aiComment)

  if (!analysis && !hasStoredSummary) {
    return (
      <div className="page hq-analysis-page">
        <header className="hq-screen-heading">
          <span className="hq-brand-orb" aria-hidden="true">h</span>
          <div><span>今日の回復</span><strong>AIフィードバック</strong></div>
        </header>
        <section className="hq-empty-state">
          <span aria-hidden="true">◡</span>
          <h1>今日のフィードバックは<br />まだありません。</h1>
          <p>ホームで今の気分を選び、回復を記録するとAIと一緒に振り返れます。</p>
          <button className="hq-primary-action" onClick={() => onNavigate('home')} type="button">
            ホームで回復を始める <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    )
  }

  const selfScore = latestRecovery?.rating ?? analysis?.score ?? 0
  const aiScore = analysis?.score ?? latestRecovery?.aiScore ?? 0
  const title = analysis?.title ?? '今日の回復を振り返りました。'
  const summary = analysis?.summary ?? latestRecovery?.aiComment ?? ''

  return (
    <div className="page hq-analysis-page">
      <header className="hq-screen-heading">
        <span className="hq-brand-orb" aria-hidden="true">h</span>
        <div><span>今日の回復</span><strong>AIフィードバック</strong></div>
      </header>

      <div className="hq-segmented-control" role="tablist" aria-label="分析する期間">
        <button aria-selected={period === 'today'} className={period === 'today' ? 'is-active' : ''} onClick={() => setPeriod('today')} role="tab" type="button">今日</button>
        <button aria-selected={period === 'recent'} className={period === 'recent' ? 'is-active' : ''} onClick={() => setPeriod('recent')} role="tab" type="button">最近の傾向</button>
      </div>

      {period === 'today' ? (
        <section className="hq-analysis-content">
          <div className="hq-analysis-kicker">
            <strong>{latestRecovery?.activity ?? '今日の回復'}</strong>
            <span>{latestRecovery ? formatShortDate(latestRecovery.createdAt) : '今日'}</span>
          </div>
          <h1>{title}</h1>

          <div className="hq-score-comparison" aria-label={`あなたの評価 ${selfScore.toFixed(1)}、AI参考スコア ${aiScore.toFixed(1)}`}>
            <div><span>あなたの評価</span><strong>{selfScore.toFixed(1)}</strong><i><b style={{ width: `${selfScore * 10}%` }} /></i></div>
            <div><span>AI参考スコア</span><strong>{aiScore.toFixed(1)}</strong><i><b style={{ width: `${aiScore * 10}%` }} /></i></div>
          </div>

          <section className="hq-analysis-reading">
            <span>今日のフィードバック</span>
            <p>{summary}</p>
            {analysis?.insights.length ? <p>{analysis.insights.join(' ')}</p> : null}
          </section>

          {analysis?.nextAction ? (
            <section className="hq-analysis-hint">
              <span>次回の小さなヒント</span>
              <p>{analysis.nextAction}</p>
            </section>
          ) : null}
        </section>
      ) : (
        <section className="hq-analysis-content">
          <div className="hq-analysis-kicker">
            <strong>直近{recentRecoveries.length}回の回復</strong>
            <span>平均 {recentAverage.toFixed(1)}</span>
          </div>
          <h1>最近の回復を、<br />ゆっくり見渡す。</h1>
          {recentRecoveries.length ? (
            <>
              <div className="hq-recent-chart" role="img" aria-label={recentRecoveries.map((item) => `${formatShortDate(item.createdAt)} ${item.rating}点`).join('、')}>
                {recentRecoveries.map((item) => (
                  <div key={item.id}>
                    <span>{item.rating}</span>
                    <i style={{ height: `${Math.max(10, item.rating * 10)}%` }} />
                    <small>{formatShortDate(item.createdAt)}</small>
                  </div>
                ))}
              </div>
              <section className="hq-analysis-reading">
                <span>最近の傾向</span>
                <p>直近の自己評価は平均{recentAverage.toFixed(1)}点です。数字だけで決めつけず、その日に感じたことと一緒に振り返りましょう。</p>
              </section>
            </>
          ) : <p className="hq-muted-copy">評価を記録すると、最近の傾向が表示されます。</p>}
        </section>
      )}
    </div>
  )
}
