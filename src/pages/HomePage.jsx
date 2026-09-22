import PageMeta from '../components/common/PageMeta.jsx'
import DataPreview from '../components/home/DataPreview.jsx'
import ProjectHero from '../components/home/ProjectHero.jsx'
import ResearchPreview from '../components/home/ResearchPreview.jsx'
import ResourcePreview from '../components/home/ResourcePreview.jsx'
import ExplorationEntrances from '../components/home/ExplorationEntrances.jsx'
import { project } from '../content/project.js'

export default function HomePage() {
  return (
    <>
      <PageMeta description={project.visitorSummary} />
      <ProjectHero />
      <DataPreview />
      <ExplorationEntrances />
      <ResearchPreview />
      <ResourcePreview />
    </>
  )
}
