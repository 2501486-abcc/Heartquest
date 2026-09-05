import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

type Concept = {
  id: 'A' | 'B' | 'C' | 'D' | 'E'
  name: string
  concept: string
  features: string[]
  benefits: string
  concerns: string
  difficulty: '低' | '低〜中' | '中'
  selected?: boolean
  screen: ReactNode
}

type DeviceProps = {
  children: ReactNode
  className: string
  label: string
}

const moodOptions = [
  { value: 1, face: '–', label: '重たい' },
  { value: 2, face: '⌒', label: '少し疲れた' },
  { value: 3, face: '•', label: 'ふつう' },
  { value: 4, face: '◡', label: '穏やか' },
  { value: 5, face: '⌣', label: '元気' },
]

function Device({ children, className, label }: DeviceProps) {
  return (
    <div className={`device ${className}`} aria-label={label}>
      <div className="device-speaker" aria-hidden="true" />
      <div className="device-screen">{children}</div>
    </div>
  )
}

function InlineNotice({ children }: { children: ReactNode }) {
  return <div className="inline-notice" role="status">{children}</div>
}

function HomeA() {
  const [notice, setNotice] = useState('')
  const [active, setActive] = useState('ホーム')

  const act = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1600)
  }

  return (
    <Device className="home-a" label="案A 基本的で分かりやすいホーム">
      <header className="a-header">
        <div>
          <span className="a-date">9月5日 土曜日</span>
          <h2>こんにちは、あゆとさん</h2>
        </div>
        <button className="avatar-button" onClick={() => act('プロフィールを開きます')} aria-label="プロフィールを開く">あ</button>
      </header>

      <main className="a-main">
        <section className="a-start-card">
          <span className="soft-kicker">TODAY</span>
          <h3>今の自分に合う休み方を<br />見つけましょう</h3>
          <p>気分を選ぶところから、1分で始められます。</p>
          <button className="a-primary" onClick={() => act('回復前のチェックへ進みます')}>
            回復をはじめる <span>→</span>
          </button>
          <div className="a-landscape" aria-hidden="true"><i /><i /><b>✦</b></div>
        </section>

        <section className="a-summary">
          <div className="a-section-title">
            <div><span>今週の回復</span><strong>7.8</strong><small>/ 10</small></div>
            <button onClick={() => act('回復傾向を開きます')}>傾向を見る</button>
          </div>
          <p><span className="a-positive-dot" />散歩と音楽が、気分転換につながっています。</p>
        </section>

        <section className="a-recent">
          <div className="a-section-title"><h3>最近の記録</h3><button onClick={() => act('履歴一覧を開きます')}>すべて見る</button></div>
          <button className="a-log" onClick={() => act('散歩の記録を開きます')}>
            <span className="a-log-symbol">♧</span><span><strong>川沿いを散歩</strong><small>9月4日 · 20分</small></span><b>8<small>/10</small></b>
          </button>
          <button className="a-log" onClick={() => act('音楽の記録を開きます')}>
            <span className="a-log-symbol">♫</span><span><strong>好きな音楽を3曲</strong><small>9月2日 · 12分</small></span><b>7<small>/10</small></b>
          </button>
        </section>
      </main>

      <nav className="a-bottom-nav" aria-label="案Aのナビゲーション">
        {['ホーム', '回復する', '履歴', '分析'].map((item) => (
          <button key={item} className={active === item ? 'is-active' : ''} onClick={() => { setActive(item); act(`${item}を選びました`) }}>
            <span aria-hidden="true">{item === 'ホーム' ? '⌂' : item === '回復する' ? '＋' : item === '履歴' ? '▤' : '⌁'}</span>{item}
          </button>
        ))}
      </nav>
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function HomeB() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const choose = (label: string) => {
    setSheetOpen(false)
    setNotice(`${label}へ進みます`)
    window.setTimeout(() => setNotice(''), 1600)
  }

  return (
    <Device className="home-b" label="案B 静かでミニマルなホーム">
      <header className="b-header">
        <button aria-label="メニューを開く" onClick={() => setNotice('メニューを開きます')}>⌁</button>
        <span className="b-wordmark">HeartQuest</span>
        <button aria-label="通知を開く" onClick={() => setNotice('新しい通知はありません')}>○</button>
      </header>
      <main className="b-main">
        <p className="b-date">2026.09.05</p>
        <h2>いま、休みたいですか？</h2>
        <p className="b-lead">答えを急がなくても大丈夫。<br />できそうなことを一つだけ。</p>

        <button className="b-start" onClick={() => setSheetOpen(true)}>
          <span className="b-start-orb" aria-hidden="true"><i>＋</i></span>
          <strong>回復をはじめる</strong>
          <small>1分のチェックイン</small>
        </button>

        <section className="b-last">
          <span>LAST RECOVERY</span>
          <button onClick={() => setNotice('前回の記録を開きます')}>
            <div><strong>夕方の散歩</strong><small>昨日 18:30</small></div>
            <div className="b-score"><strong>8</strong><small>/10</small></div>
          </button>
          <p>「外に出る」が最近の切り替えになっています。</p>
        </section>
      </main>
      <nav className="b-tabs" aria-label="案Bのナビゲーション">
        <button className="is-active" onClick={() => setNotice('ホームです')}>今日</button>
        <button onClick={() => setNotice('記録を開きます')}>記録</button>
        <button onClick={() => setNotice('気づきを開きます')}>気づき</button>
      </nav>

      {sheetOpen && (
        <div className="b-sheet-backdrop" onClick={() => setSheetOpen(false)}>
          <section className="b-sheet" onClick={(event) => event.stopPropagation()} aria-label="開始方法を選択">
            <div className="sheet-handle" />
            <h3>どう始めますか？</h3>
            <button onClick={() => choose('今の調子のチェック')}>今の調子から選ぶ <span>→</span></button>
            <button onClick={() => choose('AI回復ガイド')}>AIと一緒に探す <span>→</span></button>
            <button className="sheet-cancel" onClick={() => setSheetOpen(false)}>閉じる</button>
          </section>
        </div>
      )}
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function HomeC() {
  const [mood, setMood] = useState(2)
  const [notice, setNotice] = useState('')
  const messages = [
    '今日は、ひと息つくことからで十分です。',
    '少し疲れていますね。負担の少ない方法を探しましょう。',
    '今のペースに合う、小さな休み方があります。',
    '穏やかな時間を、もう少し育ててみましょう。',
    '元気を保てる過ごし方を選んでみましょう。',
  ]

  const act = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1600)
  }

  return (
    <Device className="home-c" label="案C 温かく回復体験に寄り添うホーム">
      <header className="c-header"><span className="c-logo">h</span><strong>HeartQuest</strong><button onClick={() => act('設定を開きます')} aria-label="設定を開く">•••</button></header>
      <main className="c-main">
        <section className="c-companion">
          <div className="c-orb" aria-hidden="true"><span>{moodOptions[mood].face}</span><i /></div>
          <div><span>こんにちは、あゆとさん</span><h2>{messages[mood]}</h2></div>
        </section>

        <section className="c-checkin">
          <div><h3>今のこころに近いものは？</h3><small>選ぶだけで大丈夫です</small></div>
          <div className="c-moods">
            {moodOptions.map((item, index) => (
              <button key={item.value} className={mood === index ? 'is-active' : ''} onClick={() => setMood(index)} aria-label={item.label}>
                <span>{item.face}</span><small>{item.label}</small>
              </button>
            ))}
          </div>
          <button className="c-primary" onClick={() => act(`${moodOptions[mood].label}気分に合う回復方法を探します`)}>この気分に合う回復を探す</button>
        </section>

        <section className="c-note">
          <span className="c-note-mark">♪</span>
          <div><small>昨日のあなたから</small><strong>音楽を3曲聴いたら、少し肩の力が抜けた</strong></div>
          <button onClick={() => act('昨日の記録を開きます')} aria-label="昨日の記録を開く">›</button>
        </section>
      </main>
      <nav className="c-bottom-nav" aria-label="案Cのナビゲーション">
        <button className="is-active" onClick={() => act('ホームです')}><span>⌂</span>ホーム</button>
        <button className="c-nav-center" onClick={() => act('回復方法を探します')}><span>＋</span>回復</button>
        <button onClick={() => act('記録を開きます')}><span>▤</span>記録</button>
      </nav>
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function HomeD() {
  const [selectedStop, setSelectedStop] = useState(1)
  const [notice, setNotice] = useState('')
  const stops = [
    { label: '気分を知る', detail: 'いまの状態を選ぶ', symbol: '○' },
    { label: '小さく試す', detail: '5〜15分の回復', symbol: '◇' },
    { label: '発見を残す', detail: '自分の感覚を記録', symbol: '□' },
  ]

  const act = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1600)
  }

  return (
    <Device className="home-d" label="案D クエスト・探索感を取り入れたホーム">
      <header className="d-header">
        <button onClick={() => act('探索メニューを開きます')} aria-label="メニューを開く">☰</button>
        <div><span>HEARTQUEST</span><strong>回復の地図</strong></div>
        <button className="d-avatar" onClick={() => act('プロフィールを開きます')}>あ</button>
      </header>
      <main className="d-main">
        <section className="d-intro">
          <span>今日の小さな探索</span>
          <h2>自分に合う休み方を<br />ひとつ見つけよう</h2>
          <p>競争も、締め切りもありません。</p>
        </section>

        <section className="d-map" aria-label="回復の進め方">
          <div className="d-route" aria-hidden="true" />
          {stops.map((stop, index) => (
            <button key={stop.label} className={`d-stop d-stop-${index + 1} ${selectedStop === index ? 'is-active' : ''}`} onClick={() => setSelectedStop(index)}>
              <span>{stop.symbol}</span><div><small>STEP {index + 1}</small><strong>{stop.label}</strong><em>{stop.detail}</em></div>
            </button>
          ))}
          <span className="d-map-mark d-map-mark-one" aria-hidden="true">✦</span>
          <span className="d-map-mark d-map-mark-two" aria-hidden="true">·</span>
        </section>

        <button className="d-primary" onClick={() => act(`${stops[selectedStop].label}から始めます`)}>
          {stops[selectedStop].label}から始める <span>→</span>
        </button>

        <section className="d-discovery">
          <span>最近の発見</span><strong>「夕方 × 外の空気」が合っているかも</strong>
          <button onClick={() => act('発見の詳細を開きます')}>詳しく見る</button>
        </section>
      </main>
      <nav className="d-bottom-nav" aria-label="案Dのナビゲーション">
        <button className="is-active" onClick={() => act('拠点です')}><span>⌂</span>拠点</button>
        <button onClick={() => act('記録を開きます')}><span>▤</span>記録</button>
        <button onClick={() => act('発見を開きます')}><span>✦</span>発見</button>
      </nav>
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function HomeE() {
  const [selected, setSelected] = useState(0)
  const [notice, setNotice] = useState('')
  const actions = [
    { time: '3分', title: '目を閉じて深呼吸', tag: 'すぐできる', color: 'peach' },
    { time: '12分', title: '好きな音楽を3曲', tag: '最近よかった', color: 'blue' },
    { time: '20分', title: '緑のある道を散歩', tag: 'AIの提案', color: 'green' },
  ]

  const act = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1600)
  }

  return (
    <Device className="home-e" label="案E 大胆だが実装可能なホーム">
      <header className="e-header"><strong>HQ</strong><span>9.05<br /><small>SAT</small></span><button onClick={() => act('メニューを開きます')} aria-label="メニューを開く">＝</button></header>
      <main className="e-main">
        <section className="e-hero">
          <span>MAKE SPACE</span>
          <h2>余白を、<br />ひとつ。</h2>
          <p>考え込まずに選べる、今日の回復。</p>
        </section>

        <section className={`e-action e-${actions[selected].color}`}>
          <div className="e-action-top"><span>{actions[selected].tag}</span><strong>{actions[selected].time}</strong></div>
          <h3>{actions[selected].title}</h3>
          <button onClick={() => act(`${actions[selected].title}を始めます`)}>これを試す <span>↗</span></button>
        </section>

        <div className="e-selector" aria-label="回復方法の候補">
          {actions.map((action, index) => <button key={action.title} className={selected === index ? 'is-active' : ''} onClick={() => setSelected(index)}><span>{index + 1}</span>{action.time}</button>)}
        </div>

        <section className="e-snapshot">
          <div><span>THIS MONTH</span><strong>7.8<small>/10</small></strong></div>
          <p>外に出た日の評価が<br /><strong>1.2 高め</strong>です。</p>
          <button onClick={() => act('今月の気づきを開きます')} aria-label="今月の気づきを開く">→</button>
        </section>
      </main>
      <nav className="e-dock" aria-label="案Eのナビゲーション">
        <button className="is-active" onClick={() => act('ホームです')}>⌂</button>
        <button onClick={() => act('回復を新しく始めます')}>＋</button>
        <button onClick={() => act('履歴を開きます')}>▤</button>
        <button onClick={() => act('分析を開きます')}>⌁</button>
      </nav>
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

const round2Moods = ['かなり疲れた', '少し疲れた', 'ふつう', '穏やか', '元気']

function Round2Nav({
  active = 'ホーム',
  onAction,
}: {
  active?: 'ホーム' | '分析' | '記録'
  onAction: (message: string) => void
}) {
  return (
    <nav className="r2-nav" aria-label="Round 2のナビゲーション">
      <button className={active === 'ホーム' ? 'is-active' : ''} onClick={() => onAction('ホームを開きます')}><span>⌂</span>ホーム</button>
      <button className={active === '分析' ? 'is-active' : ''} onClick={() => onAction('分析を開きます')}><span>⌁</span>分析</button>
      <button className={active === '記録' ? 'is-active' : ''} onClick={() => onAction('記録を開きます')}><span>▤</span>記録</button>
    </nav>
  )
}

function useNotice() {
  const [notice, setNotice] = useState('')
  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1800)
  }
  return { notice, showNotice }
}

