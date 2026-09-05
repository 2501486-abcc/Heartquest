import { useState, type CSSProperties } from 'react'
import type { AnalyticsData, RecoveryEntry } from '../types'

type ChartsPageProps = {
  analytics: AnalyticsData
  recoveries: RecoveryEntry[]
}

const categoryColors = ['#c87964', '#7f987f', '#dfaa75', '#9cae99', '#c3b4a8', '#8ea6aa']

const recoveryScore = (entry: RecoveryEntry) => entry.aiScore || entry.rating

function monthlyRanking(entries: RecoveryEntry[]) {
  const groups = new Map<string, { count: number; total: number }>()
  entries.forEach((entry) => {
    const current = groups.get(entry.activity) ?? { count: 0, total: 0 }
    groups.set(entry.activity, { count: current.count + 1, total: current.total + recoveryScore(entry) })
  })
  return [...groups.entries()]
    .map(([label, value]) => ({ label, count: value.count, score: value.total / value.count }))
    .sort((a, b) => b.score - a.score || b.count - a.count || a.label.localeCompare(b.label, 'ja'))
}

function monthlyBreakdown(entries: RecoveryEntry[]) {
  const groups = new Map<string, number>()
  entries.forEach((entry) => {
    const category = entry.category?.trim() || '未分類'
    groups.set(category, (groups.get(category) ?? 0) + 1)
  })
  return [...groups.entries()]
    .map(([label, count], index) => ({
      label,
      count,
      percentage: entries.length ? count * 100 / entries.length : 0,
      color: categoryColors[index % categoryColors.length],
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ja'))
}

function MonthlyLineChart({ analytics, selectedIndex }: { analytics: AnalyticsData; selectedIndex: number }) {
  const count = analytics.monthly.length
  const xFor = (index: number) => count <= 1 ? 320 : 24 + index * (592 / (count - 1))
  const yFor = (score: number) => 174 - Math.max(0, Math.min(10, score)) * 14
  const points = analytics.monthly.map((month, index) => `${xFor(index)},${yFor(month.score)}`).join(' ')
  const area = count ? `${points} ${xFor(count - 1)},184 ${xFor(0)},184` : ''

  return (
    <div className="hq-monthly-line">
      <svg viewBox="0 0 640 190" role="img" aria-label={analytics.monthly.map((month) => `${month.label} ${month.score.toFixed(1)}点`).join('、')}>
        {[34, 76, 118, 160].map((y) => <line key={y} x1="20" x2="620" y1={y} y2={y} />)}
        {area ? <polygon points={area} /> : null}
        {points ? <polyline points={points} /> : null}
        {analytics.monthly.map((month, index) => (
          <circle className={selectedIndex === index ? 'is-selected' : ''} cx={xFor(index)} cy={yFor(month.score)} key={month.month} r={selectedIndex === index ? 7 : 5} />
        ))}
      </svg>
      <div style={{ '--month-count': Math.max(1, count) } as CSSProperties}>
        {analytics.monthly.map((month, index) => <span className={selectedIndex === index ? 'is-selected' : ''} key={month.month}>{month.label}</span>)}
      </div>
    </div>
  )
}

export function ChartsPage({ analytics, recoveries }: ChartsPageProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, analytics.monthly.length - 1))

  const selectedMonth = analytics.monthly[selectedIndex]
  const selectedEntries = selectedMonth
    ? recoveries.filter((entry) => entry.createdAt.slice(0, 7) === selectedMonth.month && recoveryScore(entry) > 0)
    : []
  const ranking = monthlyRanking(selectedEntries)
  const breakdown = monthlyBreakdown(selectedEntries)
  const previousMonth = analytics.monthly[selectedIndex - 1]
  const scoreDifference = selectedMonth && previousMonth ? selectedMonth.score - previousMonth.score : null
  const podium = [ranking[1], ranking[0], ranking[2]].filter(Boolean).map((item) => ({ ...item, rank: ranking.indexOf(item) + 1 }))
  const storyTitle = !selectedMonth?.count
    ? 'この月は、まだ回復の記録がありません。'
    : selectedMonth.score >= 7.5
      ? '少しずつ、自分に合う休み方が見えてきました。'
      : selectedMonth.score >= 5
        ? '小さな回復を、ゆっくり積み重ねた月でした。'
        : '無理のないペースで、回復を振り返りましょう。'

  return (
    <div className="page hq-record-page">
      <header className="hq-screen-heading">
        <span className="hq-brand-orb" aria-hidden="true">h</span>
        <div><span>MY RECOVERY</span><strong>回復の記録</strong></div>
      </header>

      <div className="hq-month-picker">
        <button aria-label="前の月" disabled={selectedIndex === 0 || !analytics.monthly.length} onClick={() => setSelectedIndex((value) => Math.max(0, value - 1))} type="button">‹</button>
        <strong>{selectedMonth?.label ?? '記録なし'}</strong>
        <button aria-label="次の月" disabled={!analytics.monthly.length || selectedIndex >= analytics.monthly.length - 1} onClick={() => setSelectedIndex((value) => Math.min(analytics.monthly.length - 1, value + 1))} type="button">›</button>
      </div>

      <section className="hq-record-story">
        <span className="hq-overline">MONTHLY STORY</span>
        <h1>{storyTitle}</h1>
        <div className="hq-month-score">
          <div><span>月ごとの平均回復スコア</span><strong>{(selectedMonth?.score ?? 0).toFixed(1)}<small>/10</small></strong></div>
          <p>
            回復の記録は{selectedMonth?.count ?? 0}回。
            {ranking[0] ? `${ranking[0].label}が平均${ranking[0].score.toFixed(1)}点でした。` : '記録を続けると傾向が見えてきます。'}
          </p>
          {scoreDifference !== null ? <em>{scoreDifference >= 0 ? '先月より' : '先月から'} {scoreDifference >= 0 ? '+' : ''}{scoreDifference.toFixed(1)}</em> : null}
        </div>
        <MonthlyLineChart analytics={analytics} selectedIndex={selectedIndex} />
      </section>

      <section className="hq-record-block">
        <div className="hq-block-heading"><h2>回復方法ランキング</h2><span>{selectedMonth?.label ?? ''}</span></div>
        {podium.length ? (
          <div className="hq-podium">
            {podium.map((item) => (
              <div className={item.rank === 1 ? 'is-first' : ''} key={item.label}>
                <b>{item.rank}</b><strong>{item.label}</strong><span>平均 {item.score.toFixed(1)}</span><small>{item.count}回</small>
              </div>
            ))}
          </div>
        ) : <p className="hq-muted-copy">この月に評価された回復方法はありません。</p>}
      </section>

      <section className="hq-record-block">
        <div className="hq-block-heading"><h2>カテゴリの内訳</h2><span>{selectedEntries.length}回</span></div>
        {breakdown.length ? (
          <>
            <div className="hq-stacked-chart" role="img" aria-label={breakdown.map((item) => `${item.label} ${item.percentage.toFixed(0)}%`).join('、')}>
              {breakdown.map((item) => <i key={item.label} style={{ background: item.color, width: `${item.percentage}%` }} />)}
            </div>
            <div className="hq-category-legend">
              {breakdown.map((item) => <span key={item.label}><i style={{ background: item.color }} /><strong>{item.percentage.toFixed(0)}%</strong>{item.label}</span>)}
            </div>
          </>
        ) : <p className="hq-muted-copy">この月のカテゴリデータはまだありません。</p>}
      </section>
    </div>
  )
}
