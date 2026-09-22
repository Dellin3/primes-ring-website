import { Link } from 'react-router-dom'
import { project, siteRoutes, teamLine } from '../../content/project.js'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="footer-title">{project.title}</p>
          <p>{teamLine} · Mentored by {project.mentor}</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to={siteRoutes.research}>Research</Link>
          <Link to={siteRoutes.data}>Data</Link>
          <Link to={siteRoutes.resources}>Paper & Code</Link>
        </nav>
      </div>
    </footer>
  )
}
