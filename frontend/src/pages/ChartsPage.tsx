import { PageHeader } from '../components/PageHeader'
import type { AnalyticsData } from '../types'

type ChartsPageProps = {
  analytics: AnalyticsData
  onBack: () => void
}

export function ChartsPage({ analytics, onBack }: ChartsPageProps) {
  const currentMonth = analytics.monthly[analytics.monthly.length - 1]
  const previousMonth = analytics.monthly[analytics.monthly.length - 2]
  const topRanking = analytics.ranking[0]
  const topBreakdown = analytics.breakdown[0]
  const scoreDifference = (currentMonth?.score ?? 0) - (previousMonth?.score ?? 0)
  const comparisonText = previousMonth?.count
    ? `先月比 ${scoreDifference >= 0 ? '+' : ''}${scoreDifference.toFixed(1)}`
    : '先月の評価データなし'
  const donutGradient = analytics.breakdown
    .reduce(
      (result, item, index) => {
        const start = analytics.breakdown
          .slice(0, index)
          .reduce((total, part) => total + part.percentage, 0)
        const end = start + item.percentage
        result.push(item.color + ' ' + start + '% ' + end + '%')
        return result
      },
      [] as string[],
    )
    .join(', ')
  const monthlyRange = analytics.monthly.length
    ? `${analytics.monthly[0].label}から${currentMonth.label}までの平均回復スコア。`
    : '月ごとの平均回復スコア。'

  return (
    <div className="page">
      <PageHeader
        description="これまでの記録から、月ごとの変化と効果の高い方法を表示しています。"
        eyebrow="RECOVERY ANALYTICS"
        onBack={onBack}
        title="あなたの回復傾向"
      />

      <section className="chart-overview">
        <article className="metric-card">
          <span>今月の平均</span>
          <strong>{(currentMonth?.score ?? 0).toFixed(1)}</strong>
          <small>{comparisonText}</small>
        </article>
        <article className="metric-card">
          <span>回復した回数</span>
          <strong>{currentMonth?.count ?? 0}</strong>
          <small>今月の記録</small>
        </article>
        <article className="metric-card">
          <span>いちばん合う方法</span>
          <strong className="metric-word">{topRanking?.label ?? '未集計'}</strong>
          <small>
            {topRanking ? `平均 ${topRanking.score.toFixed(1)} / 10` : '評価データがありません'}
          </small>
        </article>
      </section>

      <section className="charts-grid">
        <article className="chart-card monthly-chart-card">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">MONTHLY TREND</p>
              <h2>平均回復スコア</h2>
            </div>
            <span className="chart-legend-dot">自己評価</span>
          </div>
          <div
            className="bar-chart"
            aria-label={
              monthlyRange +
              analytics.monthly
                .map((month) => `${month.label} ${month.score.toFixed(1)}`)
                .join('、')
            }
            role="img"
          >
            <div className="bar-grid" aria-hidden="true">
              <span>10</span><i />
              <span>8</span><i />
              <span>6</span><i />
              <span>4</span><i />
              <span>2</span><i />
            </div>
            <div className="bars">
              {analytics.monthly.map((month) => (
                <div className="bar-column" key={month.label}>
                  <span className="bar-value">{month.score.toFixed(1)}</span>
                  <div className="bar-track">
                    <i style={{ height: month.score * 10 + '%' }} />
                  </div>
                  <strong>{month.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="chart-card donut-chart-card">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">BEST MATCHES</p>
              <h2>評価済み記録のカテゴリ内訳</h2>
            </div>
          </div>
          <div className="donut-layout">
            <div
              className="donut-chart"
              style={{
                background: donutGradient
                  ? 'conic-gradient(' + donutGradient + ')'
                  : '#e8e4dc',
              }}
              aria-label={
                '評価済み記録のカテゴリ割合。' +
                analytics.breakdown
                  .map((item) => `${item.label} ${item.percentage}%`)
                  .join('、')
              }
              role="img"
            >
              <span>
                <strong>{topBreakdown ? `${topBreakdown.percentage}%` : '0%'}</strong>
                {topBreakdown?.label ?? 'データなし'}
              </span>
            </div>
            <ul className="donut-legend">
              {analytics.breakdown.map((item) => (
                <li key={item.label}>
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.percentage}%</strong>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="ranking-card">
        <div className="chart-heading">
          <div>
            <p className="eyebrow">RECOVERY RANKING</p>
            <h2>あなたに合う回復方法ランキング</h2>
          </div>
          <span className="muted-text">全期間</span>
        </div>
        {analytics.ranking.length ? (
          <ol>
            {analytics.ranking.map((item, index) => (
              <li key={item.label}>
                <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.label}</strong>
                <div className="rank-bar"><i style={{ width: item.score * 10 + '%' }} /></div>
                <span className="rank-count">{item.count}回</span>
                <span className="rank-score">{item.score.toFixed(1)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted-text">評価を記録すると、ランキングが表示されます。</p>
        )}
      </section>
    </div>
  )
}
