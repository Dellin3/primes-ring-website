import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import PageShell from '../components/layout/PageShell.jsx'
import { project, siteRoutes, teamLine } from '../content/project.js'
import '../styles/resources-refinements.css'

export default function ResourcesPage() {
  return <>
    <PageMeta title="Paper & Code" description="Project materials, website source code, Cassini data documentation, and learning resources." path="/resources" />
    <PageShell eyebrow="Project resources" title="Paper & Code" introduction="Find the source data, the website code, and a path into the research." className="resources-page refined-resources">
      <div className="resource-sections">
        <section id="paper">
          <p className="section-number">01 · Paper</p>
          <div className="resource-entry-content">
            <h2>{project.title}</h2>
            <p>{teamLine} · Mentored by {project.mentor}</p>
            <p className="resource-availability">{project.paperStatus}</p>
            <div className="resource-entry-actions">
              {project.paperUrl && <a className="text-link" href={project.paperUrl}>Read the manuscript ↗</a>}
              <Link className="text-link" to={siteRoutes.research}>Read the research chapters →</Link>
            </div>
          </div>
        </section>
        <section id="code">
          <p className="section-number">02 · Code</p>
          <div className="resource-entry-content">
            <h2>Website & data viewer</h2>
            <p className="resource-availability">Public repository</p>
            <p>Frontend code for the website and its data viewer. This repository link does not provide a complete scientific ring-reconstruction implementation.</p>
            <div className="resource-entry-actions"><a className="text-link" href={project.repositoryUrl} target="_blank" rel="noreferrer">Open website repository ↗</a></div>
            <div className="scientific-code-status"><h3>Scientific reconstruction code</h3><p>{project.scientificCodeUrl ? 'Implementation and environment documentation' : 'Not yet available'}</p>{project.scientificCodeUrl && <a className="text-link" href={project.scientificCodeUrl} target="_blank" rel="noreferrer">Open scientific implementation ↗</a>}</div>
          </div>
        </section>
        <section id="data-sources">
          <p className="section-number">03 · Source data</p>
          <div className="resource-entry-content">
            <h2>Cassini radio-occultation profiles</h2>
            <p className="resource-availability">Planetary Data System archive</p>
            <p>Diffraction-Limited Profiles (DLP) are calibrated measurements that still contain diffraction effects. They are inputs to reconstruction, not this project’s reconstructed ring profiles.</p>
            <div className="resource-entry-actions"><a className="text-link" href={project.dataSourceUrl} target="_blank" rel="noreferrer">Read source documentation ↗</a><Link className="text-link" to={siteRoutes.data}>Open the data workbench →</Link></div>
            <details className="resource-processing"><summary>Data & processing</summary>
              <p>The Planetary Data System (PDS) archives planetary mission data. Cassini’s Radio Science Subsystem (RSS) made these observations; the Deep Space Network (DSN) received the radio signals. The source metadata identifies each receiving station.</p>
              <p>Each workbench observation links its source identity, processing version, converted records, display overview, and local samples. Conversion checks establish consistency with source records; they do not remove observational uncertainty or validate a scientific reconstruction.</p>
              <a className="text-link" href="/data/observations/catalog.json" target="_blank" rel="noreferrer">View observation catalog (JSON) ↗</a>
            </details>
          </div>
        </section>
        <section id="research-results">
          <p className="section-number">04 · Research results</p>
          <div className="resource-entry-content"><h2>Figures & supporting results</h2><p className="resource-availability">Not yet available</p><p>Research figures, stationary-root outputs, branch records, numerical diagnostics, and reconstructed profiles.</p><div className="resource-entry-actions"><Link className="text-link" to="/research/stationary-roots-and-continuation">Open the illustrative branch model →</Link></div></div>
        </section>
        <section id="learning">
          <p className="section-number">05 · Learning resources</p>
          <div className="resource-entry-content">
            <h2>Develop a research question</h2>
            <p>Use Research Starter Lab to develop a question and keep a research record in your browser.</p>
            <div className="resource-entry-actions"><a className="text-link" href={project.learningUrl} target="_blank" rel="noreferrer">Open Research Starter Lab ↗</a></div>
          </div>
        </section>
      </div>
    </PageShell>
  </>
}
