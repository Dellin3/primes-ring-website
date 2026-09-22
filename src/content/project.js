export const siteRoutes = {
  home: '/',
  research: '/research',
  data: '/data',
  resources: '/resources',
  explorations: '/explorations',
  guided: '/data?guide=1',
}

export const project = {
  program: 'MIT PRIMES 2026',
  eyebrow: 'MIT PRIMES 2026 · MATHEMATICS RESEARCH',
  title: 'New Methods toward High-Resolution Reconstruction of Saturn’s Rings',
  authors: ['Dell Li', 'Maiya Qiu', 'Yutong Zhao'],
  mentor: 'Dr. Ryan Maguire',
  paperStatus: 'Working manuscript — methods and reported results summarized on this site',
  paperUrl: '',
  scientificCodeUrl: '',
  scientificCodeVersion: '',
  researchResults: [],
  repositoryUrl: 'https://github.com/Dellin3/primes-ring-website',
  publicSiteUrl: 'https://primes-ring-website-p9yv.vercel.app',
  learningUrl: 'https://student-research-lab-theta.vercel.app/',
  dataSourceUrl: 'https://pds-rings.seti.org/cassini/rss/',
  visitorSummary: 'Inspect a ring profile, zoom into a region, and save an observation you can return to.',
  summary:
    'This project studies numerical methods for interpreting Cassini radio-occultation data and improving the mathematical pipeline toward higher-resolution reconstruction of Saturn’s rings.',
}

export const teamLine = project.authors.join(' · ')
