import { project } from '../../content/project.js'
import '../../styles/resources-refinements.css'

export default function ResearchOutputStatus({ detail }) {
  return (
    <details className="research-output-status compact-output-status">
      <summary>Research output status</summary>
      <p>{detail || 'Paper, scientific reconstruction code, research figures, and results: not yet available.'}</p>
      <p>The chapters introduce the research questions. The data workbench uses calibrated Cassini profiles; the teaching models illustrate mathematical ideas.</p>
      <a className="text-link" href={project.dataSourceUrl} target="_blank" rel="noreferrer">Read the official profile description ↗</a>
    </details>
  )
}
