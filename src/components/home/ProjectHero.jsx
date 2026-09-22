import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { project, siteRoutes } from '../../content/project.js'
import HeroVisual from './HeroVisual.jsx'
import ContinueExploration from './ContinueExploration.jsx'

const ScientificHeroScene = lazy(() => import('./ScientificHeroScene.jsx'))

export default function ProjectHero() {
  const [animateIllustration, setAnimateIllustration] = useState(false)

  return (
    <section className="project-hero" aria-labelledby="project-title">
      <div className="hero-light-field" aria-hidden="true" />
      <div className="project-hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">{project.eyebrow}</p>
          <h1 id="project-title">Explore Saturn’s rings through Cassini data.</h1>
          <p className="hero-summary">{project.visitorSummary}</p>
          <div className="hero-actions">
            <Link className="button button-primary" to={siteRoutes.guided}>Start a guided exploration</Link>
            <Link className="text-link" to={siteRoutes.research}>Read the research →</Link>
          </div>
          <p className="hero-start-note">Start with the example observation. No account required.</p>
          <ContinueExploration />
        </div>
        <div className={`hero-illustration${animateIllustration ? ' is-animated' : ''}`}>
          {animateIllustration ? (
            <Suspense fallback={<HeroVisual />}>
              <ScientificHeroScene />
            </Suspense>
          ) : <HeroVisual />}
          <button
            type="button"
            className="hero-illustration-toggle"
            aria-pressed={animateIllustration}
            onClick={() => setAnimateIllustration((current) => !current)}
          >
            {animateIllustration ? 'Show static illustration' : 'Animate illustration'}
          </button>
        </div>
      </div>
    </section>
  )
}
