import { Link } from 'react-router-dom'
import { siteRoutes } from '../../content/project.js'

const entrances = [
  { title: 'Follow a question', text: 'Compare nearby samples, note what changes, and keep your observation.', label: 'Start a guided exploration', to: siteRoutes.guided },
  { title: 'Choose your own region', text: 'Browse the available observations and open a precise radial window.', label: 'Open the full workbench', to: siteRoutes.data },
  { title: 'Understand the method', text: 'Connect signal, phase, and numerical reliability to the research questions.', label: 'Read the three chapters', to: siteRoutes.research },
]

export default function ExplorationEntrances() {
  return (
    <section className="exploration-entrances" aria-label="Choose how to explore">
      {entrances.map((entrance, index) => (
        <article key={entrance.to}>
          <p className="eyebrow">0{index + 1}</p>
          <h2>{entrance.title}</h2>
          <p>{entrance.text}</p>
          <Link className="text-link" to={entrance.to}>{entrance.label} →</Link>
        </article>
      ))}
    </section>
  )
}
