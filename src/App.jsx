import { useMemo, useState } from 'react'
import './App.css'

const navItems = [
  { label: 'Overview', href: '#top' },
  { label: 'Background', href: '#background' },
  { label: 'Math', href: '#math' },
  { label: 'Team Algorithms', href: '#pipeline' },
  { label: 'Visual Gallery', href: '#figures' },
  { label: 'Interactive Tool', href: '#tool' },
  { label: 'Progress', href: '#contribution' },
]

const pipelineSteps = [
  {
    title: 'Occultation data',
    text: 'Start with a radio signal measurement or schematic example tied to ring radius.',
    does: 'Collects the radius-indexed signal information used for later inspection.',
    matters: 'The rest of the workflow depends on knowing what quantity is being compared and where it lives radially.',
    io: 'Input: occultation measurement or toy signal. Output: radius-aligned signal values.',
  },
  {
    title: 'Preprocessing',
    text: 'Clean, align, and normalize the signal before asking mathematical questions.',
    does: 'Organizes columns, units, and simple scaling so plots and diagnostics are comparable.',
    matters: 'Small inconsistencies can look like structure if the signal is not prepared carefully.',
    io: 'Input: raw or schematic signal table. Output: cleaned radius and signal arrays.',
  },
  {
    title: 'Local radial window selection',
    text: 'Choose a focused interval of radius for close inspection.',
    does: 'Restricts plots and diagnostics to a small radial window selected by the user.',
    matters: 'Local windows make it easier to inspect fine structure without claiming a global reconstruction.',
    io: 'Input: cleaned signal. Output: selected radius window and local subset.',
  },
  {
    title: 'Stationary phase analysis',
    text: 'Study where phase derivatives suggest stationary contributions may occur.',
    does: 'Computes or visualizes derivative-like quantities and marks candidate roots of ψ′.',
    matters: 'Stationary points are where oscillatory cancellation can weaken, so they guide interpretation.',
    io: 'Input: local window and phase model. Output: candidate stationary points and curvature notes.',
  },
  {
    title: 'Bifurcation diagnostics',
    text: 'Track where roots appear, merge, disappear, or switch branches.',
    does: 'Checks root counts, branch continuity, and changes in local curvature across nearby parameters.',
    matters: 'Bifurcation-like behavior can make a simple stationary-phase approximation unreliable.',
    io: 'Input: stationary point candidates over a parameter range. Output: branch and bifurcation flags.',
  },
  {
    title: 'Reconstruction / visualization output',
    text: 'Turn the inspected window and diagnostics into clear figures for discussion.',
    does: 'Creates schematic or public-data visualizations with captions and exportable local views.',
    matters: 'The goal is a careful research-support display, not an overclaimed final ring result.',
    io: 'Input: selected data, diagnostics, and notes. Output: plots, captions, and exportable windows.',
  },
]

const mathConcepts = [
  {
    kicker: 'Oscillatory integral',
    title: 'Many waves added together',
    symbol: (
      <>
        <span>∫ A(r)e</span>
        <sup>iψ(r)</sup>
        <span>&nbsp;dr</span>
      </>
    ),
    text: 'The measured signal can be modeled as many phase-shifted contributions that may cancel or reinforce.',
  },
  {
    kicker: 'Phase function ψ',
    title: 'The wave clock',
    symbol: 'ψ(r)',
    text: 'The phase records how quickly the signal oscillates as radius changes.',
  },
  {
    kicker: 'Stationary point ψ′ = 0',
    title: 'Where cancellation slows',
    symbol: 'ψ′(r) = 0',
    text: 'Near a stationary point, nearby waves line up more strongly and can dominate the integral.',
  },
  {
    kicker: 'Second derivative ψ″',
    title: 'Curvature near the root',
    symbol: 'ψ″(r)',
    text: 'The second derivative measures local bending and helps estimate how sharp the stationary contribution is.',
  },
  {
    kicker: 'Bifurcation / branches',
    title: 'Roots can split or merge',
    symbol: 'root tracks',
    text: 'Branch bookkeeping keeps stationary points matched correctly as parameters or radius windows change.',
  },
]

