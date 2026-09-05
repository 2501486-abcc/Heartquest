import { useState, type ReactNode } from 'react'
import type { Screen, User } from '../types'
import { ProfileEditorDialog } from './ProfileEditorDialog'

type AppShellProps = {
  activeScreen: Screen
  children: ReactNode
  onLogout: () => void
  onNavigate: (screen: Screen) => void
  onUpdateDisplayName: (displayName: string) => Promise<void>
  user: User
}

type NavigationItem = {
  label: string
  screen: Screen
  symbol: string
}

const sideNavigationItems: NavigationItem[] = [
  { label: 'ホーム', screen: 'home', symbol: '⌂' },
  { label: '分析', screen: 'analysis', symbol: '⌁' },
  { label: '記録', screen: 'charts', symbol: '▤' },
]

const bottomNavigationItems: NavigationItem[] = sideNavigationItems

export function AppShell({
  activeScreen,
  children,
  onLogout,
  onNavigate,
  onUpdateDisplayName,
  user,
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const activeSideNavigation =
    ['recovery', 'methods', 'ai-suggestions', 'evaluation'].includes(activeScreen)
      ? 'home'
      : activeScreen
  const activeBottomNavigation = activeSideNavigation

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
          {sideNavigationItems.map((item) => (
            <button
              aria-current={activeSideNavigation === item.screen ? 'page' : undefined}
              className={activeSideNavigation === item.screen ? 'is-active' : ''}
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

        <div className="side-profile">
          <span className="profile-avatar" aria-hidden="true">
            は
          </span>
          <span className="side-profile-copy side-nav-label">
            <span className="side-profile-name-row">
              <strong>{user.displayName}</strong>
              <button
                className="profile-edit-button"
                onClick={() => setIsProfileEditorOpen(true)}
                type="button"
              >
                編集
              </button>
            </span>
            <button className="profile-logout-button" onClick={onLogout} type="button">
              ログアウト
            </button>
          </span>
        </div>
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
        {bottomNavigationItems.map((item) => (
          <button
            aria-current={activeBottomNavigation === item.screen ? 'page' : undefined}
            className={activeBottomNavigation === item.screen ? 'is-active' : ''}
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

      {isProfileEditorOpen ? (
        <ProfileEditorDialog
          onClose={() => setIsProfileEditorOpen(false)}
          onUpdateDisplayName={onUpdateDisplayName}
          user={user}
        />
      ) : null}
    </div>
  )
}
