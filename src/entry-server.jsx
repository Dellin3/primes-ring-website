import { renderToString } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { project } from './content/project.js'
import Explorer from './orbit/Explorer.jsx'
import Notebook from './orbit/Notebook.jsx'
import Research from './orbit/Research.jsx'

export const siteOrigin = project.publicSiteUrl

export function render(path) {
  // The server supplies the same route components eagerly; the browser keeps
  // lazy loading. Synchronous rendering emits completed Suspense boundaries
  // without streaming fallback/replacement instructions for the long research page.
  const body = renderToString(
    <HelmetProvider><StaticRouter location={path}><App pages={{ Explorer, Notebook, Research }} /></StaticRouter></HelmetProvider>,
  )
  // Helmet 3 uses native React metadata. Move document tags into the template
  // head while leaving SVG titles and JSON-LD in their original React tree.
  const metadata = /<title>[\s\S]*?<\/title>|<meta\b[^>]*\/?>|<link\b[^>]*\/?>/g
  return { head: (body.match(metadata) || []).join('\n'), body: body.replace(metadata, '') }
}
