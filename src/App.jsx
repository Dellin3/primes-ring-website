import './App.css'

const navItems = [
  { label: 'Background', href: '#background' },
  { label: 'Math', href: '#math' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Contribution', href: '#contribution' },
  { label: 'Preview', href: '#figures' },
  { label: 'Tool', href: '#tool' },
]

const pipelineSteps = [
  {
    title: 'Model the signal',
    text: 'Represent occultation measurements as oscillatory integrals shaped by ring opacity, geometry, and phase.',
  },
  {
    title: 'Locate stationary structure',
    text: 'Track where psi prime approaches zero and identify regimes where stationary phase dominates the response.',
  },
  {
    title: 'Flag caustic behavior',
    text: 'Use numerical diagnostics to distinguish regular roots from bifurcation regions that need special care.',
  },
  {
    title: 'Compare reconstructions',
    text: 'Evaluate candidate reconstructions qualitatively and numerically without relying on unpublished data.',
  },
]

const contributions = [
  'Studying the mathematical relationship between phase geometry and reconstructed ring features.',
  'Building numerical experiments that expose stationary roots, bifurcations, and sensitivity near caustics.',
  'Designing a clear research narrative for future visual demonstrations and reproducible simulations.',
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

function MiniPlot({ type }) {
  return (
    <div className={`mini-plot ${type}`}>
      <svg viewBox="0 0 320 160" role="img">
        <title>{type === 'phase' ? 'Phase diagnostic placeholder' : 'Reconstruction preview placeholder'}</title>
        <path className="axis" d="M28 132 H292 M48 20 V142" />
        <path
          className="curve primary"
          d={
            type === 'phase'
              ? 'M36 94 C66 32 94 38 118 92 S170 150 198 83 S248 15 286 63'
              : 'M36 110 C68 104 80 64 108 70 S148 124 174 96 S214 42 246 61 S272 108 288 84'
          }
        />
        <path
          className="curve secondary"
          d={
            type === 'phase'
              ? 'M36 78 C86 84 112 82 142 78 S204 72 286 79'
              : 'M36 120 C82 116 106 96 134 101 S178 132 204 112 S250 82 288 91'
          }
        />
        <circle className="plot-point" cx={type === 'phase' ? '118' : '108'} cy={type === 'phase' ? '92' : '70'} r="5" />
        <circle className="plot-point" cx={type === 'phase' ? '198' : '246'} cy={type === 'phase' ? '83' : '61'} r="5" />
      </svg>
    </div>
  )
}

function App() {
  return (
    <div className="app-shell" id="top">
      <NavBar />

      <main>
        <section className="hero section">
          <div className="hero-copy">
            <p className="eyebrow">Research Portfolio</p>
            <h1>Reconstructing Saturn's Ring Structure from Radio Occultation Data</h1>
            <p className="hero-lede">
              An MIT PRIMES Math Junior project exploring how oscillatory integrals,
              stationary phase, and numerical diagnostics can help interpret ring
              structure from spacecraft radio signals.
            </p>
            <div className="hero-actions" aria-label="Page shortcuts">
              <a className="button primary" href="#pipeline">
                View Pipeline
              </a>
              <a className="button secondary" href="#figures">
                See Preview
              </a>
            </div>
            <div className="status-strip">
              <span>Mathematical modeling</span>
              <span>Numerical experiments</span>
              <span>No unpublished data shown</span>
            </div>
          </div>
          <RingDiagram />
        </section>

        <Section id="background" eyebrow="01 / Background" title="Radio Occultation as a Window into Rings">
          <div className="two-column">
            <p>
              During a radio occultation, a spacecraft signal passes through a planetary
              ring system before reaching an observer. The measured signal is affected by
              the ring material along the path, creating an inverse problem: infer
              structure from a transformed, wave-like observation.
            </p>
            <p>
              This site summarizes the mathematical framework and computational direction
              of my project. Placeholder visuals are included for communication and design;
              they are not PRIMES results or Cassini data products.
            </p>
          </div>
        </Section>

        <Section id="math" eyebrow="02 / Mathematical Idea" title="Stationary Phase and Caustic Regions">
          <div className="math-grid">
            <article className="feature-card">
              <span className="card-kicker">Oscillatory integrals</span>
              <h3>Signals as phase-driven sums</h3>
              <p>
                Reconstruction depends on understanding when rapidly oscillating
                contributions cancel and when they reinforce.
              </p>
            </article>
            <article className="feature-card">
              <span className="card-kicker">Stationary roots</span>
              <h3>Where psi prime equals zero</h3>
              <p>
                Points with psi' = 0 can dominate an integral, making root structure a
                useful guide for interpretation.
              </p>
            </article>
            <article className="feature-card">
              <span className="card-kicker">Bifurcations</span>
              <h3>Near-caustic behavior</h3>
              <p>
                When stationary roots merge or appear, standard approximations can become
                delicate and require numerical diagnostics.
              </p>
            </article>
          </div>
        </Section>

        <Section id="pipeline" eyebrow="03 / Reconstruction Pipeline" title="From Signal Geometry to Diagnostics">
          <div className="pipeline">
            {pipelineSteps.map((step, index) => (
              <article className="pipeline-step" key={step.title}>
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="contribution" eyebrow="04 / My Contribution" title="Current Focus and Research Role">
          <div className="contribution-panel">
            <div>
              <h3>Building mathematical intuition into computational tests</h3>
              <p>
                My work focuses on connecting the analytic picture to concrete numerical
                experiments. The goal is careful interpretation, not a claim of final ring
                reconstruction results.
              </p>
            </div>
            <ul>
              {contributions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="figures" eyebrow="05 / Figures / Demo Preview" title="Placeholder Visuals for Future Results">
          <div className="figure-grid">
            <article className="figure-card">
              <MiniPlot type="phase" />
              <h3>Phase-root diagnostic</h3>
              <p>
                A schematic view of how stationary points and smooth background trends
                might be displayed in a research demo.
              </p>
            </article>
            <article className="figure-card">
              <MiniPlot type="reconstruction" />
              <h3>Ring-profile comparison</h3>
              <p>
                A placeholder for comparing simulated reconstruction behavior across
                different assumptions and parameter regimes.
              </p>
            </article>
          </div>
        </Section>

        <Section id="tool" eyebrow="06 / Future Interactive Tool" title="Toward a Cassini and Ring Data Explorer">
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
              <h3>Planned next step</h3>
              <p>
                I plan to build an interactive visualization tool for exploring geometry,
                simulated diagnostics, and eventually public Cassini/ring datasets where
                appropriate. The current site establishes the research context and design
                foundation for that tool.
              </p>
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
