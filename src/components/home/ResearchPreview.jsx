import SectionHeading from '../common/SectionHeading.jsx'
import ResearchModuleCard from '../research/ResearchModuleCard.jsx'
import { researchModules } from '../../content/researchModules.js'
import { project, teamLine } from '../../content/project.js'

export default function ResearchPreview() {
  return (
    <section id="research-preview" className="home-section research-preview" aria-labelledby="research-preview-title">
      <div className="research-deck">
        <SectionHeading eyebrow="The research behind the exploration" title={project.title} id="research-preview-title" description={project.summary} />
        <p className="research-credit">{teamLine} · Mentored by {project.mentor}</p>
        <div className="research-module-grid">
          {researchModules.map((module) => (
            <ResearchModuleCard key={module.slug} module={module} conciseLink />
          ))}
        </div>
      </div>
    </section>
  )
}
