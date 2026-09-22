import PageMeta from '../components/common/PageMeta.jsx'
import { Link } from 'react-router-dom'
import ResearchModuleCard from '../components/research/ResearchModuleCard.jsx'
import PageShell from '../components/layout/PageShell.jsx'
import { project, siteRoutes, teamLine } from '../content/project.js'
import ResearchOutputStatus from '../components/research/ResearchOutputStatus.jsx'
import { researchModules } from '../content/researchModules.js'

export default function ResearchPage() {
  return (
    <>
      <PageMeta title="Research" path="/research" />
      <PageShell
        eyebrow={project.program}
        title="Research"
        introduction={project.summary}
        className="research-page"
      >
        <p className="team-statement">
          <strong>{project.title}</strong><br />
          {teamLine} · Mentored by {project.mentor}
        </p>
        <div className="research-start-row">
          <p>Select two nearby samples and compare their values. The chapters explain the signal, the mathematical questions, and what needs further evidence.</p>
          <Link className="button button-primary" to={siteRoutes.guided}>Explore a real example →</Link>
        </div>
        <div className="research-module-grid">
          {researchModules.map((module) => (
            <ResearchModuleCard key={module.slug} module={module} />
          ))}
        </div>
        <ResearchOutputStatus />
      </PageShell>
    </>
  )
}
