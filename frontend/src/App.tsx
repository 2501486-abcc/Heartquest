import { useEffect, useState } from 'react'
import './App.css'
import { AppShell } from './components/AppShell'
import { defaultAnalysis } from './data/mockData'
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

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<User | null>(null)
  const [recoveries, setRecoveries] = useState<RecoveryEntry[]>([])
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null)
  const [suggestions, setSuggestions] = useState<RecoveryMethod[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarkingIds, setBookmarkingIds] = useState<string[]>([])
  const [bookmarkNotice, setBookmarkNotice] = useState('')
  const [moodBefore, setMoodBefore] = useState(3)
  const [analysis, setAnalysis] = useState<AiAnalysis>(defaultAnalysis)
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
    const unsubscribe = heartQuestService.observeAuthState(async (authenticatedUser, authError) => {
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
      try {
        const [history, analyticsData, savedBookmarks] = await Promise.all([
          heartQuestService.getRecoveries(),
          heartQuestService.getAnalytics(),
          heartQuestService.getBookmarks(),
        ])
        setUser(authenticatedUser)
        setRecoveries(history)
        setAnalytics(analyticsData)
        setBookmarks(savedBookmarks)
        setScreen('home')
      } catch {
        setError('HeartQuestのデータを読み込めませんでした。もう一度お試しください。')
      } finally {
        setIsAuthChecking(false)
        setIsLoading(false)
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

  const handleRegister = async (email: string, password: string) => {
    setIsLoading(true)
    setError('')
    try {
      const authenticatedUser = await heartQuestService.register(email, password)
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

  const loadSuggestions = async () => {
    setScreen('ai-suggestions')
    setIsAiLoading(true)
    setError('')
    setBookmarkNotice('')
    try {
      setSuggestions(await heartQuestService.getRecommendations())
    } catch {
      setError('AI提案を取得できませんでした。もう一度お試しください。')
    } finally {
      setIsAiLoading(false)
    }
  }

  const selectMethod = (method: RecoveryMethod) => {
    setSelectedMethod(method)
    setScreen('evaluation')
  }

  const completeRecovery = async (rating: number, memo: string) => {
    if (!selectedMethod) return
    setIsSaving(true)
    setError('')
    try {
      const savedRecovery = await heartQuestService.saveRecovery({
        method: selectedMethod,
        memo,
        moodBefore,
        rating,
      })
      const aiAnalysis = await heartQuestService.analyzeRecovery(
        savedRecovery,
        moodBefore,
      )
      setRecoveries((current) => [savedRecovery, ...current])
      setAnalysis(aiAnalysis)
      setScreen('analysis')

      try {
        setAnalytics(await heartQuestService.getAnalytics())
      } catch {
        setError('記録は保存されましたが、分析データを更新できませんでした。')
      }
    } catch {
      setError('記録を保存できませんでした。入力内容を残したまま、もう一度お試しください。')
    } finally {
      setIsSaving(false)
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

  if (isAuthChecking || !user || screen === 'login') {
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
          onBack={() => setScreen('recovery')}
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
          isSaving={isSaving}
          method={selectedMethod}
          onBack={() => setScreen('methods')}
          onSubmit={completeRecovery}
        />
      ) : (
        <MethodSelectionPage
          onAiSuggestions={() => void loadSuggestions()}
          onBack={() => setScreen('recovery')}
          onSelect={selectMethod}
        />
      )
      break
    case 'analysis':
      content = (
        <AnalysisPage
          analysis={analysis}
          latestRecovery={recoveries[0]}
          onNavigate={setScreen}
        />
      )
      break
    case 'charts':
      content = <ChartsPage analytics={analytics} onBack={() => setScreen('analysis')} />
      break
    case 'home':
    default:
      content = (
        <HomePage recoveries={recoveries} user={user} onNavigate={setScreen} />
      )
  }

  return (
    <AppShell
      activeScreen={screen}
      onLogout={() => void logout()}
      onNavigate={setScreen}
      user={user}
    >
      {error ? <div className="status-banner inline-banner">{error}</div> : null}
      {content}
    </AppShell>
  )
}

export default App
