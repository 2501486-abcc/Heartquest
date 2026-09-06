import { useEffect, useRef, useState } from 'react'
import './App.css'
import { AppShell } from './components/AppShell'
import { AiSuggestionsPage } from './pages/AiSuggestionsPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { ChartsPage } from './pages/ChartsPage'
import { EvaluationPage } from './pages/EvaluationPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MethodSelectionPage } from './pages/MethodSelectionPage'
import { RecoveryPage } from './pages/RecoveryPage'
import { heartQuestService } from './services/heartquestService'
import type {
  AiAnalysis,
  AnalyticsData,
  Bookmark,
  RecoveryEntry,
  RecoveryMethod,
  Screen,
  User,
} from './types'

const bookmarkMatchesMethod = (bookmark: Bookmark, method: RecoveryMethod) =>
  bookmark.title === method.title &&
  bookmark.description === method.description &&
  bookmark.category === method.category &&
  bookmark.source === method.source

const restorableScreens: Screen[] = ['home', 'recovery', 'methods', 'analysis', 'charts']

const screenFromLocation = (): Screen | null => {
  const candidate = window.location.hash.replace(/^#\/?/, '') as Screen
  return restorableScreens.includes(candidate) ? candidate : null
}

const locationScreenFor = (screen: Screen): Screen => {
  if (screen === 'ai-suggestions' || screen === 'evaluation') return 'methods'
  return restorableScreens.includes(screen) ? screen : 'home'
}

function AuthLoadingPage() {
  return (
    <main className="login-page" aria-busy="true">
      <section className="login-intro" aria-label="HeartQuest">
        <div className="login-brand">
          <span className="brand-mark brand-mark-large" aria-hidden="true">
            ♥
          </span>
          <span>HeartQuest</span>
        </div>
        <div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1>
            前回の続きから、
            <br />
            準備しています。
          </h1>
          <p className="login-lead">保存されたログイン情報を安全に確認しています。</p>
        </div>
      </section>
      <section className="login-panel" aria-live="polite">
        <div className="login-card">
          <p className="eyebrow">RESTORING SESSION</p>
          <h2>少々お待ちください</h2>
          <p className="muted-text">認証が確認でき次第、自動的に画面を表示します。</p>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>(() => screenFromLocation() ?? 'home')
  const requestedScreen = useRef<Screen>(screen)
  const [user, setUser] = useState<User | null>(null)
  const [recoveries, setRecoveries] = useState<RecoveryEntry[]>([])
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null)
  const [suggestions, setSuggestions] = useState<RecoveryMethod[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarkingIds, setBookmarkingIds] = useState<string[]>([])
  const [bookmarkNotice, setBookmarkNotice] = useState('')
  const [moodBefore, setMoodBefore] = useState(3)
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null)
  const [analyzedRecovery, setAnalyzedRecovery] = useState<RecoveryEntry | null>(null)
  const [pendingRecovery, setPendingRecovery] = useState<RecoveryEntry | null>(null)
  const authGeneration = useRef(0)
  const saving = useRef(false)
  const loadingSuggestions = useRef(false)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    monthly: [],
    breakdown: [],
    ranking: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const restoreScreenFromLocation = () => {
      const restoredScreen = screenFromLocation()
      if (!restoredScreen) return
      requestedScreen.current = restoredScreen
      if (user) setScreen(restoredScreen)
    }

    window.addEventListener('hashchange', restoreScreenFromLocation)
    return () => window.removeEventListener('hashchange', restoreScreenFromLocation)
  }, [user])

  useEffect(() => {
    if (isAuthChecking || !user || screen === 'login') return

    const locationScreen = locationScreenFor(screen)
    requestedScreen.current = locationScreen
    const nextHash = `#/${locationScreen}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash)
    }
  }, [isAuthChecking, screen, user])

  useEffect(() => {
    const unsubscribe = heartQuestService.observeAuthState(async (authenticatedUser, authError) => {
      authGeneration.current += 1
      const generation = authGeneration.current
      setSuggestions([])
      setAnalysis(null)
      setAnalyzedRecovery(null)
      setPendingRecovery(null)
      setIsSaving(false)
      setIsAiLoading(false)
      saving.current = false
      loadingSuggestions.current = false
      if (authError) {
        setUser(null)
        setScreen('login')
        setError('認証情報を確認できませんでした。もう一度ログインしてください。')
        setIsAuthChecking(false)
        setIsLoading(false)
        return
      }

      if (!authenticatedUser) {
        setUser(null)
        setScreen('login')
        setRecoveries([])
        setBookmarks([])
        setBookmarkingIds([])
        setBookmarkNotice('')
        setSelectedMethod(null)
        setIsAuthChecking(false)
        setIsLoading(false)
        return
      }

      setError('')
      setUser(authenticatedUser)
      setScreen((current) => current === 'login' ? requestedScreen.current : current)
      setIsAuthChecking(false)
      setIsLoading(false)

      try {
        const [history, analyticsData, savedBookmarks] = await Promise.all([
          heartQuestService.getRecoveries(),
          heartQuestService.getAnalytics(),
          heartQuestService.getBookmarks(),
        ])
        if (generation !== authGeneration.current) return
        setRecoveries(history)
        setAnalytics(analyticsData)
        setBookmarks(savedBookmarks)
      } catch {
        if (generation === authGeneration.current) {
          setError('HeartQuestのデータを読み込めませんでした。もう一度お試しください。')
        }
      }
    })

    return unsubscribe
  }, [])

  const firebaseRegistrationErrorMessage = (registrationError: unknown) => {
    const code =
      typeof registrationError === 'object' &&
      registrationError !== null &&
      'code' in registrationError &&
      typeof registrationError.code === 'string'
        ? registrationError.code
        : ''

    switch (code) {
      case 'auth/email-already-in-use':
        return 'このメールアドレスはすでに登録されています。ログインをお試しください。'
      case 'auth/invalid-email':
        return 'メールアドレスの形式を確認してください。'
      case 'auth/weak-password':
        return 'パスワードは6文字以上で入力してください。'
      case 'auth/operation-not-allowed':
        return '現在、新規登録を利用できません。管理者にお問い合わせください。'
      case 'auth/network-request-failed':
        return '通信に失敗しました。インターネット接続を確認して、もう一度お試しください。'
      default:
        return code
          ? 'アカウントを作成できませんでした。入力内容を確認して、もう一度お試しください。'
          : 'Firebaseアカウントは作成されましたが、HeartQuestのユーザー登録を完了できませんでした。バックエンドを確認して、ページを再読み込みしてください。'
    }
  }

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError('')
    try {
      await heartQuestService.login(email, password)
    } catch {
      setError('メールアドレスまたはパスワードを確認してください。')
      setIsLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string, displayName: string) => {
    setIsLoading(true)
    setError('')
    try {
      const authenticatedUser = await heartQuestService.register(email, password, displayName)
      setUser(authenticatedUser)
      setScreen('home')

      try {
        const [history, analyticsData, savedBookmarks] = await Promise.all([
          heartQuestService.getRecoveries(),
          heartQuestService.getAnalytics(),
          heartQuestService.getBookmarks(),
        ])
        setRecoveries(history)
        setAnalytics(analyticsData)
        setBookmarks(savedBookmarks)
      } catch {
        setError('アカウントは作成されましたが、データを読み込めませんでした。ページを再読み込みしてください。')
      }
    } catch (registrationError) {
      setError(firebaseRegistrationErrorMessage(registrationError))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateDisplayName = async (displayName: string) => {
    const updatedUser = await heartQuestService.updateDisplayName(displayName)
    setUser(updatedUser)
  }

  const loadSuggestions = async (currentMood = moodBefore) => {
    if (loadingSuggestions.current) return
    loadingSuggestions.current = true
    const generation = authGeneration.current
    setScreen('ai-suggestions')
    setIsAiLoading(true)
    setError('')
    setBookmarkNotice('')
    setSuggestions([])
    try {
      const methods = await heartQuestService.getRecommendations(currentMood)
      if (generation === authGeneration.current) setSuggestions(methods)
    } catch (aiError) {
      if (generation === authGeneration.current) {
        setError(aiError instanceof Error ? aiError.message : 'AI提案を取得できませんでした。もう一度お試しください。')
      }
    } finally {
      if (generation === authGeneration.current) {
        setIsAiLoading(false)
        loadingSuggestions.current = false
      }
    }
  }

  const selectMethod = (method: RecoveryMethod) => {
    if (saving.current) return
    setPendingRecovery(null)
    setSelectedMethod(method)
    setScreen('evaluation')
  }

  const completeRecovery = async (rating: number, memo: string) => {
    if (!selectedMethod || saving.current) return
    saving.current = true
    const generation = authGeneration.current
    setIsSaving(true)
    setError('')
    let savedRecovery = pendingRecovery
    try {
      if (!savedRecovery) {
        savedRecovery = await heartQuestService.saveRecovery({
          method: selectedMethod,
          memo,
          moodBefore,
          rating,
        })
        if (generation !== authGeneration.current) return
        const created = savedRecovery
        setPendingRecovery(created)
        setRecoveries((current) => [created, ...current])
      }
      const aiAnalysis = await heartQuestService.analyzeRecovery(savedRecovery)
      if (generation !== authGeneration.current) return
      const analyzed = { ...savedRecovery, aiScore: aiAnalysis.score, aiComment: aiAnalysis.summary }
      setRecoveries((current) => current.map((item) => item.id === analyzed.id ? analyzed : item))
      setAnalysis(aiAnalysis)
      setAnalyzedRecovery(analyzed)
      setScreen('analysis')

      try {
        const updatedAnalytics = await heartQuestService.getAnalytics()
        if (generation === authGeneration.current) setAnalytics(updatedAnalytics)
      } catch {
        if (generation === authGeneration.current) setError('記録は保存されましたが、グラフを更新できませんでした。')
      }
    } catch (aiError) {
      if (generation === authGeneration.current) {
        const detail = aiError instanceof Error ? aiError.message : 'もう一度お試しください。'
        setError(savedRecovery
          ? `記録は保存済みですが、AI分析を完了できませんでした。分析だけを再試行できます。${detail}`
          : '記録を保存できませんでした。入力内容を残したまま、もう一度お試しください。')
      }
    } finally {
      if (generation === authGeneration.current) {
        setIsSaving(false)
        saving.current = false
      }
    }
  }

  const toggleBookmark = async (method: RecoveryMethod) => {
    if (bookmarkingIds.includes(method.id)) return

    setBookmarkingIds((current) => [...current, method.id])
    setBookmarkNotice('')
    setError('')

    const existingBookmark = bookmarks.find((bookmark) =>
      bookmarkMatchesMethod(bookmark, method),
    )

    try {
      if (existingBookmark) {
        await heartQuestService.deleteBookmark(existingBookmark.id)
        setBookmarks((current) =>
          current.filter((bookmark) => bookmark.id !== existingBookmark.id),
        )
        setBookmarkNotice(`「${method.title}」の保存を解除しました。`)
      } else {
        const created = await heartQuestService.createBookmark(method)
        setBookmarks((current) => [created, ...current])
        setBookmarkNotice(`「${method.title}」を保存しました。`)
      }
    } catch {
      setError(
        existingBookmark
          ? '保存の解除に失敗しました。もう一度お試しください。'
          : '回復方法を保存できませんでした。もう一度お試しください。',
      )
    } finally {
      setBookmarkingIds((current) => current.filter((id) => id !== method.id))
    }
  }

  const logout = async () => {
    setError('')
    try {
      await heartQuestService.logout()
    } catch {
      setError('ログアウトに失敗しました。もう一度お試しください。')
    }
  }

  if (isAuthChecking) {
    return <AuthLoadingPage />
  }

  if (!user || screen === 'login') {
    return (
      <>
        {error ? <div className="status-banner">{error}</div> : null}
        <LoginPage
          isLoading={isLoading || isAuthChecking}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </>
    )
  }

  let content

  switch (screen) {
    case 'recovery':
      content = (
        <RecoveryPage
          initialMood={moodBefore}
          onBack={() => setScreen('home')}
          onContinue={(mood) => {
            setMoodBefore(mood)
            setScreen('methods')
          }}
        />
      )
      break
    case 'methods':
      content = (
        <MethodSelectionPage
          onAiSuggestions={() => void loadSuggestions()}
          onBack={() => setScreen('home')}
          onSelect={selectMethod}
        />
      )
      break
    case 'ai-suggestions':
      const bookmarkedIds = suggestions
        .filter((method) =>
          bookmarks.some((bookmark) => bookmarkMatchesMethod(bookmark, method)),
        )
        .map((method) => method.id)
      content = (
        <AiSuggestionsPage
          bookmarkedIds={bookmarkedIds}
          bookmarkNotice={bookmarkNotice}
          bookmarkingIds={bookmarkingIds}
          isLoading={isAiLoading}
          methods={suggestions}
          onBack={() => setScreen('methods')}
          onBookmark={toggleBookmark}
          onRefresh={() => void loadSuggestions()}
          onSelect={selectMethod}
        />
      )
      break
    case 'evaluation':
      content = selectedMethod ? (
        <EvaluationPage
          key={selectedMethod.id}
          isSaving={isSaving}
          savedRecovery={pendingRecovery}
          method={selectedMethod}
          onBack={() => { if (!saving.current) setScreen('methods') }}
          onSubmit={completeRecovery}
        />
      ) : (
        <MethodSelectionPage
          onAiSuggestions={() => void loadSuggestions()}
          onBack={() => setScreen('home')}
          onSelect={selectMethod}
        />
      )
      break
    case 'analysis':
      content = (
        <AnalysisPage
          analysis={analysis}
          latestRecovery={analyzedRecovery ?? recoveries.find((item) => item.aiComment) ?? undefined}
          onNavigate={setScreen}
          recoveries={recoveries}
        />
      )
      break
    case 'charts':
      content = <ChartsPage analytics={analytics} recoveries={recoveries} />
      break
    case 'home':
    default:
      content = (
        <HomePage
          onContinue={(mood) => {
            setMoodBefore(mood)
            setScreen('methods')
          }}
          user={user}
        />
      )
  }

  return (
    <AppShell
      activeScreen={screen}
      onLogout={() => void logout()}
      onNavigate={setScreen}
      onUpdateDisplayName={handleUpdateDisplayName}
      user={user}
    >
      {error ? <div className="status-banner inline-banner">{error}</div> : null}
      {content}
    </AppShell>
  )
}

export default App
