import { Link } from 'react-router-dom'
import SectionHeading from '../common/SectionHeading.jsx'
import { project, siteRoutes } from '../../content/project.js'
import '../../styles/resources-refinements.css'

export default function ResourcePreview() {
  return (
    <section className="home-section resource-preview refined-resource-preview" aria-labelledby="resource-preview-title">
      <div className="resource-preview-inner">
        <SectionHeading eyebrow="Project record" title="Paper, code & sources" id="resource-preview-title" />
        <div className="resource-shelf">
          <div className="resource-list">
            <article>
              <span>Paper</span>
              <h3>Project manuscript</h3>
              <p>{project.paperStatus}</p>
              <Link className="text-link" to={`${siteRoutes.resources}#paper`}>Paper details →</Link>
            </article>
            <article>
              <span>Website code</span>
              <h3>Website & data viewer</h3>
              <p>Public frontend code. Scientific reconstruction code is not yet available.</p>
              <a className="text-link" href={project.repositoryUrl} target="_blank" rel="noreferrer">Open repository ↗</a>
            </article>
            <article>
              <span>Data</span>
              <h3>Cassini radio occultations</h3>
              <p>Source profiles and documentation from the Planetary Data System.</p>
              <a className="text-link" href={project.dataSourceUrl} target="_blank" rel="noreferrer">Read source documentation ↗</a>
            </article>
          </div>
        </div>
        <Link className="text-link learning-resources-link" to={`${siteRoutes.resources}#learning`}>Student learning resources →</Link>
      </div>
    </section>
  )
}