const contributions = [
  'Building visualization tools for schematic signals, phase behavior, and candidate diagnostics.',
  'Developing local radial-window inspection so small regions can be studied without claiming a full reconstruction.',
  'Preparing future stationary-phase and bifurcation diagnostics, including root tracking and curvature checks.',
]

const featuredReferenceImage = {
  title: 'Saturn’s Ring Structure Reference',
  image: '/images/saturn-rings-labeled.jpg',
  caption: 'A labeled view of Saturn’s major rings, divisions, and ring features.',
  credit: 'Image credit: NASA/JPL-Caltech/Space Science Institute.',
}

const galleryImages = [
  {
    title: 'Cassini Radio Occultation',
    image: '/images/cassini-occultation.jpg',
    caption:
      'Cassini radio signals passing through Saturn’s rings provide information about ring material, signal attenuation, and optical depth.',
    credit: 'Image credit: NASA/JPL-Caltech.',
  },
  {
    title: 'Cassini Division',
    image: '/images/cassini-division.jpg',
    caption:
      'A close view of the Cassini Division, one of the most recognizable large-scale structures in Saturn’s ring system.',
    credit: 'Image credit: NASA/JPL/Space Science Institute.',
  },
  {
    title: 'Fine Ring Structure',
    image: '/images/ring-detail.jpg',
    caption:
      'High-resolution ring texture showing narrow radial structure that motivates local-window analysis.',
    credit: 'Image credit: NASA/JPL-Caltech/Space Science Institute.',
  },
  {
    title: 'Rings and Waves',
    image: '/images/rings-and-waves.jpg',
    caption:
      'Wave-like features in Saturn’s rings provide visual intuition for radial structure and signal-based reconstruction.',
    credit: 'Image credit: NASA/JPL-Caltech/Space Science Institute.',
  },
  {
    title: 'The Great Divide',
    image: '/images/great-divide.jpg',
    caption:
      'A broad division in Saturn’s rings that helps illustrate large-scale radial gaps and ring-region boundaries.',
    credit: 'Image credit: NASA/JPL-Caltech/Space Science Institute.',
  },
  {
    title: 'Small Particles in Saturn’s Rings',
    image: '/images/small-particles.jpg',
    caption:
      'A radio-occultation-based view highlighting how ring material and particle distributions affect the observed signal.',
    credit: 'Image credit: NASA/JPL-Caltech.',
  },
]

const plannedToolFeatures = [
  'CSV upload',
  'Radius vs optical depth interactive plot',
  'Local radial window selection',
  'Derivative diagnostics',
  'Export selected window as CSV',
  'Future stationary-phase diagnostics',
]

function NavBar() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Go to top">
        <span className="brand-mark">SR</span>
        <span>
          <strong>Saturn Rings</strong>
          <small>MIT PRIMES Math Junior</small>
        </span>
      </a>
      <nav aria-label="Main navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

function RingDiagram() {
  return (
    <div className="visual-card hero-visual" aria-label="Abstract Saturn ring reconstruction diagram">
      <svg viewBox="0 0 520 360" role="img">
        <title>Abstract radio occultation and ring reconstruction diagram</title>
        <defs>
          <linearGradient id="ringGlow" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f7d58a" />
            <stop offset="55%" stopColor="#8eb6ff" />
            <stop offset="100%" stopColor="#9b7cff" />
          </linearGradient>
        </defs>
        <rect className="grid" x="26" y="28" width="468" height="304" rx="24" />
        <ellipse className="ring ring-wide" cx="260" cy="186" rx="185" ry="64" />
        <ellipse className="ring ring-mid" cx="260" cy="186" rx="145" ry="48" />
        <ellipse className="ring ring-thin" cx="260" cy="186" rx="103" ry="33" />
        <circle className="planet" cx="260" cy="184" r="42" />
        <path className="signal signal-one" d="M76 70 C170 96 170 242 258 278 S380 245 446 295" />
        <path className="signal signal-two" d="M72 286 C168 248 172 100 258 82 S386 112 456 65" />
        <line className="beam" x1="70" y1="182" x2="450" y2="182" />
        <circle className="node" cx="178" cy="126" r="5" />
        <circle className="node" cx="342" cy="240" r="5" />
        <circle className="spacecraft" cx="454" cy="182" r="9" />
      </svg>
      <div className="visual-caption">
        Placeholder visualization: radio signal paths, ring profiles, and stationary regions.
      </div>
    </div>
  )
}

