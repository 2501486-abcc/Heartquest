import { useEffect, useState } from 'react'
import './App.css'
import { AppShell } from './components/AppShell'
import { defaultAnalysis, mockAnalytics } from './data/mockData'
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
  RecoveryEntry,
  RecoveryMethod,
  Screen,
  User,
} from './types'

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<User | null>(null)
  const [recoveries, setRecoveries] = useState<RecoveryEntry[]>([])
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null)
  const [suggestions, setSuggestions] = useState<RecoveryMethod[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [moodBefore, setMoodBefore] = useState(3)
  const [analysis, setAnalysis] = useState<AiAnalysis>(defaultAnalysis)
  const [analytics, setAnalytics] = useState<AnalyticsData>(mockAnalytics)
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
        setSelectedMethod(null)
        setIsAuthChecking(false)
        setIsLoading(false)
        return
      }

      setError('')
      try {
        const [history, analyticsData] = await Promise.all([
          heartQuestService.getRecoveries(),
          heartQuestService.getAnalytics(),
        ])
        setUser(authenticatedUser)
        setRecoveries(history)
        setAnalytics(analyticsData)
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

  const loadSuggestions = async () => {
    setScreen('ai-suggestions')
    setIsAiLoading(true)
    setError('')
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
    } catch {
      setError('記録を保存できませんでした。入力内容を残したまま、もう一度お試しください。')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleBookmark = (method: RecoveryMethod) => {
    // TODO(API): POST /bookmarks または DELETE /bookmarks/{id} に置き換える。
    setBookmarkedIds((current) =>
      current.includes(method.id)
        ? current.filter((id) => id !== method.id)
        : [...current, method.id],
    )
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
        <LoginPage isLoading={isLoading || isAuthChecking} onLogin={handleLogin} />
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
      content = (
        <AiSuggestionsPage
          bookmarkedIds={bookmarkedIds}
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
