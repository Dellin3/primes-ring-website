import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { explorationHref, readExplorations } from '../lib/explorations.js'
import { defaultExampleDatasetId, getExample } from '../content/explorationExamples.js'
import { activityHref, labActivities } from '../content/labActivities.js'
import { moonCount } from '../content/saturn.js'
import { useRevealOnScroll } from '../lib/motion.js'
import SignalScene from './home/SignalScene.jsx'
import ObservationPreview from './home/ObservationPreview.jsx'
import InsideResearch from './home/InsideResearch.jsx'
import ContinueExploring from './home/ContinueExploring.jsx'
import './home/home.css'

function Arrow({ down = false }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">{down ? <path d="M12 4v15m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}</svg> }

const featuredExample = getExample(defaultExampleDatasetId)
const featuredExplorerHref = featuredExample ? `/data/${featuredExample.slug}?variable=${featuredExample.variableId}&from=${featuredExample.range[0]}&to=${featuredExample.range[1]}&version=${featuredExample.webProductVersion}` : '/data'

export default function Home() {
  const pageRef = useRef(null)
  const [last, setLast] = useState(null)
  useRevealOnScroll(pageRef)
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      const store = readExplorations()
      if (active) setLast([...store.records, ...Object.values(store.drafts)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null)
    })
    return () => { active = false }
  }, [])
  return <div className="home-page" ref={pageRef}><PageMeta title="Saturn — A Cassini Explorer" description="Explore Saturn — the planet, its rings, its moons and the missions that studied it — follow a Cassini radio signal through the rings in 3D, and read six real Cassini observations yourself." />
    <section className="home-hero" aria-labelledby="home-title"><div className="hero-copy">
      <p className="mission-tag hero-enter" style={{ '--enter-delay': '0ms' }}><span />MIT PRIMES <span className="tag-divider">/</span> 2026</p>
      <h1 id="home-title" className="hero-enter" style={{ '--enter-delay': '70ms' }}><span className="hero-line">Every ring,</span> <span className="hero-line">every moon.</span> <em className="hero-line">A new question.</em></h1>
      <p className="hero-description hero-enter" style={{ '--enter-delay': '150ms' }}>Cassini sent radio signals through Saturn’s rings to Earth. Read six of them yourself — and see how our MIT PRIMES team works on the mathematics behind them.</p>
      <div className="hero-actions hero-enter" style={{ '--enter-delay': '230ms' }}>
        <Link to={featuredExplorerHref} className="hero-action is-primary"><span>Open the explorer</span><Arrow /></Link>
        <a href="#follow-the-signal" className="hero-action is-secondary"><span>Follow the signal</span><Arrow down /></a>
        <Link to={activityHref(labActivities['encke-width'])} className="hero-link">Guided measurement <span aria-hidden="true">→</span></Link>
      </div>
      <p className="hero-question hero-enter" style={{ '--enter-delay': '310ms' }}><span>The question</span> Radio waves spread as they cross the rings, so the finest structure reaches Earth blurred. Can mathematics help recover it — and tell when the usual shortcut needs more care? <Link to="/research/2026">Read the research →</Link></p>
      {last && <p className="hero-continue"><Link to={explorationHref(last)}>Continue where you left off: {last.title} →</Link></p>}
      <div className="hero-facts hero-enter" style={{ '--enter-delay': '390ms' }}><div><strong>{moonCount.value}</strong><span>Confirmed moons</span></div><div><strong>29.4 yr</strong><span>One orbit of the Sun</span></div><div><strong>06</strong><span>Cassini ring observations</span></div></div>
    </div><div className="planet-caption" aria-hidden="true"><span>SATURN</span><span>PLANET · RINGS · MOONS</span></div></section>
    <SignalScene />
    <ObservationPreview />
    <InsideResearch />
    <ContinueExploring />
  </div>
}