function Section({ id, eyebrow, title, children, className = '' }) {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function StationaryPhaseDemo() {
  const [parameter, setParameter] = useState(0.45)
  const roots = useMemo(() => {
    if (parameter > 0.02) {
      const sideRoot = Math.sqrt(parameter)
      return [-sideRoot, 0, sideRoot]
    }

    return [0]
  }, [parameter])

  const points = useMemo(() => {
    const samples = 120
    return Array.from({ length: samples + 1 }, (_, index) => {
      const phi = -1.35 + (2.7 * index) / samples
      const value = phi ** 3 - parameter * phi
      const x = 32 + ((phi + 1.35) / 2.7) * 376
      const y = 140 - ((value + 1.55) / 3.1) * 110
      return `${x.toFixed(2)},${y.toFixed(2)}`
    }).join(' ')
  }, [parameter])

  return (
    <Section
      id="stationary-demo"
      eyebrow="03 / Toy Demo"
      title="Stationary Points in a Simple Phase Model"
      className="demo-section"
    >
      <div className="demo-panel">
        <div className="demo-controls">
          <div>
            <span className="card-kicker">Parameter p</span>
            <h3>Toy derivative curve</h3>
            <p>
              Stationary points occur where ψ′ = 0. As the parameter changes, roots can
              appear, merge, or disappear, giving intuition for bifurcation-like behavior.
            </p>
          </div>
          <label className="slider-label">
            <span>p = {parameter.toFixed(2)}</span>
            <input
              type="range"
              min="-0.45"
              max="1.15"
              step="0.01"
              value={parameter}
              onChange={(event) => setParameter(Number(event.target.value))}
            />
          </label>
          <div className="root-count">
            <strong>{roots.length}</strong>
            <span>stationary point{roots.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="demo-plot" aria-label="Toy derivative curve with stationary points">
          <svg viewBox="0 0 440 180" role="img">
            <title>Toy derivative-like curve for stationary phase intuition</title>
            <path className="axis" d="M32 140 H408 M220 24 V158" />
            <path className="zero-line" d="M32 140 H408" />
            <polyline className="curve primary" points={points} />
            {roots.map((root) => {
              const x = 32 + ((root + 1.35) / 2.7) * 376
              return <circle className="plot-point root" cx={x} cy="140" r="6" key={root} />
            })}
          </svg>
          <div className="demo-equation">ψ′(φ; p) = φ³ - pφ</div>
        </div>
      </div>
    </Section>
  )
}

function App() {
  const [selectedPipelineIndex, setSelectedPipelineIndex] = useState(0)
  const selectedPipelineStep = pipelineSteps[selectedPipelineIndex]

  return (
    <div className="app-shell" id="top">
      <NavBar />

      <main>
        <section className="hero section">
          <div className="hero-copy">
            <p className="eyebrow">Research Portfolio</p>
            <h1>Mathematics of Saturn Ring Occultations</h1>
            <p className="hero-lede">
              An MIT PRIMES Math Junior research portfolio on how radio signals,
              oscillatory integrals, and local diagnostics can support careful study of
              Saturn's rings.
            </p>
            <div className="hero-actions" aria-label="Page shortcuts">
              <a className="button primary" href="#pipeline">
                View Research Thread
              </a>
              <a className="button secondary" href="#figures">
                See Schematics
              </a>
            </div>
            <div className="status-strip">
              <span>Local diagnostics</span>
              <span>No unpublished data shown</span>
            </div>
          </div>
          <RingDiagram />
        </section>

        <Section id="background" eyebrow="01 / Background" title="Radio Occultation as a Window into Rings">
          <div className="two-column">
            <p>
              In a radio occultation, a spacecraft sends a steady radio signal toward
              Earth while its line of sight passes behind or through a planetary ring
              system. Ring material weakens and shifts the signal before it reaches the
              receiver, so the measurement carries information about optical depth and
              fine radial structure.
            </p>
            <p>
              The mathematical challenge is that the observation is not a direct
              photograph of the rings. It is a transformed wave measurement, so geometry,
              diffraction, phase, and numerical reconstruction all matter. This site
              describes the framework I am studying and uses only schematic placeholder
              visuals, not unpublished PRIMES results.
            </p>
          </div>
        </Section>

        <Section id="math" eyebrow="02 / Mathematical Idea" title="Stationary Phase and Caustic Regions">
          <div className="math-grid">
            {mathConcepts.map((concept) => (
              <article className="feature-card" key={concept.kicker}>
                <span className="card-kicker">{concept.kicker}</span>
                <div className="concept-symbol">{concept.symbol}</div>
                <h3>{concept.title}</h3>
                <p>{concept.text}</p>
              </article>
            ))}
          </div>
        </Section>

        <StationaryPhaseDemo />

        <Section id="pipeline" eyebrow="04 / Reconstruction Pipeline" title="From Signal Geometry to Diagnostics">
          <div className="pipeline">
            {pipelineSteps.map((step, index) => (
              <button
                className={`pipeline-step${index === selectedPipelineIndex ? ' active' : ''}`}
                type="button"
                key={step.title}
                onClick={() => setSelectedPipelineIndex(index)}
              >
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </button>
            ))}
          </div>
          <div className="pipeline-detail">
            <span className="card-kicker">Selected step</span>
            <h3>{selectedPipelineStep.title}</h3>
            <div className="detail-grid">
              <p>
                <strong>What it does:</strong> {selectedPipelineStep.does}
              </p>
              <p>
                <strong>Why it matters:</strong> {selectedPipelineStep.matters}
              </p>
              <p>
                <strong>Input / output:</strong> {selectedPipelineStep.io}
              </p>
            </div>
          </div>
        </Section>

        <Section id="contribution" eyebrow="05 / My Contribution" title="Current Focus and Research Role">
          <div className="contribution-panel">
            <div>
              <h3>Building mathematical intuition into computational tests</h3>
              <p>
                My current role is to make the analysis easier to see and inspect. I am
                focusing on visualization, local windows in radius, and diagnostic tools
                that can later support more formal stationary-phase and bifurcation work.
              </p>
            </div>
            <ul>
              {contributions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="figures" eyebrow="06 / Visual Gallery" title="Visual Gallery / Mission Context">
          <p className="gallery-intro">
            Public mission imagery provides context for the ring structures and
            occultation geometry behind this project. These images are used for
            background and communication, not as unpublished PRIMES data.
          </p>
          <article className="featured-reference">
            <div className="featured-reference-image">
              <img src={featuredReferenceImage.image} alt={featuredReferenceImage.title} />
            </div>
            <div className="featured-reference-body">
              <div>
                <h3>{featuredReferenceImage.title}</h3>
                <p>{featuredReferenceImage.caption}</p>
                <small>{featuredReferenceImage.credit}</small>
              </div>
              <a href={featuredReferenceImage.image} target="_blank" rel="noreferrer">
                Open full-resolution image
              </a>
            </div>
          </article>
          <div className="gallery-grid">
            {galleryImages.map((image) => (
              <article className="gallery-card" key={image.title}>
                <div className="gallery-image-frame">
                  <img src={image.image} alt={image.title} loading="lazy" />
                </div>
                <div className="gallery-card-body">
                  <h3>{image.title}</h3>
                  <p>{image.caption}</p>
                  <small>{image.credit}</small>
                  <a className="gallery-open-link" href={image.image} target="_blank" rel="noreferrer">
                    Open image
                  </a>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="tool" eyebrow="07 / Future Interactive Tool" title="Toward a Cassini and Ring Data Explorer">
          <div className="tool-preview">
            <div className="mock-window">
              <div className="window-bar">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="window-content">
                <div className="sidebar-lines"></div>
                <div className="map-orbit"></div>
                <div className="data-bars">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            <div>
              <span className="coming-soon">Coming soon</span>
              <h3>Planned Cassini/ring data visualizer</h3>
              <p>
                This planned research-support tool will help inspect public or simulated
                ring profiles without displaying unpublished PRIMES data or claiming final
                reconstruction results.
              </p>
              <ul className="tool-feature-list">
                {plannedToolFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </main>

      <footer className="site-footer">
        <p>
          Research portfolio for an MIT PRIMES Math Junior project. Visuals are schematic
          placeholders and do not display unpublished data.
        </p>
      </footer>
    </div>
  )
}

export default App
