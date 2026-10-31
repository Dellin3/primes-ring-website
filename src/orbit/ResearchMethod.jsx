import { useId } from 'react'
import ResearchMath from './ResearchMath.jsx'
import MethodJourneyFigure from './MethodJourneyFigure.jsx'
import './ResearchMethod.css'

const stages = [
  {
    label: 'Find',
    title: 'Give each root a starting point.',
    description: 'At one ring radius, the stationary equation can have several solutions. Padé approximation and adaptive least-squares fits provide candidates for the roots that are harder to find.',
    output: 'A set of candidate roots',
  },
  {
    label: 'Follow',
    title: 'Stay with the curve as it turns.',
    description: 'As the radius changes, the roots move. Pseudo-arclength continuation follows the branch itself, including near a fold, instead of treating every radius as a fresh search.',
    output: 'A connected branch to follow',
  },
  {
    label: 'Check',
    title: 'Ask the original equation again.',
    description: 'Interpolation returns the candidates to the data grid. Halley’s method then refines them on the original equation, while residual and sampling checks test whether they should be accepted.',
    output: 'Refined roots with numerical checks',
  },
]

function StepMark({ index }) {
  return <svg className="research-method-mark" viewBox="0 0 240 100" aria-hidden="true">
    {index === 0 && <>
      <path className="research-method-sketch-faint" d="M5 75C40 75 35 26 69 26S116 82 143 65S180 18 235 22" />
      <path className="research-method-sketch-axis" d="M5 50H235" />
      <circle className="research-method-point-halo" cx="44" cy="50" r="14" /><circle className="research-method-point" cx="44" cy="50" r="4" />
      <circle className="research-method-point-halo" cx="106" cy="50" r="14" /><circle className="research-method-point" cx="106" cy="50" r="4" />
      <circle className="research-method-point-halo" cx="165" cy="50" r="14" /><circle className="research-method-point" cx="165" cy="50" r="4" />
    </>}
    {index === 1 && <>
      <path className="research-method-sketch-axis" d="M5 50H235" />
      <path className="research-method-sketch-faint" d="M15 19C85 21 185 24 185 50S94 78 15 82" />
      <path className="research-method-sketch" d="M45 20C100 22 185 28 185 50S150 72 115 76" />
      <circle className="research-method-point-halo" cx="185" cy="50" r="14" /><circle className="research-method-point" cx="185" cy="50" r="4" />
      <path className="research-method-sketch" d="m129 68-15 8 17 5" />
    </>}
    {index === 2 && <>
      <path className="research-method-sketch-axis" d="M5 50H235" />
      <path className="research-method-sketch-faint" d="M32 82C85 77 134 25 211 18" />
      <circle className="research-method-target" cx="121" cy="50" r="26" /><circle className="research-method-target" cx="121" cy="50" r="15" />
      <path className="research-method-sketch" d="m71 50h44m-7-5 7 5-7 5" />
      <circle className="research-method-point-halo" cx="121" cy="50" r="10" /><circle className="research-method-point" cx="121" cy="50" r="4" />
    </>}
  </svg>
}

function MethodEquations() {
  return <details className="research-method-equations">
    <summary>The equations behind the three steps</summary>
    <div className="research-method-equation-intro">
      <p>The team seeks stationary angles: places where the phase stops changing with angle.</p>
      <ResearchMath display>{String.raw`f(\rho,\varphi)=\frac{\partial\psi}{\partial\varphi}(\rho,\varphi)=0`}</ResearchMath>
    </div>
    <div className="research-method-equation-grid">
      <article><p className="research-method-mini-label">01 / Initial candidates</p><h4>A simpler function to solve.</h4><ResearchMath display>{String.raw`f(\rho,\varphi)\approx\frac{P_3(\varphi)}{Q_n(\varphi)}`}</ResearchMath><p>At a fixed radius, numerator roots supply candidates. Candidates associated with denominator poles are excluded. Adaptive fitting concentrates on the extra pair after the stable root is found.</p></article>
      <article><p className="research-method-mini-label">02 / Continuation</p><h4>A step along the branch.</h4><ResearchMath display>{String.raw`\begin{aligned}f(\mathbf z)&=0\\(\mathbf z-\mathbf z_0)\cdot\mathbf t_0&=\Delta s\end{aligned}`}</ResearchMath><p>With <ResearchMath>{String.raw`\mathbf z=(\rho,\varphi)`}</ResearchMath>, the second constraint chooses a step along the current tangent. PCHIP interpolation then returns the solutions to regular radii.</p></article>
      <article><p className="research-method-mini-label">03 / Refinement</p><h4>A correction on the original function.</h4><ResearchMath display>{String.raw`\varphi_{n+1}=\varphi_n-\frac{2ff'}{2(f')^2-ff''}`}</ResearchMath><p>Functions and angle derivatives are evaluated at the current candidate, at a fixed radius. A small change in the candidate is not sufficient: the equation residual must also be checked.</p></article>
    </div>
    <p className="research-method-source">Working manuscript, §3.1–3.2, pp. 10–17.</p>
  </details>
}

