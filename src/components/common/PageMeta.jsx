import { Helmet } from 'react-helmet-async'
import { project } from '../../content/project.js'

export default function PageMeta({ title, description, path = '/', noindex = false, structuredData }) {
  const exclude = noindex
  const pageTitle = title ? `${title} | ${project.program}` : `${project.title} | ${project.program}`
  const canonicalUrl = `${project.publicSiteUrl}${path === '/' ? '/' : path}`
  const pageDescription = description || project.summary
  const schema = structuredData || {
    '@context': 'https://schema.org',
    '@type': path === '/' ? 'WebSite' : 'WebPage',
    name: title || project.title,
    url: canonicalUrl,
    description: pageDescription,
  }

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={exclude ? 'noindex, follow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Saturn — A Cassini Explorer" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${project.publicSiteUrl}/images/saturn-observatory.webp`} />
      <meta property="og:image:alt" content="Artistic rendering of Saturn and its rings" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${project.publicSiteUrl}/images/saturn-observatory.webp`} />
      {!exclude && <script type="application/ld+json">{JSON.stringify(schema).replace(/</g, '\\u003c')}</script>}
    </Helmet>
  )
}
