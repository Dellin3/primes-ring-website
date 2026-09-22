export default function PageShell({ eyebrow, title, introduction, children, className = '' }) {
  return (
    <article className={`page-shell ${className}`.trim()}>
      <header className="page-intro">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {introduction && <p className="page-lede">{introduction}</p>}
      </header>
      {children}
    </article>
  )
}
