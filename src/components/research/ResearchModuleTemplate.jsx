import { Link } from 'react-router-dom'
import { siteRoutes } from '../../content/project.js'
import { researchModules } from '../../content/researchModules.js'
import ResearchOutputStatus from './ResearchOutputStatus.jsx'
import ToyBranchDiagram from './ToyBranchDiagram.jsx'

export default function ResearchModuleTemplate({ module }) {
  return (
    <div className="module-template">
      <section className="module-area">
        <header><span>01</span><h2>The research question</h2></header>
        <p className="module-question">{module.question}</p>
      </section>
      <section className="module-area">
        <header><span>02</span><h2>What to look for</h2></header>
        <div className="module-reading">{module.reading.map((text) => <p key={text}>{text}</p>)}</div>
      </section>
      <section className="module-example">
        <p className="eyebrow">03 · Try it</p>
        <h2>{module.slug === 'stationary-roots-and-continuation' ? 'Follow the roots of an illustrative model' : module.slug === 'signal-and-phase' ? 'Read the same region in three variables' : 'Trace a plotted value to its source record'}</h2>
        <p>{module.exercise}</p>
        {module.slug === 'stationary-roots-and-continuation' ? <ToyBranchDiagram /> : (
          <Link className="button button-primary" to={siteRoutes.guided}>Open the example region →</Link>
        )}
      </section>
      <details className="module-method-details">
        <summary>Method and data definitions</summary>
        {module.details.map((text) => <p key={text}>{text}</p>)}
      </details>
      <ResearchOutputStatus detail={module.unavailable} />
      <section className="module-next">
        <h2>Continue the investigation</h2>
        <p>{module.next}</p>
        <div className="module-next-links">
          <Link className="text-link" to={siteRoutes.guided}>Open a data exploration →</Link>
          <Link className="text-link" to={siteRoutes.explorations}>Return to My Explorations →</Link>
        </div>
      </section>
      <nav className="chapter-navigation" aria-label="Research chapters">
        {researchModules.filter((item) => item.slug !== module.slug).map((item) => (
          <Link key={item.slug} to={`/research/${item.slug}`}>{item.number} · {item.title} →</Link>
        ))}
      </nav>
    </div>
  )
}
