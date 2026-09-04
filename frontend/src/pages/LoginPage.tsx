import { useState } from 'react'

type LoginPageProps = {
  isLoading: boolean
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
}

export function LoginPage({ isLoading, onLogin, onRegister }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [formError, setFormError] = useState('')

  const switchMode = () => {
    setIsRegistering((current) => !current)
    setPassword('')
    setPasswordConfirmation('')
    setFormError('')
  }

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

      <section
        className="login-panel"
        aria-label={isRegistering ? '新規登録フォーム' : 'ログインフォーム'}
      >
        <div className="login-card">
          <p className="eyebrow">{isRegistering ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</p>
          <h2>{isRegistering ? 'はじめまして' : 'おかえりなさい'}</h2>
          <p className="muted-text">
            {isRegistering
              ? 'メールアドレスとパスワードでアカウントを作成します。'
              : 'Firebase AuthenticationでHeartQuestにログインします。'}
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              setFormError('')

              if (isRegistering) {
                if (password !== passwordConfirmation) {
                  setFormError('確認用パスワードが一致しません。')
                  return
                }
                void onRegister(email, password)
                return
              }

              void onLogin(email, password)
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
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              id="password"
              maxLength={4096}
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {isRegistering ? (
              <>
                <label className="field-label" htmlFor="password-confirmation">
                  パスワード（確認）
                </label>
                <input
                  autoComplete="new-password"
                  id="password-confirmation"
                  maxLength={4096}
                  minLength={6}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  required
                  type="password"
                  value={passwordConfirmation}
                />
              </>
            ) : null}
            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <button className="primary-button full-width" disabled={isLoading} type="submit">
              {isLoading
                ? '認証を確認しています…'
                : isRegistering
                  ? 'アカウントを作成'
                  : 'ログイン'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-switch">
            <span>{isRegistering ? 'すでにアカウントをお持ちですか？' : '初めて利用しますか？'}</span>
            <button
              className="auth-switch-button"
              disabled={isLoading}
              onClick={switchMode}
              type="button"
            >
              {isRegistering ? 'ログインへ' : '新規登録へ'}
            </button>
          </div>

          <p className="demo-notice">
            <span aria-hidden="true">●</span>
            認証情報はFirebase Authenticationで安全に管理されます
          </p>
        </div>
      </section>
    </main>
  )
}
