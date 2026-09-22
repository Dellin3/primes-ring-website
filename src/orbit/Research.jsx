import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import ResearchMethod from './ResearchMethod.jsx'
import ResearchEvidence from './ResearchEvidence.jsx'
import ResearchMath from './ResearchMath.jsx'
import { project } from '../content/project.js'
import { getExample } from '../content/explorationExamples.js'
import { loadObservationCatalog, loadObservationSummary, overviewSamples } from '../lib/webObservation.js'
import './Research.css'

const sources = {
  panorama: 'https://www.jpl.nasa.gov/images/pia17172-the-day-the-earth-smiled/',
  closeup: 'https://www.jpl.nasa.gov/images/pia21060-moon-waves-and-moon-wakes/',
  occultation: 'https://www.jpl.nasa.gov/news/cassini-radio-signals-decipher-saturn-ring-structure/',
}

function Outbound({ href, children, className = '' }) {
  return <a className={`research-text-link ${className}`} href={href} target="_blank" rel="noreferrer">{children}<span aria-hidden="true">↗</span></a>
}

function ResearchObservation() {
  const [loaded, setLoaded] = useState(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    loadObservationCatalog().then(async catalog => {
      const observation = catalog.observations.find(item => item.dataset_id === catalog.featured_dataset_id)
      if (!observation) throw new Error('Featured observation unavailable')
      const { overview } = await loadObservationSummary(observation.base_path)
      if (active) { setLoaded({ observation, rows: overviewSamples(overview) }); setFailed(false) }
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [attempt])
  const plot = useMemo(() => {
    if (!loaded) return null
    const values = loaded.rows.map(row => row.optical_depth).filter(Number.isFinite)
    if (!values.length) return null
    const low = Math.min(0, ...values), high = Math.max(...values)
    const { minimum, maximum } = loaded.observation.radial_range
    let connected = false
    const d = loaded.rows.map(row => {
      if (!Number.isFinite(row.optical_depth) || !Number.isFinite(row.ring_radius_km)) { connected = false; return '' }
      const command = connected ? 'L' : 'M'; connected = true
      return `${command}${(60 + (row.ring_radius_km - minimum) / (maximum - minimum) * 690).toFixed(2)},${(160 - (row.optical_depth - low) / (high - low || 1) * 132).toFixed(2)}`
    }).join(' ')
    return { d, low, high, minimum, maximum }
  }, [loaded])
  const example = loaded && getExample(loaded.observation.dataset_id)
  const href = example ? `/data/${example.slug}?variable=optical_depth&from=${example.range[0]}&to=${example.range[1]}&version=${example.webProductVersion}` : '/data'
  return <div className="research-observation">
    <div className="research-observation-heading"><span>One archived observation</span><strong>Rev 133 · normal optical depth</strong></div>
    {plot ? <figure>
      <svg viewBox="0 0 790 214" role="img" aria-label="Reduced overview of archived Cassini Rev 133 normal optical depth versus ring radius. Open the data explorer to inspect exact samples.">
        {[plot.low, (plot.low + plot.high) / 2, plot.high].map((value, index) => <g key={index}><line x1="60" x2="750" y1={160 - index * 66} y2={160 - index * 66} className="research-observation-grid" /><text x="49" y={165 - index * 66} textAnchor="end">{value.toFixed(1)}</text></g>)}
        <path d={plot.d} fill="none" stroke="#a8ceef" strokeWidth="1.5" />
        <text x="60" y="19">Normal optical depth (dimensionless)</text>
        <text x="60" y="188">{Math.round(plot.minimum).toLocaleString('en-US')} km</text><text x="750" y="188" textAnchor="end">{Math.round(plot.maximum).toLocaleString('en-US')} km</text><text x="405" y="209" textAnchor="middle">Ring radius</text>
      </svg>
      <figcaption>This is an archived diffraction-limited profile. The overview reduces points for display; the Data explorer opens exact local samples.</figcaption>
    </figure> : <div className="research-observation-loading" role="status">{failed ? <><p>The observation could not be loaded.</p><button className="button button-secondary" type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1) }}>Try again</button></> : 'Loading the Cassini profile…'}</div>}
    <Link className="research-text-link" to={href}>Inspect this observation <span aria-hidden="true">→</span></Link>
  </div>
}