function Home2A() {
  const [mood, setMood] = useState(1)
  const { notice, showNotice } = useNotice()

  return (
    <Device className="round2-home r2-a" label="Round 2 案A 温かなチェックイン">
      <header className="r2-header">
        <div className="r2-brand"><span>h</span><strong>HeartQuest</strong></div>
        <button onClick={() => showNotice('プロフィールを開きます')} aria-label="プロフィールを開く">あ</button>
      </header>
      <main className="r2-main">
        <div className="r2-quest-label"><span>01</span> 今日の小さなクエスト</div>
        <h2>こんにちは。<br />今の心に、少し余白を。</h2>
        <p className="r2-lead">今日はどんな調子ですか？近いものを一つ選んでください。</p>

        <section className="r2-mood-panel">
          <div className="r2-mood-row">
            {round2Moods.map((label, index) => (
              <button key={label} className={mood === index ? 'is-active' : ''} onClick={() => setMood(index)} aria-label={label}>
                <span>{['–', '⌒', '•', '◡', '⌣'][index]}</span><small>{index + 1}</small>
              </button>
            ))}
          </div>
          <strong>{round2Moods[mood]}</strong>
        </section>

        <button className="r2-primary" onClick={() => showNotice(`${round2Moods[mood]}気分に合う回復方法を探します`)}>この気分に合う回復を探す <span>→</span></button>
        <button className="r2-secondary" onClick={() => showNotice('自分で回復方法を選びます')}>自分で回復方法を選ぶ</button>

        <div className="r2-insight-line"><span>昨日の気づき</span><p>音楽を聴いたあと、肩の力が少し抜けました。</p></div>
      </main>
      <Round2Nav onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Home2B() {
  const [mood, setMood] = useState(1)
  const { notice, showNotice } = useNotice()
  const moveMood = (difference: number) => setMood((value) => clamp(value + difference, 0, 4))

  return (
    <Device className="round2-home r2-b" label="Round 2 案B 余白のチェックイン">
      <header className="r2-header r2-b-header">
        <div className="r2-brand"><span>h</span><strong>HeartQuest</strong></div>
        <button onClick={() => showNotice('メニューを開きます')} aria-label="メニューを開く">•••</button>
      </header>
      <main className="r2-b-main">
        <span className="r2-b-step">QUEST 01 · CHECK IN</span>
        <h2>いまの自分に、<br />近い気分は？</h2>
        <p>うまく言葉にできなくても大丈夫です。</p>

        <div className="r2-b-picker">
          <button onClick={() => moveMood(-1)} disabled={mood === 0} aria-label="一つ前の気分">‹</button>
          <div><span>{['–', '⌒', '•', '◡', '⌣'][mood]}</span><strong>{round2Moods[mood]}</strong><small>{mood + 1} / 5</small></div>
          <button onClick={() => moveMood(1)} disabled={mood === 4} aria-label="一つ次の気分">›</button>
        </div>

        <button className="r2-primary" onClick={() => showNotice('静かな回復候補を表示します')}>次へ進む <span>→</span></button>
        <button className="r2-text-action" onClick={() => showNotice('AIと一緒に回復方法を探します')}>迷ったらAIと一緒に探す</button>
      </main>
      <Round2Nav onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Home2C() {
  const [need, setNeed] = useState(0)
  const { notice, showNotice } = useNotice()
  const needs = [
    { label: '静かに休みたい', face: '⌒', reply: '考えなくていい、静かな休み方を探しましょう。' },
    { label: '少し動きたい', face: '◡', reply: '無理のない動きで、気分を切り替えてみましょう。' },
    { label: 'まだ分からない', face: '•', reply: '分からないままで大丈夫。いくつか一緒に見てみましょう。' },
  ]

  return (
    <Device className="round2-home r2-c" label="Round 2 案C やさしい相棒">
      <header className="r2-header">
        <div className="r2-brand"><span>h</span><strong>HeartQuest</strong></div>
        <button onClick={() => showNotice('設定を開きます')} aria-label="設定を開く">•••</button>
      </header>
      <main className="r2-main r2-c-main">
        <div className="r2-c-message">
          <div className="r2-c-orb" aria-hidden="true">{needs[need].face}</div>
          <div><span>今日の案内役</span><h2>{needs[need].reply}</h2></div>
        </div>

        <section className="r2-c-choices">
          <h3>今は、どれが近いですか？</h3>
          <div>
            {needs.map((item, index) => (
              <button key={item.label} className={need === index ? 'is-active' : ''} onClick={() => setNeed(index)}>{item.label}</button>
            ))}
          </div>
        </section>

        <div className="r2-c-quest"><span>小さなクエスト</span><strong>選ぶ → 試す → 振り返る</strong></div>
        <button className="r2-primary" onClick={() => showNotice(`${needs[need].label}時の回復方法を提案します`)}>休み方を提案してもらう <span>→</span></button>
        <button className="r2-secondary" onClick={() => showNotice('回復方法一覧を開きます')}>一覧から自分で選ぶ</button>
      </main>
      <Round2Nav onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Home2D() {
  const [step, setStep] = useState(0)
  const { notice, showNotice } = useNotice()
  const steps = [
    { title: '今の調子を知る', description: '言葉にしにくい時は、5つの気分から選ぶだけで大丈夫です。', action: '気分を選ぶ' },
    { title: '小さな回復を試す', description: '今の状態に合う、5〜15分の回復方法を見つけます。', action: '回復方法を見る' },
    { title: '自分の発見を残す', description: 'よかったことも、合わなかったことも次のヒントになります。', action: '最近の記録を見る' },
  ]

  return (
    <Device className="round2-home r2-d" label="Round 2 案D まとまった小さなクエスト">
      <header className="r2-header">
        <div className="r2-brand"><span>h</span><strong>HeartQuest</strong></div>
        <button onClick={() => showNotice('プロフィールを開きます')} aria-label="プロフィールを開く">あ</button>
      </header>
      <main className="r2-main r2-d-main">
        <span className="r2-d-kicker">TODAY'S QUEST</span>
        <h2>今日の回復を、<br />一歩ずつ。</h2>
        <p className="r2-lead">好きな場所から始められます。</p>

        <div className="r2-d-path" aria-label="回復クエストの3段階">
          {steps.map((item, index) => (
            <button key={item.title} className={step === index ? 'is-active' : ''} onClick={() => setStep(index)}>
              <span>{index + 1}</span><small>{index === 0 ? '知る' : index === 1 ? '試す' : '残す'}</small>
            </button>
          ))}
        </div>

        <section className="r2-d-focus">
          <span>STEP {step + 1}</span>
          <h3>{steps[step].title}</h3>
          <p>{steps[step].description}</p>
        </section>

        <button className="r2-primary" onClick={() => showNotice(`${steps[step].action}へ進みます`)}>{steps[step].action} <span>→</span></button>
        <button className="r2-secondary" onClick={() => showNotice('前回の続きから再開します')}>前回の続きから始める</button>
      </main>
      <Round2Nav onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Home2E() {
  const [method, setMethod] = useState(0)
  const { notice, showNotice } = useNotice()
  const methods = [
    { title: '好きな音楽を3曲', duration: '約12分', reason: '前回、気持ちの切り替えにつながりました。' },
    { title: '窓辺で深呼吸', duration: '約3分', reason: '短い時間で静かに試せる方法です。' },
    { title: '緑のある道を歩く', duration: '約15分', reason: '夕方の散歩は、評価が高い傾向です。' },
  ]

  return (
    <Device className="round2-home r2-e" label="Round 2 案E 発見から始めるホーム">
      <header className="r2-header">
        <div className="r2-brand"><span>h</span><strong>HeartQuest</strong></div>
        <button onClick={() => showNotice('メニューを開きます')} aria-label="メニューを開く">•••</button>
      </header>
      <main className="r2-main r2-e-main">
        <div className="r2-e-heading"><span>今日の小さなクエスト</span><h2>今のあなたへ、<br />こんな休み方はどうですか？</h2></div>

        <section className="r2-e-method">
          <div><span>{methods[method].duration}</span><small>{method + 1} / {methods.length}</small></div>
          <h3>{methods[method].title}</h3>
          <p>{methods[method].reason}</p>
          <div className="r2-e-dots">
            {methods.map((item, index) => <button key={item.title} className={method === index ? 'is-active' : ''} onClick={() => setMethod(index)} aria-label={`${item.title}を表示`} />)}
          </div>
        </section>

        <button className="r2-primary" onClick={() => showNotice(`${methods[method].title}を始めます`)}>この回復を試す <span>→</span></button>
        <button className="r2-secondary" onClick={() => showNotice('ほかの回復方法を表示します')}>ほかの方法から選ぶ</button>

        <div className="r2-e-discovery"><span>最近見つかったこと</span><p>外の空気に触れた日は、気分の切り替えがしやすいようです。</p></div>
      </main>
      <Round2Nav onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

const todayAnalysis = {
  method: '好きな音楽を3曲',
  duration: '12分',
  rating: 7,
  aiScore: 7.4,
  summary: '音に集中した時間が、考えごとから離れるきっかけになりました。',
  insight: '短い音楽休憩は、疲れが中くらいの日に効果が安定しています。',
  next: '次回は再生前に1分だけ画面を伏せて、音に入りやすい時間をつくってみましょう。',
}

function AnalysisHeader({ onAction }: { onAction: (message: string) => void }) {
  return (
    <header className="analysis-r2-header">
      <button onClick={() => onAction('ホームへ戻ります')} aria-label="ホームへ戻る">←</button>
      <div><span>今日の回復</span><strong>AIフィードバック</strong></div>
      <button onClick={() => onAction('共有メニューを開きます')} aria-label="共有メニューを開く">•••</button>
    </header>
  )
}

function ScorePair({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`analysis-score-pair${compact ? ' is-compact' : ''}`}>
      <div><span>あなたの評価</span><strong>{todayAnalysis.rating}<small>/10</small></strong></div>
      <i aria-hidden="true" />
      <div><span>AI参考スコア</span><strong>{todayAnalysis.aiScore}<small>/10</small></strong></div>
    </div>
  )
}

function AnalysisActions({ onAction }: { onAction: (message: string) => void }) {
  return (
    <div className="analysis-actions-r2">
      <button className="r2-primary" onClick={() => onAction('ホームへ戻ります')}>ホームへ戻る <span>→</span></button>
      <button className="r2-secondary" onClick={() => onAction('今日の記録を開きます')}>今日の記録を見る</button>
    </div>
  )
}

function AnalysisA() {
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home analysis-r2 analysis-a" label="分析案A やさしい要点レポート">
      <AnalysisHeader onAction={showNotice} />
      <main className="analysis-r2-main">
        <div className="analysis-session"><span>今日 20:40</span><strong>{todayAnalysis.method}</strong><small>{todayAnalysis.duration}</small></div>
        <h2>今日の回復を<br />振り返りました。</h2>
        <ScorePair />
        <section className="analysis-message">
          <span>AIからのフィードバック</span>
          <p>{todayAnalysis.summary}</p>
        </section>
        <div className="analysis-two-points">
          <div><span>見つかった傾向</span><p>{todayAnalysis.insight}</p></div>
          <div><span>次の小さな提案</span><p>{todayAnalysis.next}</p></div>
        </div>
        <AnalysisActions onAction={showNotice} />
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function AnalysisB() {
  const [expanded, setExpanded] = useState(false)
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home analysis-r2 analysis-b" label="分析案B 静かなフィードバックレター">
      <AnalysisHeader onAction={showNotice} />
      <main className="analysis-r2-main analysis-b-main">
        <span className="analysis-b-date">9月5日のフィードバック</span>
        <h2>音楽が、考えごとから<br />離れる時間になりました。</h2>
        <p className="analysis-b-letter">頑張って気分を変えようとしなくても、好きな音へ注意を向けるだけで、小さな切り替えが生まれたようです。</p>
        <ScorePair compact />
        <button className="analysis-disclosure" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          分析の詳しい内容 <span>{expanded ? '−' : '＋'}</span>
        </button>
        {expanded ? (
          <div className="analysis-b-details"><p><strong>見つかった傾向</strong>{todayAnalysis.insight}</p><p><strong>次に試せること</strong>{todayAnalysis.next}</p></div>
        ) : (
          <div className="analysis-b-next"><span>次に試せること</span><p>音楽を流す前に、画面を1分だけ伏せてみる。</p></div>
        )}
        <AnalysisActions onAction={showNotice} />
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function AnalysisC() {
  const [tab, setTab] = useState<'まとめ' | '理由' | '次へ'>('まとめ')
  const { notice, showNotice } = useNotice()
  const tabContent = {
    まとめ: { title: '自分の感覚を、いちばん大切に。', text: todayAnalysis.summary },
    理由: { title: 'なぜ、そう考えたの？', text: '今回の感想と7点の自己評価、これまでの音楽休憩の記録をもとにしています。' },
    次へ: { title: '次にできる、小さなこと。', text: todayAnalysis.next },
  }
  return (
    <Device className="round2-home analysis-r2 analysis-c" label="分析案C 自分の感覚が主役">
      <AnalysisHeader onAction={showNotice} />
      <main className="analysis-r2-main analysis-c-main">
        <div className="analysis-c-rating"><span>あなたの評価</span><strong>{todayAnalysis.rating}</strong><small>/10</small><p>「少し気持ちが軽くなった」</p></div>
        <div className="analysis-c-ai"><span>AIの見立て</span><strong>{todayAnalysis.aiScore}</strong><small>/10 · 参考値</small></div>
        <div className="analysis-c-tabs" role="tablist" aria-label="分析内容">
          {(['まとめ', '理由', '次へ'] as const).map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? 'is-active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}
        </div>
        <section className="analysis-c-content">
          <span>AIフィードバック</span><h2>{tabContent[tab].title}</h2><p>{tabContent[tab].text}</p>
        </section>
        <AnalysisActions onAction={showNotice} />
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function AnalysisD() {
  const [focus, setFocus] = useState(2)
  const { notice, showNotice } = useNotice()
  const discoveries = [
    `今日選んだ回復方法は「${todayAnalysis.method}」です。`,
    todayAnalysis.summary,
    todayAnalysis.insight,
  ]
  return (
    <Device className="round2-home analysis-r2 analysis-d" label="分析案D クエストの発見">
      <AnalysisHeader onAction={showNotice} />
      <main className="analysis-r2-main analysis-d-main">
        <div className="analysis-d-complete"><span>QUEST COMPLETE</span><h2>今日の回復から、<br />ひとつ発見しました。</h2></div>
        <div className="analysis-d-path" aria-label="今日の回復の進行">
          {['選ぶ', '試す', '振り返る'].map((item, index) => <button key={item} className={focus === index ? 'is-active' : ''} onClick={() => setFocus(index)}><span>✓</span><small>{item}</small></button>)}
        </div>
        <section className="analysis-d-discovery"><span>{focus === 2 ? 'NEW DISCOVERY' : `STEP ${focus + 1}`}</span><p>{discoveries[focus]}</p></section>
        <ScorePair compact />
        <div className="analysis-d-actions"><button className="r2-primary" onClick={() => showNotice('発見を記録へ保存します')}>この発見を記録する <span>→</span></button><button className="r2-secondary" onClick={() => showNotice('ホームへ戻ります')}>ホームへ戻る</button></div>
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function AnalysisE() {
  const [period, setPeriod] = useState<'今日' | '最近'>('今日')
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home analysis-r2 analysis-e" label="分析案E 比較で気づく">
      <AnalysisHeader onAction={showNotice} />
      <main className="analysis-r2-main analysis-e-main">
        <div className="analysis-e-toggle"><button className={period === '今日' ? 'is-active' : ''} onClick={() => setPeriod('今日')}>今日</button><button className={period === '最近' ? 'is-active' : ''} onClick={() => setPeriod('最近')}>最近の傾向</button></div>
        {period === '今日' ? (
          <>
            <h2>今日の回復は、<br />7点でした。</h2>
            <p className="analysis-e-lead">AIも近い評価ですが、あなた自身の感覚を基準に振り返ります。</p>
            <div className="analysis-e-bars">
              <div><span>あなたの評価</span><i><b style={{ width: '70%' }} /></i><strong>7.0</strong></div>
              <div><span>AI参考スコア</span><i><b style={{ width: '74%' }} /></i><strong>7.4</strong></div>
            </div>
            <section className="analysis-e-feedback"><span>今日のフィードバック</span><p>{todayAnalysis.summary}</p></section>
          </>
        ) : (
          <>
            <h2>音楽の回復は、<br />安定しています。</h2>
            <p className="analysis-e-lead">直近3回の自己評価を、比較しやすく並べました。</p>
            <div className="analysis-e-history"><span><i style={{ height: '70%' }} />7</span><span><i style={{ height: '80%' }} />8</span><span><i style={{ height: '70%' }} />7</span></div>
            <section className="analysis-e-feedback"><span>最近の傾向</span><p>{todayAnalysis.insight}</p></section>
          </>
        )}
        <AnalysisActions onAction={showNotice} />
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

const analysisRound2 = {
  summary: '音楽へ意識を向けたことで、頭の中を占めていた考えごとから自然に距離を取れたようです。無理に気分を変えようとせず、好きな音を選んだことが穏やかな切り替えにつながりました。',
  reason: '回復前は疲れを感じていましたが、実施後の自己評価は7点でした。過去の音楽休憩も6〜8点で安定しており、短時間でも取り入れやすい方法だと考えられます。',
  next: '次回は再生前に画面を1分だけ伏せて、音へ入りやすい環境をつくってみましょう。',
}

function AnalysisRound2Header({ onAction }: { onAction: (message: string) => void }) {
  return (
    <header className="analysis2-header">
      <span className="analysis2-brand" aria-hidden="true">h</span>
      <div><span>今日の回復</span><strong>AIフィードバック</strong></div>
      <button onClick={() => onAction('分析メニューを開きます')} aria-label="分析メニューを開く">•••</button>
    </header>
  )
}

function Analysis2A() {
  const [period, setPeriod] = useState<'今日' | '最近'>('今日')
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home analysis2 analysis2-a" label="分析Round 2 案A 深める比較">
      <AnalysisRound2Header onAction={showNotice} />
      <main className="analysis2-main">
        <div className="analysis2-toggle"><button className={period === '今日' ? 'is-active' : ''} onClick={() => setPeriod('今日')}>今日</button><button className={period === '最近' ? 'is-active' : ''} onClick={() => setPeriod('最近')}>最近の傾向</button></div>
        {period === '今日' ? <>
          <div className="analysis2-kicker"><span>好きな音楽を3曲</span><small>12分</small></div>
          <h2>気持ちを切り替える<br />時間になりました。</h2>
          <div className="analysis2-bars"><div><span>あなたの評価</span><b><i style={{ width: '70%' }} /></b><strong>7.0</strong></div><div><span>AI参考スコア</span><b><i style={{ width: '74%' }} /></b><strong>7.4</strong></div></div>
          <section className="analysis2-reading"><span>今日のフィードバック</span><p>{analysisRound2.summary}</p><p>{analysisRound2.reason}</p></section>
          <button className="analysis2-hint" onClick={() => showNotice('次回のヒントを保存しました')}><span>次回の小さなヒント</span>{analysisRound2.next}<b>＋</b></button>
        </> : <>
          <div className="analysis2-kicker"><span>直近3回の音楽休憩</span><small>平均 7.3</small></div>
          <h2>短い時間でも、<br />効果が安定しています。</h2>
          <div className="analysis2-columns" aria-label="直近3回の自己評価"><span><i style={{ height: '64%' }} /><small>8/29</small><b>7</b></span><span><i style={{ height: '76%' }} /><small>9/2</small><b>8</b></span><span><i style={{ height: '64%' }} /><small>今日</small><b>7</b></span></div>
          <section className="analysis2-reading"><span>最近の傾向</span><p>疲れが中くらいの日に音楽を選ぶと、7点前後の回復を感じられています。時間を長くするより、好きな曲へ集中できることが大切そうです。</p></section>
        </>}
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Analysis2B() {
  const [expanded, setExpanded] = useState(false)
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home analysis2 analysis2-b" label="分析Round 2 案B 変化の流れ">
      <AnalysisRound2Header onAction={showNotice} />
      <main className="analysis2-main">
        <span className="analysis2-eyebrow">TODAY'S CHANGE</span>
        <h2>回復前から今までを、<br />ひと続きに見る。</h2>
        <div className="analysis2-flow">
          <div><small>回復前</small><strong>4</strong><span>頭がいっぱい</span></div>
          <i><span>＋3</span></i>
          <div><small>回復後</small><strong>7</strong><span>少し軽くなった</span></div>
        </div>
        <section className="analysis2-reading"><span>AIフィードバック</span><p>{analysisRound2.summary}</p></section>
        <button className="analysis2-disclosure" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}><span>この分析の理由</span><b>{expanded ? '−' : '＋'}</b></button>
        {expanded && <p className="analysis2-expanded">{analysisRound2.reason}</p>}
        <div className="analysis2-nextline"><span>次に試せること</span><p>{analysisRound2.next}</p></div>
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Analysis2C() {
  const [metric, setMetric] = useState<'切り替え' | '手軽さ' | '安定感'>('切り替え')
  const { notice, showNotice } = useNotice()
  const metrics = {
    切り替え: { score: 7, copy: '考えごとから少し離れ、気持ちの向きを変えられました。' },
    手軽さ: { score: 9, copy: '12分で完了でき、疲れている日にも選びやすい方法です。' },
    安定感: { score: 7, copy: '直近3回も6〜8点で、大きな波がなく効果を感じられています。' },
  }
  return (
    <Device className="round2-home analysis2 analysis2-c" label="分析Round 2 案C 効き方のバランス">
      <AnalysisRound2Header onAction={showNotice} />
      <main className="analysis2-main">
        <span className="analysis2-eyebrow">RECOVERY BALANCE</span>
        <h2>今日の回復が、<br />どう効いたか。</h2>
        <div className="analysis2-balance">
          <div className="analysis2-ring" style={{ '--ring-score': `${metrics[metric].score * 10}%` } as CSSProperties}><strong>{metrics[metric].score}</strong><small>/10</small></div>
          <div><span>{metric}</span><p>{metrics[metric].copy}</p></div>
        </div>
        <div className="analysis2-metrics" role="tablist" aria-label="回復効果の観点">
          {(Object.keys(metrics) as Array<keyof typeof metrics>).map((item) => <button key={item} role="tab" aria-selected={metric === item} className={metric === item ? 'is-active' : ''} onClick={() => setMetric(item)}><span>{item}</span><strong>{metrics[item].score}</strong></button>)}
        </div>
        <section className="analysis2-reading"><span>全体のフィードバック</span><p>{analysisRound2.summary}</p><p className="analysis2-soft">AIの数字は参考値です。あなた自身の7点を中心に振り返っています。</p></section>
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Analysis2D() {
  const [focus, setFocus] = useState<'気づき' | '理由' | '次へ'>('気づき')
  const { notice, showNotice } = useNotice()
  const content = {
    気づき: { label: '今日見つかったこと', title: '好きな音に集中することが、心の余白になりました。', body: analysisRound2.summary },
    理由: { label: 'AIが見た手がかり', title: '7点の実感と、過去の安定した記録。', body: analysisRound2.reason },
    次へ: { label: '次の小さな一歩', title: '始める前の1分を、静かにしてみる。', body: analysisRound2.next },
  }
  return (
    <Device className="round2-home analysis2 analysis2-d" label="分析Round 2 案D 発見にフォーカス">
      <AnalysisRound2Header onAction={showNotice} />
      <main className="analysis2-main">
        <div className="analysis2-scoreline"><span>今日の自己評価</span><strong>7<small>/10</small></strong><i><b style={{ width: '70%' }} /></i></div>
        <div className="analysis2-focus-tabs" role="tablist" aria-label="フィードバック内容">{(['気づき', '理由', '次へ'] as const).map((item) => <button key={item} role="tab" aria-selected={focus === item} className={focus === item ? 'is-active' : ''} onClick={() => setFocus(item)}>{item}</button>)}</div>
        <section className="analysis2-focus-copy"><span>{content[focus].label}</span><h2>{content[focus].title}</h2><p>{content[focus].body}</p></section>
        <div className="analysis2-reference"><span>AI参考スコア</span><strong>7.4</strong><p>あなたの実感と近い結果でした。</p></div>
        <button className="r2-primary" onClick={() => showNotice('この気づきを次回のヒントに追加しました')}>この気づきを残す <span>＋</span></button>
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function Analysis2E() {
  const [period, setPeriod] = useState<'今日' | '最近'>('今日')
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home analysis2 analysis2-e" label="分析Round 2 案E 今日と傾向をつなぐ">
      <AnalysisRound2Header onAction={showNotice} />
      <main className="analysis2-main">
        <div className="analysis2-toggle"><button className={period === '今日' ? 'is-active' : ''} onClick={() => setPeriod('今日')}>今日</button><button className={period === '最近' ? 'is-active' : ''} onClick={() => setPeriod('最近')}>最近の傾向</button></div>
        <div className="analysis2-e-heading"><div><span>{period === '今日' ? 'あなたの評価' : '3回の平均'}</span><strong>{period === '今日' ? '7.0' : '7.3'}<small>/10</small></strong></div><p>{period === '今日' ? '少し気持ちが軽くなった' : '音楽は安定して合っています'}</p></div>
        <svg className="analysis2-chart" viewBox="0 0 300 120" role="img" aria-label="直近の評価は7、8、7">
          <path d="M12 92 C58 85, 70 52, 108 55 S165 28, 202 48 S260 62, 288 50" fill="none" stroke="#cb806b" strokeWidth="8" strokeLinecap="round" />
          <path d="M12 92 C58 85, 70 52, 108 55 S165 28, 202 48 S260 62, 288 50 L288 112 L12 112 Z" fill="rgba(203,128,107,.13)" />
          <circle cx="288" cy="50" r="8" fill="#fff8ef" stroke="#9a5145" strokeWidth="5" />
        </svg>
        <div className="analysis2-chart-labels"><span>8/29 · 7</span><span>9/2 · 8</span><span>今日 · 7</span></div>
        <section className="analysis2-reading"><span>{period === '今日' ? '今日のフィードバック' : '最近の傾向'}</span><p>{period === '今日' ? analysisRound2.summary : '音楽による回復は直近3回とも6点以上です。特に、疲れが中くらいの日に短時間で取り入れると、気持ちの切り替えにつながりやすい傾向があります。'}</p><p>{period === '今日' ? analysisRound2.reason : '長く聴くことよりも、好きな曲を少数選んで集中することが、あなたには合っているようです。'}</p></section>
        <div className="analysis2-nextline"><span>次に試せること</span><p>{analysisRound2.next}</p></div>
      </main>
      <Round2Nav active="分析" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

const recordMonths = [
  { label: '4月', score: 6.4 }, { label: '5月', score: 6.9 }, { label: '6月', score: 6.6 },
  { label: '7月', score: 7.2 }, { label: '8月', score: 7.5 }, { label: '9月', score: 7.8 },
]

const recordRanking = [
  { name: '好きな音楽', score: 8.2, count: 6 },
  { name: '外を散歩', score: 7.8, count: 4 },
  { name: '深呼吸', score: 7.1, count: 8 },
]

const recordCategories = [
  { name: 'リラックス', value: 38, color: '#c87964' },
  { name: '軽い運動', value: 27, color: '#7f987f' },
  { name: '気分転換', value: 22, color: '#dfaa75' },
  { name: '休息', value: 13, color: '#c3b4a8' },
]

function RecordHeader({ onAction }: { onAction: (message: string) => void }) {
  return (
    <header className="record-header">
      <span className="analysis2-brand" aria-hidden="true">h</span>
      <div><span>MY RECOVERY</span><strong>回復の記録</strong></div>
      <button onClick={() => onAction('記録メニューを開きます')} aria-label="記録メニューを開く">•••</button>
    </header>
  )
}

function RecordLineChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`record-line-chart${compact ? ' is-compact' : ''}`}>
      <svg viewBox="0 0 300 132" role="img" aria-label="4月6.4点から9月7.8点までの月平均推移">
        <path d="M12 103 C46 92, 58 78, 76 76 S112 97, 126 87 S162 60, 178 63 S214 50, 228 48 S267 27, 288 30" fill="none" stroke="#bb6957" strokeWidth="7" strokeLinecap="round" />
        <path d="M12 103 C46 92, 58 78, 76 76 S112 97, 126 87 S162 60, 178 63 S214 50, 228 48 S267 27, 288 30 L288 122 L12 122 Z" fill="rgba(187,105,87,.12)" />
        <circle cx="288" cy="30" r="8" fill="#fff8ef" stroke="#985044" strokeWidth="5" />
      </svg>
      <div>{recordMonths.map((month) => <span key={month.label}>{month.label}</span>)}</div>
    </div>
  )
}

function RecordRankingBars({ short = false }: { short?: boolean }) {
  const items = short ? recordRanking.slice(0, 2) : recordRanking
  return <div className="record-ranking-bars">{items.map((item, index) => <div key={item.name}><b>{index + 1}</b><span>{item.name}<small>{item.count}回</small></span><i><em style={{ width: `${item.score * 10}%` }} /></i><strong>{item.score}</strong></div>)}</div>
}

function RecordDonut({ active }: { active?: string }) {
  const selected = recordCategories.find((item) => item.name === active)
  return <div className="record-donut" aria-label="カテゴリ内訳 リラックス38%、軽い運動27%、気分転換22%、休息13%"><strong>{selected ? selected.value : 38}<small>%</small></strong><span>{selected ? selected.name : 'リラックス'}</span></div>
}

function RecordA() {
  const [range, setRange] = useState<'6ヶ月' | '3ヶ月'>('6ヶ月')
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home record-screen record-a" label="記録案A やさしい総合ダッシュボード">
      <RecordHeader onAction={showNotice} />
      <main className="record-main">
        <div className="record-title-row"><div><span>9月の平均回復スコア</span><strong>7.8<small>/10</small></strong></div><em>先月より ＋0.3</em></div>
        <div className="record-range"><button className={range === '6ヶ月' ? 'is-active' : ''} onClick={() => setRange('6ヶ月')}>6ヶ月</button><button className={range === '3ヶ月' ? 'is-active' : ''} onClick={() => setRange('3ヶ月')}>3ヶ月</button></div>
        <RecordLineChart compact={range === '3ヶ月'} />
        <section className="record-section"><div className="record-section-title"><span>回復方法ランキング</span><small>平均スコア</small></div><RecordRankingBars /></section>
        <section className="record-section"><div className="record-section-title"><span>カテゴリの内訳</span><small>全21回</small></div><div className="record-category-row"><RecordDonut /><div className="record-legend">{recordCategories.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{item.value}%</b></span>)}</div></div></section>
      </main>
      <Round2Nav active="記録" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function RecordB() {
  const [month, setMonth] = useState(9)
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home record-screen record-b" label="記録案B 今月の回復ストーリー">
      <RecordHeader onAction={showNotice} />
      <main className="record-main">
        <div className="record-month-picker"><button onClick={() => setMonth((value) => Math.max(4, value - 1))} aria-label="前の月">‹</button><strong>{month}月</strong><button onClick={() => setMonth((value) => Math.min(9, value + 1))} aria-label="次の月">›</button></div>
        <span className="record-eyebrow">MONTHLY STORY</span>
        <h2>少しずつ、自分に合う<br />休み方が見えてきました。</h2>
        <div className="record-story-score"><span>月平均</span><strong>{month === 9 ? '7.8' : '7.5'}<small>/10</small></strong><p>回復の記録は21回。音楽の日に高い評価が集まっています。</p></div>
        <RecordLineChart />
        <section className="record-story-block"><span>よく効いた回復方法</span><div className="record-podium"><div><b>2</b><strong>散歩</strong><small>7.8</small></div><div><b>1</b><strong>音楽</strong><small>8.2</small></div><div><b>3</b><strong>深呼吸</strong><small>7.1</small></div></div></section>
        <section className="record-story-block"><span>カテゴリの内訳</span><div className="record-stacked" aria-label="カテゴリの内訳"><i /><i /><i /><i /></div><div className="record-stacked-labels">{recordCategories.map((item) => <span key={item.name}><b>{item.value}%</b>{item.name}</span>)}</div></section>
      </main>
      <Round2Nav active="記録" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function RecordC() {
  const [category, setCategory] = useState('リラックス')
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home record-screen record-c" label="記録案C 回復バランス">
      <RecordHeader onAction={showNotice} />
      <main className="record-main">
        <span className="record-eyebrow">RECOVERY BALANCE</span>
        <h2>今月は、どんな回復を<br />選んだ？</h2>
        <div className="record-section-title record-category-heading"><span>カテゴリの内訳</span><small>全21回</small></div>
        <div className="record-category-focus"><RecordDonut active={category} /><div>{recordCategories.map((item) => <button key={item.name} className={category === item.name ? 'is-active' : ''} onClick={() => setCategory(item.name)}><i style={{ background: item.color }} />{item.name}<b>{item.value}%</b></button>)}</div></div>
        <section className="record-section"><div className="record-section-title"><span>月ごとの平均回復スコア</span><strong>7.8</strong></div><div className="record-month-bars">{recordMonths.map((month) => <span key={month.label}><i style={{ height: `${month.score * 10}%` }} /><small>{month.label}</small></span>)}</div></section>
        <section className="record-section"><div className="record-section-title"><span>回復方法ランキング</span><small>上位3つ</small></div><RecordRankingBars /></section>
      </main>
      <Round2Nav active="記録" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function RecordD() {
  const [method, setMethod] = useState(0)
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home record-screen record-d" label="記録案D 回復の地図">
      <RecordHeader onAction={showNotice} />
      <main className="record-main">
        <span className="record-eyebrow">RECOVERY MAP · 6 MONTHS</span>
        <h2>回復の道を、<br />ゆっくり振り返る。</h2>
        <div className="record-map-score"><span>9月の平均回復スコア</span><strong>7.8<small>/10</small></strong><em>＋1.4</em></div>
        <div className="record-path-chart"><svg viewBox="0 0 300 126" role="img" aria-label="月平均回復スコアの推移"><path d="M17 101 Q52 69 83 78 T140 65 T197 47 T283 25" fill="none" stroke="#829782" strokeWidth="6" strokeLinecap="round" strokeDasharray="3 12" />{[[17,101],[70,78],[122,82],[174,56],[228,44],[283,25]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r={i === 5 ? 10 : 7} fill={i === 5 ? '#bc6a58' : '#fff8ef'} stroke={i === 5 ? '#bc6a58' : '#829782'} strokeWidth="4" />)}</svg><div>{recordMonths.map((month) => <span key={month.label}>{month.label}</span>)}</div></div>
        <section className="record-discovery"><span>今月の発見</span><p>音楽を選んだ日は、平均回復スコアがいちばん高くなりました。</p></section>
        <div className="record-section-title record-method-heading"><span>回復方法ランキング</span><small>平均スコア</small></div>
        <div className="record-method-tabs" role="tablist" aria-label="回復方法ランキング">{recordRanking.map((item, index) => <button key={item.name} role="tab" aria-selected={method === index} className={method === index ? 'is-active' : ''} onClick={() => setMethod(index)}><small>{index + 1}位</small><span>{item.name}</span><strong>{item.score}</strong></button>)}</div>
        <section className="record-section"><div className="record-section-title"><span>カテゴリの内訳</span><small>全21回</small></div><div className="record-bubbles">{recordCategories.map((item) => <span key={item.name} style={{ '--bubble-size': `${42 + item.value}px`, background: item.color } as CSSProperties}><b>{item.value}%</b><small>{item.name}</small></span>)}</div></section>
      </main>
      <Round2Nav active="記録" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function RecordE() {
  const [focus, setFocus] = useState<'スコア' | '方法'>('スコア')
  const { notice, showNotice } = useNotice()
  return (
    <Device className="round2-home record-screen record-e" label="記録案E 比較できる記録">
      <RecordHeader onAction={showNotice} />
      <main className="record-main">
        <div className="record-range record-e-tabs"><button className={focus === 'スコア' ? 'is-active' : ''} onClick={() => setFocus('スコア')}>スコア</button><button className={focus === '方法' ? 'is-active' : ''} onClick={() => setFocus('方法')}>回復方法</button></div>
        <div className="record-e-summary"><div><span>9月の平均</span><strong>7.8<small>/10</small></strong></div><p>{focus === 'スコア' ? '6ヶ月で＋1.4。穏やかに上向いています。' : '音楽が8.2点で、今月いちばんでした。'}</p></div>
        <section className={`record-e-visual is-${focus === 'スコア' ? 'score' : 'method'}`}>{focus === 'スコア' ? <RecordLineChart /> : <RecordRankingBars />}</section>
        <section className="record-e-overview"><div className="record-section-title"><span>月ごとの平均回復スコア</span><strong>7.8</strong></div><div className="record-mini-months">{recordMonths.map((month) => <span key={month.label}><i style={{ height: `${month.score * 8}%` }} /><small>{month.label}</small></span>)}</div></section>
        <section className="record-e-overview"><div className="record-section-title"><span>回復方法ランキング</span><small>平均</small></div><RecordRankingBars short /></section>
        <section className="record-e-overview"><div className="record-section-title"><span>カテゴリの内訳</span><small>全21回</small></div><div className="record-e-category"><RecordDonut /><div className="record-legend">{recordCategories.slice(0, 3).map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{item.value}%</b></span>)}</div></div></section>
      </main>
      <Round2Nav active="記録" onAction={showNotice} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
    </Device>
  )
}

function ConceptCard({ concept }: { concept: Concept }) {
  return (
    <article className={`concept-card concept-${concept.id.toLowerCase()}${concept.selected ? ' is-selected-concept' : ''}`}>
      <div className="concept-heading">
        <span className="concept-letter">{concept.id}</span>
        <div><p>案{concept.id}</p><h2>{concept.name}</h2></div>
        <div className="concept-meta-badges">
          {concept.selected && <span className="selected-badge">採用</span>}
          <span className={`difficulty difficulty-${concept.difficulty.replace('〜', '-')}`}>実装 {concept.difficulty}</span>
        </div>
      </div>
      {concept.screen}
      <section className="concept-notes">
        <div className="concept-summary"><span>CONCEPT</span><p>{concept.concept}</p></div>
        <dl>
          <div><dt>特徴</dt><dd><ul>{concept.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></dd></div>
          <div><dt>利点</dt><dd>{concept.benefits}</dd></div>
          <div><dt>懸念点</dt><dd>{concept.concerns}</dd></div>
        </dl>
      </section>
    </article>
  )
}

const round1Concepts: Concept[] = [
  {
    id: 'A',
    name: 'やさしいスタンダード',
    concept: '現行ホームの長所を残し、開始・傾向・履歴の順に迷わず読める基準案。',
    features: ['主要CTAを最上段に固定', '週次要約と最近の記録を簡潔に整理', '4項目の標準的な下部ナビ'],
    benefits: '現行実装からの移行が小さく、初見でも操作を予測しやすい。',
    concerns: '安心感は高い一方で、HeartQuest固有の印象はやや控えめ。',
    difficulty: '低',
    screen: <HomeA />,
  },
  {
    id: 'B',
    name: '静かな一歩',
    concept: '情報を一つずつ見せ、休む判断そのものの負担を減らすミニマル案。',
    features: ['開始操作を画面中央へ集約', '選択肢はボトムシートで後から提示', '前回の記録だけを静かに表示'],
    benefits: '認知負荷が最も低く、疲れが強い時でも次の操作が明確。',
    concerns: '分析や履歴の全体像は、1タップ進まないと見えない。',
    difficulty: '低〜中',
    screen: <HomeB />,
  },
  {
    id: 'C',
    name: 'こころに寄り添う',
    concept: '気分を選ぶ行為をホームへ統合し、温かな応答から回復を始める案。',
    features: ['5段階の気分チェックを主役化', '選択に合わせて言葉が変化', '前日の小さな実感を手紙のように表示'],
    benefits: '毎日まめのように数タップで始められ、感情的な親しみが強い。',
    concerns: '既存の回復前チェック画面と役割が重なるため、採用時は統合整理が必要。',
    difficulty: '中',
    screen: <HomeC />,
  },
  {
    id: 'D',
    name: '回復の地図',
    concept: 'クエストを達成競争ではなく、自分に合う方法を探す小さな探索として表現。',
    features: ['3段階の体験を地図で可視化', '開始地点を自分で選べる', 'スコアより「最近の発見」を優先'],
    benefits: 'HeartQuestという名前との結びつきが強く、体験の流れも理解しやすい。',
    concerns: 'ゲーム表現が好みに合わない利用者には、少し演出が強く見える可能性。',
    difficulty: '中',
    screen: <HomeD />,
  },
  {
    id: 'E',
    name: '余白のスイッチ',
    concept: '大きな文字と一枚の提案カードで、強い個性と素早い開始を両立する案。',
    features: ['今日の候補をカード切替で選択', 'フローティング型の操作ドック', '月の気づきを大胆な数値で表示'],
    benefits: 'ハッカソンのデモで記憶に残り、実装はCSSと標準Reactで完結できる。',
    concerns: '大きなタイポグラフィにより、表示できる情報量は少なくなる。',
    difficulty: '中',
    screen: <HomeE />,
  },
]

const round2Concepts: Concept[] = [
  {
    id: 'A',
    name: '温かなチェックイン',
    concept: '案Cの温かさを保ちながら、開始・補助操作・昨日の気づきを一列の優先順位で整理。',
    features: ['大きな5段階チェックイン', '主要CTAと補助操作を明確に分離', 'ゲーム表現は小さなクエスト名だけ'],
    benefits: '案Cの親しみやすさと標準的な操作性のバランスがよい。',
    concerns: '気分選択をホームへ置くため、既存チェックイン画面との統合が必要。',
    difficulty: '低〜中',
    screen: <Home2A />,
  },
  {
    id: 'B',
    name: '余白のチェックイン',
    concept: '案Bの余白を最も強く取り入れ、今の気分を一つずつ確かめる構成。',
    features: ['一度に表示する気分は一つ', '説明を必要最小限に限定', '中央の主要操作へ視線を集中'],
    benefits: '疲れが強い時の認知負荷が最も低く、文字も大きく保てる。',
    concerns: '5つの気分を同時比較できず、選択に数タップ必要。',
    difficulty: '低',
    selected: true,
    screen: <Home2B />,
  },
  {
    id: 'C',
    name: 'やさしい相棒',
    concept: '案Cの感情的な温かさを深め、気分ではなく「今したいこと」から始める案。',
    features: ['温かな案内役と言葉の応答', '3つの大きな選択肢', '進行表現を一行へ集約'],
    benefits: '数値で気分を答えにくい人にも自然で、会話のように始められる。',
    concerns: '案内役の見せ方が強すぎると、機能よりキャラクターが目立つ可能性。',
    difficulty: '中',
    screen: <Home2C />,
  },
  {
    id: 'D',
    name: 'まとまった小さなクエスト',
    concept: '案Dの探索感を一つの直線的な進行表示へ集約し、情報が散らばらないよう再構成。',
    features: ['3段階を横一列に集約', '好きな段階から開始可能', '選択中の内容だけを大きく表示'],
    benefits: 'HeartQuestらしさと、主要フローの理解しやすさを両立できる。',
    concerns: '自由な探索感はRound 1の案Dより控えめ。',
    difficulty: '中',
    screen: <Home2D />,
  },
  {
    id: 'E',
    name: '発見から始める',
    concept: '気分入力より先に、過去の傾向を踏まえた一つの回復案を温かく提示。',
    features: ['提案を一つずつ大きく表示', '理由を短い文章で明示', '最近の発見をカード化せず下部へ配置'],
    benefits: '何をすればよいか決められない時に、最短で行動へ移れる。',
    concerns: 'AI提案を先に出すため、自分で選びたい人への補助導線が重要。',
    difficulty: '中',
    screen: <Home2E />,
  },
]

const analysisConcepts: Concept[] = [
  {
    id: 'A',
    name: 'やさしい要点レポート',
    concept: '今日の回復内容・2つの評価・AIの要点・次の提案を、順番どおり一画面で読む案。',
    features: ['情報を上から順に理解できる', '本人評価とAI参考スコアを並列表示', '傾向と次の提案を簡潔に分離'],
    benefits: '必要な情報を見落としにくく、初めての利用でも理解しやすい。',
    concerns: '5案の中では情報量が最も多く、スクロールが少し長い。',
    difficulty: '低〜中',
    screen: <AnalysisA />,
  },
  {
    id: 'B',
    name: '静かなフィードバックレター',
    concept: '採用したホーム案Bの余白を最も忠実に引き継ぎ、AIの言葉を静かに読む案。',
    features: ['文章を主役にした大きな余白', '詳細は必要な時だけ展開', '点数の主張を控えめに調整'],
    benefits: '評価されている感覚が弱く、回復後の気持ちに寄り添いやすい。',
    concerns: '数値や傾向を素早く比較したい人には、情報が控えめに見える。',
    difficulty: '低',
    screen: <AnalysisB />,
  },
  {
    id: 'C',
    name: '自分の感覚が主役',
    concept: '本人の7点を中心に置き、AIは補助的な参考情報であることを明確にする案。',
    features: ['本人評価を最も大きく表示', 'まとめ・理由・次へをタブ切替', 'AIスコアに参考値ラベルを付与'],
    benefits: 'AIが本人の感覚を否定しない関係性を、視覚的にも伝えられる。',
    concerns: 'タブの中に情報が分かれるため、全体を一度に見渡せない。',
    difficulty: '中',
    screen: <AnalysisC />,
  },
  {
    id: 'D',
    name: 'クエストの発見',
    concept: '回復フローの完了を競争ではなく「自分について一つ知れたこと」として表す案。',
    features: ['3段階の完了を一列で表示', '成果ではなく発見を中心に表現', '発見内容を記録する明確なCTA'],
    benefits: 'HeartQuestらしさを残しながら、達成圧力を抑えられる。',
    concerns: 'クエスト表現が不要な人には、通常のレポートより一段演出的に見える。',
    difficulty: '中',
    screen: <AnalysisD />,
  },
  {
    id: 'E',
    name: '比較で気づく',
    concept: '今日のAIフィードバックを中心にしながら、最近の傾向へ切り替えられるデータ寄りの案。',
    features: ['今日と最近を2タブで切替', '本人評価とAI参考値をバーで比較', '過去3回の変化を簡潔に表示'],
    benefits: '今回の感想と長期的な傾向を、同じ画面で行き来できる。',
    concerns: 'ほかの案より分析感が強く、回復直後には数字が多く感じられる可能性。',
    difficulty: '中',
    screen: <AnalysisE />,
  },
]

const analysisRound2Concepts: Concept[] = [
  {
    id: 'A',
    name: '深める比較',
    concept: '案Eの比較表示をそのまま深め、今日の結果・理由・次のヒントを一続きで読める案。',
    features: ['今日と最近を2タブで切替', '2つの評価を横棒で比較', 'フィードバックを2段落まで深掘り'],
    benefits: '元の案Eからの変化が自然で、視覚的な理解と文章の納得感を両立しやすい。',
    concerns: '今日表示では縦方向の情報量がやや増える。',
    difficulty: '低〜中',
    selected: true,
    screen: <Analysis2A />,
  },
  {
    id: 'B',
    name: '変化の流れ',
    concept: '回復前から回復後までを一つの流れとして見せ、AIの判断理由を必要な時だけ開く案。',
    features: ['回復前4点から回復後7点への変化', '文章を大きな余白の中で表示', '判断理由だけを展開式にする'],
    benefits: '何が変わったのかを直感的に理解でき、読む順序にも迷いにくい。',
    concerns: '最近の傾向を確認するには別の分析案より情報が少ない。',
    difficulty: '低',
    screen: <Analysis2B />,
  },
  {
    id: 'C',
    name: '効き方のバランス',
    concept: '一つの総合点だけでなく、切り替え・手軽さ・安定感のどこに効いたかを可視化する案。',
    features: ['選んだ観点を大きな円で表示', '3つの観点をタップで比較', '総評は一つのまとまりで掲載'],
    benefits: '回復方法の強みが分かりやすく、次に方法を選ぶ判断材料にもなる。',
    concerns: '評価軸の意味をプロダクト全体で定義する必要がある。',
    difficulty: '中',
    screen: <Analysis2C />,
  },
  {
    id: 'D',
    name: '発見にフォーカス',
    concept: '数字を先に並べすぎず、今日見つかった一つの気づきを大きく受け取る案。',
    features: ['気づき・理由・次へを同じ領域で切替', '本人評価を基準として明示', '気づきを次回へ残せる操作'],
    benefits: '情報を細かく分割せず、HeartQuestらしい「自分を知る」体験を強くできる。',
    concerns: 'グラフで傾向を見たい人には比較要素が控えめ。',
    difficulty: '中',
    screen: <Analysis2D />,
  },
  {
    id: 'E',
    name: '今日と傾向をつなぐ',
    concept: '元の案Eを発展させ、今日の評価が最近の流れのどこにあるかを曲線で見せる案。',
    features: ['今日と最近を同じグラフで接続', '本人評価を最も大きく表示', '結果・根拠・次の提案を一続きで掲載'],
    benefits: '単日のフィードバックと長期的な傾向を、最も自然に行き来できる。',
    concerns: '曲線グラフの見せ方は、実データ件数が少ない時の調整が必要。',
    difficulty: '中',
    screen: <Analysis2E />,
  },
]

const recordConcepts: Concept[] = [
  {
    id: 'A',
    name: 'やさしい総合ダッシュボード',
    concept: '月平均を起点に、推移・ランキング・カテゴリを上から順番に確認する基準案。',
    features: ['月平均を折れ線グラフで表示', '回復方法を横棒で比較', 'カテゴリをドーナツと凡例で表示'],
    benefits: '3種類の情報が素直な順序で並び、初めてでも読み方が分かりやすい。',
    concerns: 'すべてを順番に並べるため、画面のスクロール量はやや多い。',
    difficulty: '低〜中',
    screen: <RecordA />,
  },
  {
    id: 'B',
    name: '今月の回復ストーリー',
    concept: '数字をレポートではなく、今月の変化を振り返る短い物語として読む案。',
    features: ['月平均と推移を一続きで表示', 'ランキングを表彰台型に可視化', 'カテゴリを積み上げ比率で表示'],
    benefits: '数字だけの印象が弱まり、回復の積み重ねを温かく受け取れる。',
    concerns: '表彰台の表現は、方法間の優劣を強く感じさせる可能性がある。',
    difficulty: '中',
    screen: <RecordB />,
  },
  {
    id: 'C',
    name: '回復バランス',
    concept: 'カテゴリ内訳を主役にし、どのような回復方法を選んでいるかから振り返る案。',
    features: ['カテゴリを大きなドーナツで操作', '月平均を縦棒で表示', 'ランキングをコンパクトな横棒で掲載'],
    benefits: '行動の偏りやバランスに気づきやすく、次の回復方法選びにもつながる。',
    concerns: '月平均の変化よりカテゴリの印象が先に残る。',
    difficulty: '中',
    screen: <RecordC />,
  },
  {
    id: 'D',
    name: '回復の地図',
    concept: '月ごとの変化を小さな道のりとして表し、HeartQuestらしい探索感を添える案。',
    features: ['6ヶ月の推移を点線の道で表現', '回復方法ランキングを切替式で表示', 'カテゴリ比率を大きさの違う円で表示'],
    benefits: 'ゲーム感を穏やかに残しながら、回復の積み重ねを前向きに確認できる。',
    concerns: '円の大きさによる比較は、正確な比率を読むには凡例が必要。',
    difficulty: '中',
    screen: <RecordD />,
  },
  {
    id: 'E',
    name: '比較できる記録',
    concept: 'スコアと回復方法の注目点を切り替えつつ、3つの必須情報を一画面に残す案。',
    features: ['注目するグラフをタブで切替', '必須3情報の概要を常に表示', '折れ線・棒・ドーナツを統一した尺度で整理'],
    benefits: '詳しく見たい情報へすぐ移れ、全体像も見失いにくい。',
    concerns: 'グラフの種類が多く、ほかの案よりダッシュボード感が強い。',
    difficulty: '中',
    screen: <RecordE />,
  },
]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function App() {
  const [zoom, setZoom] = useState(0.72)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const viewportRef = useRef<HTMLDivElement>(null)
  const panRef = useRef({ active: false, x: 0, y: 0, left: 0, top: 0 })

  const fitGallery = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    setZoom(clamp((viewport.clientWidth - 32) / 2136, 0.28, 1))
    viewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const next = clamp(zoom + (event.deltaY < 0 ? 0.06 : -0.06), 0.28, 1.1)
      const rect = viewport.getBoundingClientRect()
      const cursorX = event.clientX - rect.left + viewport.scrollLeft
      const cursorY = event.clientY - rect.top + viewport.scrollTop
      const ratio = next / zoom
      setZoom(next)
      window.requestAnimationFrame(() => {
        viewport.scrollLeft = cursorX * ratio - (event.clientX - rect.left)
        viewport.scrollTop = cursorY * ratio - (event.clientY - rect.top)
      })
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [zoom])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 1) return
    const viewport = viewportRef.current
    if (!viewport) return
    event.preventDefault()
    viewport.setPointerCapture(event.pointerId)
    panRef.current = { active: true, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active || !viewportRef.current) return
    viewportRef.current.scrollLeft = panRef.current.left - (event.clientX - panRef.current.x)
    viewportRef.current.scrollTop = panRef.current.top - (event.clientY - panRef.current.y)
  }

  const stopPan = () => { panRef.current.active = false }

  return (
    <div className={`gallery-app theme-${theme}`}>
      <header className="gallery-header">
        <div className="gallery-title">
          <span className="gallery-brand">♥</span>
          <div><p>HEARTQUEST DESIGN LAB</p><h1>画面デザインの方向性</h1></div>
          <span className="round-badge">HOME / ANALYSIS / RECORDS</span>
        </div>
        <div className="gallery-tools">
          <div className="tool-group" aria-label="ズーム操作">
            <button onClick={() => setZoom((value) => clamp(value - 0.1, 0.28, 1.1))} aria-label="縮小">−</button>
            <button className="zoom-value" onClick={() => setZoom(0.72)}>{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom((value) => clamp(value + 0.1, 0.28, 1.1))} aria-label="拡大">＋</button>
            <button className="fit-button" onClick={fitGallery}>全体表示</button>
          </div>
          <button className="theme-button" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '● ボードを暗く' : '○ ボードを明るく'}
          </button>
        </div>
      </header>

      <section className="gallery-context">
        <div><span>現在の検討対象</span><strong>回復の記録</strong></div>
        <p>ホームは案B、分析はRound 2の案Aを採用。記録画面も同じ温かさと余白を保ち、月平均・ランキング・カテゴリ内訳の見せ方を比較します。</p>
        <div className="round-links">
          <button onClick={() => document.getElementById('round-1')?.scrollIntoView({ behavior: 'smooth' })}>ホーム R1</button>
          <button onClick={() => document.getElementById('round-2')?.scrollIntoView({ behavior: 'smooth' })}>ホーム R2</button>
          <button onClick={() => document.getElementById('analysis-round-1')?.scrollIntoView({ behavior: 'smooth' })}>分析 R1</button>
          <button onClick={() => document.getElementById('analysis-round-2')?.scrollIntoView({ behavior: 'smooth' })}>分析 R2</button>
          <button className="is-current" onClick={() => document.getElementById('record-round-1')?.scrollIntoView({ behavior: 'smooth' })}>記録 R1</button>
        </div>
      </section>

      <div
        className="gallery-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
      >
        <section className="round-section round-history" id="round-1" style={{ '--gallery-zoom': zoom, width: `${2136 * zoom}px` } as CSSProperties}>
          <header className="round-section-header">
            <div><span>ROUND 1 · HISTORY</span><h2>最初の5案</h2></div>
            <p>初回比較の記録。内容と見た目は変更していません。</p>
          </header>
          <div className="gallery-canvas">
            {round1Concepts.map((concept) => <ConceptCard concept={concept} key={`r1-${concept.id}`} />)}
          </div>
        </section>

        <section className="round-section round-current" id="round-2" style={{ '--gallery-zoom': zoom, width: `${2136 * zoom}px` } as CSSProperties}>
          <header className="round-section-header">
            <div><span>ROUND 2 · CURRENT</span><h2>案Cを育てる5つの方向</h2></div>
            <p>温かい配色を共通にし、余白と文字サイズを見直しました。ゲーム表現は一か所にまとめています。</p>
          </header>
          <div className="gallery-canvas">
            {round2Concepts.map((concept) => <ConceptCard concept={concept} key={`r2-${concept.id}`} />)}
          </div>
          <div className="home-decision">
            <span>HOME · DECISION</span>
            <div><strong>案B「余白のチェックイン」を採用</strong><p>下部ナビゲーションは「ホーム／分析／記録」。回復はホームの中心アクションとして扱います。</p></div>
          </div>
        </section>

        <section className="round-section analysis-round round-current" id="analysis-round-1" style={{ '--gallery-zoom': zoom, width: `${2136 * zoom}px` } as CSSProperties}>
          <header className="round-section-header">
            <div><span>ANALYSIS · ROUND 1</span><h2>今日のAIフィードバック 5案</h2></div>
            <p>同じ情報を、要点・余白・本人評価・クエスト・比較という5つの優先順位で見せます。</p>
          </header>
          <div className="gallery-canvas">
            {analysisConcepts.map((concept) => <ConceptCard concept={concept} key={`analysis-r1-${concept.id}`} />)}
          </div>
          <div className="analysis-decision">
            <span>ANALYSIS · BASE</span>
            <div><strong>案E「比較で気づく」をベースに選定</strong><p>視覚的な比較を残し、文章の深さと余白のバランスを次のRoundで検討します。</p></div>
          </div>
        </section>

        <section className="round-section analysis-round analysis-round-2 round-current" id="analysis-round-2" style={{ '--gallery-zoom': zoom, width: `${2136 * zoom}px` } as CSSProperties}>
          <header className="round-section-header">
            <div><span>ANALYSIS · ROUND 2</span><h2>案Eを育てる5つの方向</h2></div>
            <p>比較の分かりやすさと余白を残し、重くなりすぎない範囲でAIフィードバックを深めました。</p>
          </header>
          <div className="gallery-canvas">
            {analysisRound2Concepts.map((concept) => <ConceptCard concept={concept} key={`analysis-r2-${concept.id}`} />)}
          </div>
          <div className="analysis-decision">
            <span>ANALYSIS · DECISION</span>
            <div><strong>案A「深める比較」を採用</strong><p>視覚的な比較を保ちながら、結果・理由・次のヒントを一続きで読める構成に決定しました。</p></div>
          </div>
        </section>

        <section className="round-section record-round round-current" id="record-round-1" style={{ '--gallery-zoom': zoom, width: `${2136 * zoom}px` } as CSSProperties}>
          <header className="round-section-header">
            <div><span>RECORDS · ROUND 1</span><h2>回復の記録 5案</h2></div>
            <p>月ごとの平均回復スコア・回復方法ランキング・カテゴリ内訳を、5つの異なるグラフ構成で比較します。</p>
          </header>
          <div className="gallery-canvas">
            {recordConcepts.map((concept) => <ConceptCard concept={concept} key={`record-r1-${concept.id}`} />)}
          </div>
        </section>
      </div>

      <footer className="gallery-footer">
        <p>記録画面へのフィードバックを受けるまで、他画面・本番画面には展開しません。</p>
      </footer>
    </div>
  )
}

export default App
