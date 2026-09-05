type PageHeaderProps = {
  description?: string
  eyebrow: string
  onBack?: () => void
  title: string
}

export function PageHeader({
  description,
  eyebrow,
  onBack,
  title,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      {onBack ? (
        <button className="back-button" onClick={onBack} type="button">
          <span aria-hidden="true">←</span>
          戻る
        </button>
      ) : null}
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description ? <p className="page-header-description">{description}</p> : null}
    </header>
  )
}
