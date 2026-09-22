import { Helmet } from 'react-helmet-async'
import { project } from '../../content/project.js'

export default function PageMeta({ title, description, path = '/' }) {
  const pageTitle = title ? `${title} | ${project.program}` : `${project.title} | ${project.program}`
  const canonicalUrl = `${project.publicSiteUrl}${path === '/' ? '/' : path}`
  const pageDescription = description || project.summary

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Saturn Rings Reconstruction" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
    </Helmet>
  )
}
