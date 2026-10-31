import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { project } from '../content/project.js'
import { cohortPath, primesCohorts } from '../content/primesCohorts.js'
import { Outbound, SectionHero } from './SaturnPage.jsx'

// Anchors from the single-page research story that used to live at /research.
const storyAnchors = ['research-question', 'research-method', 'research-results', 'research-team']

function CohortCard({ cohort }) {
  return <li className="cohort-card">
    <p className="cohort-year">{cohort.year}<small>{cohort.program} · {cohort.status}</small></p>
    <div>
      <h3>{cohort.title}</h3>
      <p>{cohort.question}</p>
      <dl>
        <div><dt>Team</dt><dd>{cohort.team.join(' · ')}</dd></div>
        <div><dt>Mentor</dt><dd>{cohort.mentor}</dd></div>
        <div><dt>Main work</dt><dd><ul>{cohort.focus.map(item => <li key={item}>{item}</li>)}</ul></dd></div>
        <div><dt>Data</dt><dd>{cohort.data}</dd></div>
      </dl>
      <Link className="research-return-link" to={cohortPath(cohort)}>Read the {cohort.year} research <span aria-hidden="true">→</span></Link>
    </div>
  </li>
}

export default function ResearchArchive() {
  const location = useLocation()
  const navigate = useNavigate()
  const ordered = [...primesCohorts].sort((a, b) => b.year - a.year)
  const latest = ordered[0]
  useEffect(() => {
    const anchor = location.hash.slice(1)
    if (storyAnchors.includes(anchor)) navigate(`${cohortPath(latest)}#${anchor}`, { replace: true })
  }, [location.hash, latest, navigate])
  return <article className="research-story saturn-page">
    <PageMeta title="Research — the MIT PRIMES Saturn rings project, year by year" path="/research" description="An archive of the MIT PRIMES Saturn rings project: each cohort’s question, methods, data, team and limits, starting with the 2026 working manuscript." structuredData={{
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'MIT PRIMES Saturn rings research', url: `${project.publicSiteUrl}/research`,
      hasPart: ordered.map(cohort => ({ '@type': 'ResearchProject', name: cohort.title, url: `${project.publicSiteUrl}${cohortPath(cohort)}`, member: cohort.team.map(name => ({ '@type': 'Person', name })) })),
    }} />
    <SectionHero eyebrow="Research" title="One project," emphasis="year by year." intro="The Saturn rings project at MIT PRIMES studies the mathematics of reading Cassini’s radio signals. Each cohort’s question, methods, data and limits are kept here, so the next team can start where the last one stopped." />

    <section className="saturn-chapter" aria-labelledby="cohorts-title">
      <header className="saturn-chapter-heading"><p className="eyebrow">Cohorts</p><h2 id="cohorts-title">{ordered.length === 1 ? 'The first cohort.' : `${ordered.length} cohorts so far.`}</h2></header>
      <ol className="cohort-list">{ordered.map(cohort => <CohortCard key={cohort.year} cohort={cohort} />)}</ol>
    </section>

    <section className="saturn-chapter" aria-labelledby="research-record-title">
      <div className="saturn-two-column">
        <div className="saturn-prose">
          <p className="eyebrow">What every year records</p>
          <h2 id="research-record-title" className="saturn-inline-heading">The same questions,<br /><em>every year.</em></h2>
          <p>Each cohort entry follows one template: the question, the main lines of work, the data used, results, materials and the people involved.</p>
          <p>A result is listed as a project result only when it can be traced to input data, generating code and output. Synthetic examples and teaching models are always labeled as such, and are never presented as Cassini measurements.</p>
        </div>
        <div className="saturn-panel">
          <p className="eyebrow">For researchers</p>
          <h3>Work with the same data.</h3>
          <p>The six archived Cassini radio profiles used by the project are available with provenance, hash-verified exact samples and CSV export.</p>
          <div className="saturn-next is-inline"><Link className="research-text-link" to="/datasets">Data, citation and limits <span aria-hidden="true">→</span></Link><Outbound href={project.repositoryUrl}>Website and conversion code</Outbound></div>
        </div>
      </div>
    </section>
  </article>
}
