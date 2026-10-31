import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { project } from './content/project.js'
import { cohortPath, primesCohorts } from './content/primesCohorts.js'
import { sections } from './content/saturn.js'
import Explorer from './orbit/Explorer.jsx'
import Notebook from './orbit/Notebook.jsx'
import Research from './orbit/Research.jsx'
import ResearchArchive from './orbit/ResearchArchive.jsx'
import CohortPage from './orbit/CohortPage.jsx'
import Planet from './orbit/Planet.jsx'
import Rings from './orbit/Rings.jsx'
import Moons from './orbit/Moons.jsx'
import Missions from './orbit/Missions.jsx'

export const siteOrigin = project.publicSiteUrl

// Public section pages, in navigation order, plus one page per PRIMES cohort.
export const sectionRoutes = sections.map(section => section.path)
export const cohortRoutes = primesCohorts.map(cohortPath)

// The lazily loaded source module behind each prerendered route, so the
// prerender step can link that route's CSS in the static HTML.
export function routeEntry(path) {
  if (path === '/research') return 'src/orbit/ResearchArchive.jsx'
  if (cohortRoutes.includes(path)) return primesCohorts.find(cohort => cohortPath(cohort) === path).story ? 'src/orbit/Research.jsx' : 'src/orbit/CohortPage.jsx'
  const pages = { '/planet': 'Planet', '/rings': 'Rings', '/moons': 'Moons', '/missions': 'Missions', '/explorations': 'Notebook' }
  if (pages[path]) return `src/orbit/${pages[path]}.jsx`
  if (path.startsWith('/data') && !path.startsWith('/datasets')) return 'src/orbit/Explorer.jsx'
  return null
}

export function render(path) {
  // The server supplies the same route components eagerly; the browser keeps
  // lazy loading. Synchronous rendering emits completed Suspense boundaries
  // without streaming fallback/replacement instructions for the long pages.
  const body = renderToString(
    <HelmetProvider><StaticRouter location={path}><App pages={{ Explorer, Notebook, Research, ResearchArchive, CohortPage, Planet, Rings, Moons, Missions }} /></StaticRouter></HelmetProvider>,
  )
  // Helmet 3 uses native React metadata. Move document tags into the template
  // head while leaving SVG titles and JSON-LD in their original React tree.
  const metadata = /<title>[\s\S]*?<\/title>|<meta\b[^>]*\/?>|<link\b[^>]*\/?>/g
  return { head: (body.match(metadata) || []).join('\n'), body: body.replace(metadata, '') }
}
