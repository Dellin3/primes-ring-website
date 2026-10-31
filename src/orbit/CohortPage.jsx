import { Link, useParams } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { project } from '../content/project.js'
import { cohortPath, findCohort } from '../content/primesCohorts.js'
import { Outbound, SectionHero } from './SaturnPage.jsx'

// The shared page for a PRIMES cohort described only in primesCohorts.js.
// Cohorts with a custom story page (story: true) render that page instead.
export default function CohortPage({ cohort: provided }) {
  const { cohortSlug } = useParams()
  const cohort = provided || findCohort(cohortSlug)
  if (!cohort) return null
  return <article className="research-story saturn-page">
    <PageMeta title={`${cohort.program} ${cohort.year} — ${cohort.title}`} path={cohortPath(cohort)} description={`${cohort.program} ${cohort.year} Saturn rings project: ${cohort.question}`} structuredData={{
      '@context': 'https://schema.org', '@type': 'ResearchProject', name: cohort.title, url: `${project.publicSiteUrl}${cohortPath(cohort)}`,
      member: [...cohort.team.map(name => ({ '@type': 'Person', name })), { '@type': 'Person', name: cohort.mentor }],
    }} />
    <nav className="saturn-breadcrumb" aria-label="Breadcrumb"><Link to="/research">Research</Link><span aria-hidden="true">/</span><span>{cohort.year}</span></nav>
    <SectionHero eyebrow={`${cohort.program} ${cohort.year} · ${cohort.status}`} title={cohort.title} emphasis={cohort.team.join(' · ')} intro={cohort.summary} />
    <section className="saturn-chapter cohort-card" aria-labelledby="cohort-detail-title">
      <p className="cohort-year">{cohort.year}<small>Mentor: {cohort.mentor}</small></p>
      <div>
        <h2 id="cohort-detail-title" className="saturn-inline-heading">The question</h2>
        <p>{cohort.question}</p>
        <dl>
          <div><dt>Main work</dt><dd><ul>{cohort.focus.map(item => <li key={item}>{item}</li>)}</ul></dd></div>
          <div><dt>Data</dt><dd>{cohort.data}</dd></div>
          <div><dt>Results</dt><dd>{cohort.results.length ? <ul>{cohort.results.map(result => <li key={result.text}>{result.text}{result.source && <> — <Outbound href={result.source}>source</Outbound></>}</li>)}</ul> : <span className="cohort-pending">No verified results are published here yet.</span>}</dd></div>
          {cohort.materials.length > 0 && <div><dt>Materials</dt><dd><ul>{cohort.materials.map(item => <li key={item.url}><Outbound href={item.url}>{item.label}</Outbound></li>)}</ul></dd></div>}
        </dl>
      </div>
    </section>
  </article>
}
