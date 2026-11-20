import { Helmet } from 'react-helmet-async'
import { site } from '../../content/site.js'

export default function PageMeta({ title, description, path = '/', noindex = false, structuredData }) {
  const exclude = noindex
  const pageTitle = title && title !== site.name ? `${title} | ${site.name}` : site.name
  const canonicalUrl = `${site.publicSiteUrl}${path === '/' ? '/' : path}`
  const pageDescription = description || site.summary
  const schema = structuredData || {
    '@context': 'https://schema.org',
    '@type': path === '/' ? 'WebSite' : 'WebPage',
    name: path === '/' ? site.name : title || site.name,
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
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${site.publicSiteUrl}/images/saturn-observatory.webp`} />
      <meta property="og:image:alt" content="Artistic rendering of Saturn and its rings" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${site.publicSiteUrl}/images/saturn-observatory.webp`} />
      {!exclude && <script type="application/ld+json">{JSON.stringify(schema).replace(/</g, '\\u003c')}</script>}
    </Helmet>
  )
}
