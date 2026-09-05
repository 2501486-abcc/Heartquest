import type { CSSProperties } from 'react'
import { PageHeader } from '../components/PageHeader'
import type { AiAnalysis, RecoveryEntry, Screen } from '../types'

type AnalysisPageProps = {
  analysis: AiAnalysis | null
  latestRecovery?: RecoveryEntry
  onNavigate: (screen: Screen) => void
}

export function AnalysisPage({
  analysis,
  latestRecovery,
  onNavigate,
}: AnalysisPageProps) {
  if (!analysis) {
    return (
      <div className="page">
        <PageHeader description="回復を記録して、AIと一緒に振り返りましょう。" eyebrow="YOUR RECOVERY INSIGHT" title="AI分析レポート" />
        <p>このセッションのAI分析はまだありません。回復を記録すると分析できます。過去の回復記録はホームやグラフで確認できます。</p>
        <button className="primary-button" onClick={() => onNavigate('recovery')} type="button">回復を記録する</button>
      </div>
    )
  }
  return (
    <div className="page">
      <PageHeader
        description="自己評価と感想、これまでの記録から見つかった傾向です。"
        eyebrow="YOUR RECOVERY INSIGHT"
        title="AI分析レポート"
      />

      <section className="analysis-hero">
        <div
          className="analysis-score"
          style={{ '--score': analysis.score * 10 + '%' } as CSSProperties}
          aria-label={'AI回復スコア ' + analysis.score.toFixed(1)}
        >
          <span>AI SCORE</span>
          <strong>{analysis.score.toFixed(1)}</strong>
          <small>/ 10</small>
        </div>
        <div className="analysis-copy">
          <span className="analysis-badge">✦ AI ANALYSIS</span>
          <h2>{analysis.title}</h2>
          <p>{analysis.summary}</p>
          {latestRecovery ? (
            <div className="latest-recovery-chip">
              <span aria-hidden="true">✓</span>
              {latestRecovery.activity}を記録しました
            </div>
          ) : null}
        </div>
      </section>

      <section className="insight-grid">
        <article className="insight-list-card">
          <p className="eyebrow">WHAT WE FOUND</p>
          <h2>今回わかったこと</h2>
          <ol>
            {analysis.insights.map((insight, index) => (
              <li key={insight}>
                <span>{index + 1}</span>
                <p>{insight}</p>
              </li>
            ))}
          </ol>
        </article>
        <article className="next-action-card">
          <span className="next-action-symbol" aria-hidden="true">↗</span>
          <p className="eyebrow">NEXT SMALL STEP</p>
          <h2>次に試してほしいこと</h2>
          <p>{analysis.nextAction}</p>
          <button className="secondary-button" onClick={() => onNavigate('recovery')} type="button">
            次の回復をはじめる
          </button>
        </article>
      </section>

      <div className="analysis-actions">
        <button className="text-button large-text-button" onClick={() => onNavigate('home')} type="button">
          ホームへ戻る
        </button>
        <button className="primary-button" onClick={() => onNavigate('charts')} type="button">
          回復傾向のグラフを見る
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
