import { useState, type ReactNode } from 'react'
import type { Screen, User } from '../types'

type AppShellProps = {
  activeScreen: Screen
  children: ReactNode
  onLogout: () => void
  onNavigate: (screen: Screen) => void
  user: User
}

const navigationItems: Array<{
  label: string
  screen: Screen
  symbol: string
}> = [
  { label: 'ホーム', screen: 'home', symbol: '⌂' },
  { label: '回復する', screen: 'recovery', symbol: '＋' },
  { label: '分析', screen: 'analysis', symbol: '⌁' },
]

export function AppShell({
  activeScreen,
  children,
  onLogout,
  onNavigate,
  user,
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const activeNavigation =
    ['recovery', 'methods', 'ai-suggestions', 'evaluation'].includes(activeScreen)
      ? 'recovery'
      : ['analysis', 'charts'].includes(activeScreen)
        ? 'analysis'
        : activeScreen

  return (
    <div className={'app-shell' + (isSidebarCollapsed ? ' is-sidebar-collapsed' : '')}>
      <aside className="side-nav">
        <div className="side-nav-header">
          <button
            aria-label="ホームへ移動"
            className="brand-button"
            onClick={() => onNavigate('home')}
            type="button"
          >
            <span className="brand-mark" aria-hidden="true">
              ♥
            </span>
            <span className="side-nav-label">HeartQuest</span>
          </button>
          <button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'メニューを展開する' : 'メニューを折りたたむ'}
            className="side-nav-toggle"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            type="button"
          >
            <span aria-hidden="true">{isSidebarCollapsed ? '›' : '‹'}</span>
          </button>
        </div>

        <nav className="side-nav-links" aria-label="メインナビゲーション">
          {navigationItems.map((item) => (
            <button
              aria-current={activeNavigation === item.screen ? 'page' : undefined}
              className={activeNavigation === item.screen ? 'is-active' : ''}
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              title={isSidebarCollapsed ? item.label : undefined}
              type="button"
            >
              <span className="nav-symbol" aria-hidden="true">
                {item.symbol}
              </span>
              <span className="side-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          className="side-profile"
          onClick={onLogout}
          title="デモからログアウト"
          type="button"
        >
          <span className="profile-avatar" aria-hidden="true">
            は
          </span>
          <span className="side-profile-copy side-nav-label">
            <strong>{user.displayName}</strong>
            <small>ログアウト</small>
          </span>
        </button>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <button
            aria-label="ホームへ移動"
            className="brand-button"
            onClick={() => onNavigate('home')}
            type="button"
          >
            <span className="brand-mark" aria-hidden="true">
              ♥
            </span>
            <span>HeartQuest</span>
          </button>
          <button
            className="profile-chip"
            onClick={onLogout}
            title="デモからログアウト"
            type="button"
          >
            <span className="profile-avatar" aria-hidden="true">
              は
            </span>
            <span className="profile-name">{user.displayName}</span>
          </button>
        </header>

        <main className="app-main">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="スマホ用メインナビゲーション">
        {navigationItems.map((item) => (
          <button
            aria-current={activeNavigation === item.screen ? 'page' : undefined}
            className={activeNavigation === item.screen ? 'is-active' : ''}
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            type="button"
          >
            <span className="nav-symbol" aria-hidden="true">
              {item.symbol}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