const contributions = [
  { name: 'Yutong Zhao', initials: 'YZ', focus: 'Finding starting points', description: 'Worked on Padé approximation and adaptive least-squares methods to locate candidate stationary roots.' },
  { name: 'Maiya Qiu', initials: 'MQ', focus: 'Following the branches', description: 'Developed least-squares and pseudo-arclength continuation. Wrote the introduction and background, and compiled and edited the report.' },
  { name: 'Dell Li', initials: 'DL', focus: 'Identity, folds & reliability', description: 'Primarily wrote the sections on stationary-branch bookkeeping, generic-fold verification, and the reliability of the stationary-phase approximation.' },
]

export default function Research() {
  const [showObservation, setShowObservation] = useState(false)
  return <article className="research-page research-story">
    <PageMeta title="Project research — Following a signal from Saturn" path="/research" description="Follow our PRIMES team's research: from Cassini radio signals to stationary roots, branch tracking, and a local test of a more reliable calculation." />
    <header className="research-story-hero">
      <p className="eyebrow">Project research <span aria-hidden="true">/</span> MIT PRIMES 2026</p>
      <div className="research-story-hero-copy"><h1>A signal from Saturn.<br /><em>A closer look at its rings.</em></h1><p>Cassini sent radio waves through Saturn’s rings. Our team studies the mathematics that could help recover finer detail from the signals that reached Earth.</p></div>
      <figure className="research-panorama">
        <a href={sources.panorama} target="_blank" rel="noreferrer" aria-label="View The Day the Earth Smiled and its full image at NASA JPL (opens in a new tab)"><img src="/images/research/cassini-saturn-shadow.webp" width="2400" height="933" fetchPriority="high" alt="Saturn in silhouette, its luminous rings surrounded by a faint blue halo in a real Cassini mosaic." /><span className="research-image-open">See the original image <span aria-hidden="true">↗</span></span></a>
        <figcaption><span>From Saturn’s shadow · Cassini, July 19, 2013</span><span>NASA/JPL-Caltech/SSI</span></figcaption>
      </figure>
      <nav className="research-story-index" aria-label="Chapters in the research story"><a href="#research-question"><span>01</span>The question</a><a href="#research-method"><span>02</span>The method</a><a href="#research-results"><span>03</span>The evidence</a><a href="#research-team"><span>04</span>The team</a></nav>
    </header>

    <section className="research-question" id="research-question" aria-labelledby="research-question-title">
      <div className="research-origin-copy"><p className="eyebrow">01 / Where the question begins</p><h2 id="research-question-title">The rings leave a trace.<br /><em>How do we read it?</em></h2><p>As a radio signal passes through the rings, its strength and phase change. Those changes carry information about the material it crossed.</p><p>Recovering fine structure also means accounting for diffraction: waves travelling along nearby paths interfere. Our project begins with the calculation that connects this signal to the rings.</p><Outbound href={sources.occultation}>How Cassini used radio signals</Outbound></div>
      <figure className="research-closeup"><a href={sources.closeup} target="_blank" rel="noreferrer" aria-label="View the full Moon Waves and Moon Wakes image at NASA JPL (opens in a new tab)"><img src="/images/research/cassini-ring-waves.webp" width="1020" height="1020" loading="lazy" alt="Cassini close-up of Saturn’s A ring, showing a density wave beside closely spaced diagonal moon wakes." /><span className="research-image-open">Look closer <span aria-hidden="true">↗</span></span></a><figcaption><strong>Structure worth resolving.</strong><span>Cassini camera view of a density wave and moon wakes in the A ring. December 18, 2016; approximately 340 m per image pixel.</span><small>NASA/JPL-Caltech/Space Science Institute · camera context</small></figcaption></figure>
      <details className="research-story-detail research-signal-detail" onToggle={event => setShowObservation(event.currentTarget.open)}><summary><span><strong>What does the radio observation look like?</strong><span>Open a real Cassini profile and follow it into the Data explorer.</span></span><span className="research-detail-plus" aria-hidden="true">+</span></summary><div className="research-story-detail-body"><p>Our explorer contains six calibrated ring profiles from the NASA Planetary Data System. They retain diffraction effects and provide a starting point for reconstruction.</p>{showObservation && <ResearchObservation />}<div className="research-reading-links"><Link className="research-text-link" to="/data">All six observations <span aria-hidden="true">→</span></Link><Outbound href={project.dataSourceUrl}>Original PDS archive</Outbound></div></div></details>
    </section>

    <section className="research-problem glass-panel" aria-labelledby="research-problem-title"><div><p className="eyebrow">The mathematical question</p><h2 id="research-problem-title">One root can hide<br /><em>another branch.</em></h2><p>A stationary-phase calculation focuses on angles where the phase stops changing. One starting guess can find one such angle and miss others. Near a fold, two branches approach each other and turn.</p></div><div className="research-problem-equation"><ResearchMath display>{String.raw`\frac{\partial\psi}{\partial\varphi}(\rho,\varphi_s)=0`}</ResearchMath><p>A stationary angle <ResearchMath>{String.raw`\varphi_s`}</ResearchMath> is a root of the phase derivative at ring radius <ResearchMath>{String.raw`\rho`}</ResearchMath>.</p><p className="research-problem-question">How do we find the relevant branches, keep their identities, and decide when the approximation needs more care?</p></div></section>

    <ResearchMethod />
    <ResearchEvidence />

    <section className="research-team" id="research-team" aria-labelledby="research-team-title"><header><p className="eyebrow">04 / The people behind the work</p><h2 id="research-team-title">Different pieces.<br /><em>One shared problem.</em></h2><p>The project brings together root finding, continuation, and reliability checks. Each part gives the next one something it can use.</p></header><div className="research-contributors">{contributions.map(person => <article className="research-contributor" key={person.name}><span className="research-person-mark" aria-hidden="true">{person.initials}</span><div><p className="research-person-focus">{person.focus}</p><h3>{person.name}</h3><p>{person.description}</p></div></article>)}</div><div className="research-mentor-row"><span>Project mentor</span><div><strong>Dr. Ryan Maguire</strong><p>Proposed the project and guided its development.</p></div></div><p className="research-team-source">Contributions follow the acknowledgments in the team’s working manuscript.</p></section>

    <footer className="research-story-end"><div><p className="eyebrow">Where this leads</p><h2>A step toward<br /><em>finer ring structure.</em></h2><p>The tests connect finding roots, following their identities, and choosing a more reliable local calculation. They establish numerical building blocks toward reconstruction.</p><p className="research-scope">The six profiles in the Data explorer are archived observations. The reported method tests use synthetic branches and a stated scalar geometry drawn from a Rev 133 working draft; they do not establish a new high-resolution optical-depth profile.</p><Link className="research-return-link" to="/data">Continue with the Cassini data <span aria-hidden="true">→</span></Link></div><aside className="research-source-card"><p className="eyebrow">The source behind the story</p><cite>{project.title}</cite><p>Dell Li · Maiya Qiu · Yutong Zhao<br />MIT PRIMES 2026 · working manuscript</p><p>Methods: §3. Branch identity, fold checks and local integration: §§4–6. Numerical results are transcribed from the manuscript; the full paper and scientific solver are not hosted here.</p><details><summary>Images, references & further reading</summary><div className="research-source-links"><Outbound href={sources.panorama}>The Day the Earth Smiled · NASA/JPL</Outbound><p>Natural-color mosaic. Faint objects and outer rings were brightened in the original NASA image.</p><Outbound href={sources.closeup}>Moon Waves and Moon Wakes · NASA/JPL</Outbound><Outbound href={sources.occultation}>Cassini’s radio-occultation observations</Outbound><Outbound href={project.dataSourceUrl}>NASA PDS · original radio-science data</Outbound><Outbound href={project.repositoryUrl}>Website source code</Outbound></div></details></aside></footer>
  </article>
}
