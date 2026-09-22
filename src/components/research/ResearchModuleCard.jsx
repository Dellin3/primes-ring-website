import { Link } from 'react-router-dom'

export default function ResearchModuleCard({ module }) {
  return (
    <article className="research-module-card">
      <span className="module-number">{module.number}</span>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
        <Link
          className="text-link"
          to={`/research/${module.slug}`}
          aria-label={`Read chapter: ${module.title}`}
        >
          Read chapter →
        </Link>
    </article>
  )
}