export default function ResearchMethod() {
  const id = useId()

  return <section className="research-method-story" id="research-method" aria-labelledby={`${id}-heading`}>
    <header className="research-method-heading">
      <p className="research-method-kicker">02 / Following the signal’s structure</p>
      <h2 id={`${id}-heading`}>Find the roots.<br /><em>Keep the story of each one.</em></h2>
      <p>A stationary root is one place where the signal’s phase stops changing with angle. The challenge is to find all the relevant roots, then understand which branch each belongs to as we move across the rings.</p>
    </header>

    <ol className="research-method-steps">
      {stages.map((stage, index) => <li key={stage.label} className="research-method-step">
        <div className="research-method-step-top"><span className="research-method-number" aria-hidden="true">0{index + 1}</span><span>{stage.label}</span><span className="research-method-next" aria-hidden="true">{index < 2 ? '→' : '✓'}</span></div>
        <StepMark index={index} />
        <h3>{stage.title}</h3>
        <p>{stage.description}</p>
        <p className="research-method-output"><span>Carry forward</span>{stage.output}</p>
      </li>)}
    </ol>

    <div className="research-method-identity">
      <div className="research-method-identity-title"><span className="research-method-identity-dot" aria-hidden="true" /><h3>A root also needs an identity.</h3></div>
      <p>A numerical solver may return the same roots in a different order. One-to-one matching reconnects them using circular angle distance, preserving a record of each branch’s phase, curvature, amplitude, and status.</p>
    </div>

    <details className="research-method-worked">
      <summary><span><span className="research-method-mini-label">A closer look</span><strong>Follow a worked branch.</strong><span>See the team’s continuation experiment at the point where the curve turns.</span></span><span className="research-method-expand" aria-hidden="true">+</span></summary>
      <div className="research-method-worked-content">
        <figure className="research-method-paper">
          <div className="research-method-paper-heading"><div><p className="research-method-mini-label">From the working manuscript</p><h3>The method follows the turn.</h3></div><p>The blue continuation points move around the fold. Red PCHIP points return one branch to a regular grid; the purple curve provides the marching-squares comparison.</p></div>
          <a className="research-method-paper-image" href="/images/research/manuscript-figure-14-pac.png" target="_blank" rel="noreferrer" aria-label="Open the original continuation figure at full size"><img src="/images/research/manuscript-figure-14-pac.png" width="1648" height="728" loading="lazy" alt="Manuscript Figure 14: blue continuation points follow a branch around a rightward fold near x equals minus 1.89 and y equals 0.79. Red interpolated points lie along the lower branch, compared with a purple marching-squares curve." /></a>
          <figcaption><span>Figure 14 · §3.1 · p. 16. Synthetic test: <ResearchMath>{String.raw`F(x,y)=(y^3+xy+1)(y^2+2xy+2)`}</ResearchMath>. The axes show the model’s dimensionless variables, not ring radius or Cassini measurements.</span><a href="/images/research/manuscript-figure-14-pac.png" target="_blank" rel="noreferrer">View full-size figure <span aria-hidden="true">↗</span></a></figcaption>
        </figure>
        <details className="research-method-simple-model"><summary>Try a simpler model yourself</summary><MethodJourneyFigure /></details>
        <MethodEquations />
      </div>
    </details>

    <div className="research-method-bridge"><span aria-hidden="true">↓</span><p>Finding the right roots is only part of the problem. Near a fold, even accurate roots can give a poor stationary-phase approximation. <strong>The next question is when to change the way we evaluate the signal.</strong></p></div>
  </section>
}
