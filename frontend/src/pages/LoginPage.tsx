import { useState } from 'react'

type LoginPageProps = {
  isLoading: boolean
  onLogin: (email: string) => Promise<void>
}

export function LoginPage({ isLoading, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('demo@heartquest.local')

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark brand-mark-large" aria-hidden="true">
            ♥
          </span>
          <span>HeartQuest</span>
        </div>
        <div>
          <p className="eyebrow">YOUR PERSONAL RECOVERY GUIDE</p>
          <h1 id="login-title">
            休むことを、
            <br />
            もっと自分らしく。
          </h1>
          <p className="login-lead">
            毎日の小さな回復を記録して、あなたに本当に合う休み方を見つけよう。
          </p>
        </div>
        <div className="login-orbit" aria-hidden="true">
          <div className="orbit-center">☘</div>
          <span className="orbit-note orbit-note-one">深呼吸</span>
          <span className="orbit-note orbit-note-two">散歩</span>
          <span className="orbit-note orbit-note-three">音楽</span>
        </div>
      </section>

      <section className="login-panel" aria-label="ログインフォーム">
        <div className="login-card">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>おかえりなさい</h2>
          <p className="muted-text">デモ用アカウントですぐに体験できます。</p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void onLogin(email)
            }}
          >
            <label className="field-label" htmlFor="email">
              メールアドレス
            </label>
            <input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <label className="field-label" htmlFor="password">
              パスワード
            </label>
            <input
              autoComplete="current-password"
              defaultValue="heartquest"
              id="password"
              minLength={6}
              required
              type="password"
            />
            <button className="primary-button full-width" disabled={isLoading} type="submit">
              {isLoading ? '準備しています…' : 'デモをはじめる'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="demo-notice">
            <span aria-hidden="true">●</span>
            ローカルデモのため、入力内容は外部に送信されません
          </p>
        </div>
      </section>
    </main>
  )
}
