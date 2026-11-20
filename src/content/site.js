// Site identity, used for page titles, canonical URLs and shared links.
export const site = {
  name: 'Saturn Ring Lab',
  tagline: 'A Cassini explorer',
  publicSiteUrl: (import.meta.env?.VITE_PUBLIC_SITE_URL || import.meta.env?.VITE_SITE_URL || 'https://saturnringlab.com').replace(/\/+$/, ''),
  dataSourceUrl: 'https://pds-rings.seti.org/cassini/rss/',
  repositoryUrl: 'https://github.com/Dellin3/primes-ring-website',
  learningUrl: 'https://researchstarterlab.com/',
  summary: 'Saturn Ring Lab: a sourced guide to Saturn — the planet, its rings, its moons and the missions that studied it — with six real Cassini radio observations of the rings to explore, measure and download.',
}
