import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import PageShell from '../components/layout/PageShell.jsx'
import { siteRoutes } from '../content/project.js'

export default function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page Not Found" path="/404" />
      <PageShell
        eyebrow="404"
        title="Page not found"
        introduction="The requested page is not part of the current project architecture."
        className="not-found-page"
      >
        <Link className="button button-primary" to={siteRoutes.home}>Return Home</Link>
      </PageShell>
    </>
  )
}
