import { useParams } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import ResearchModuleTemplate from '../components/research/ResearchModuleTemplate.jsx'
import PageShell from '../components/layout/PageShell.jsx'
import { getResearchModule } from '../content/researchModules.js'
import NotFoundPage from './NotFoundPage.jsx'

export default function ResearchModulePage() {
  const { moduleSlug } = useParams()
  const module = getResearchModule(moduleSlug)

  if (!module) return <NotFoundPage />

  return (
    <>
      <PageMeta
        title={module.title}
        description={module.description}
        path={`/research/${module.slug}`}
      />
      <PageShell
        eyebrow={`Research chapter ${module.number}`}
        title={module.title}
        introduction={module.explanation}
        className="module-page"
      >
        <ResearchModuleTemplate module={module} />
      </PageShell>
    </>
  )
}
