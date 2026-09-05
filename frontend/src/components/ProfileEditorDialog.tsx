import { useState, type FormEvent } from 'react'
import type { User } from '../types'

type ProfileEditorDialogProps = {
  onClose: () => void
  onUpdateDisplayName: (displayName: string) => Promise<void>
  user: User
}

export function ProfileEditorDialog({
  onClose,
  onUpdateDisplayName,
  user,
}: ProfileEditorDialogProps) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedDisplayName = displayName.trim()
    setError('')

    if (!normalizedDisplayName) {
      setError('ユーザー名を入力してください。')
      return
    }

    setIsSaving(true)
    try {
      await onUpdateDisplayName(normalizedDisplayName)
      setIsSaving(false)
      onClose()
    } catch {
      setError('ユーザー名を変更できませんでした。もう一度お試しください。')
      setIsSaving(false)
    }
  }

  return (
    <div className="profile-editor-overlay" role="presentation">
      <section
        aria-labelledby="profile-editor-title"
        aria-modal="true"
        className="profile-editor-dialog"
        role="dialog"
      >
        <div className="profile-editor-heading">
          <div>
            <p className="eyebrow">PROFILE</p>
            <h2 id="profile-editor-title">プロフィールを編集</h2>
          </div>
          <button
            aria-label="プロフィール編集を閉じる"
            className="profile-editor-close"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={(event) => void submit(event)}>
          <label className="field-label" htmlFor="profile-display-name">
            ユーザー名
          </label>
          <input
            autoFocus
            autoComplete="nickname"
            id="profile-display-name"
            maxLength={30}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            type="text"
            value={displayName}
          />
          <small className="profile-editor-hint">1～30文字で入力してください。</small>
          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="profile-editor-actions">
            <button
              className="secondary-button"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              キャンセル
            </button>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? '保存中…' : '変更を保存'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
