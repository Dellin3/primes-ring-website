import { useRef } from 'react'
import { Link } from 'react-router-dom'
import EvidenceTag from '../../components/common/EvidenceTag.jsx'
import { project } from '../../content/project.js'
import { usePointerDepth } from '../../lib/motion.js'

// Who worked on what, as stated in the team's working manuscript
// (acknowledgments), the same wording as the research page.
const people = [
  { name: 'Yutong Zhao', focus: 'Finding starting points', work: 'Worked on Padé approximation and adaptive least-squares methods to locate candidate stationary roots.' },
  { name: 'Maiya Qiu', focus: 'Following the branches', work: 'Developed least-squares and pseudo-arclength continuation — the method in this figure.' },
  { name: 'Dell Li', focus: 'Identity, folds & reliability', work: 'Wrote the sections on stationary-branch bookkeeping, generic-fold verification and the reliability of the stationary-phase approximation.' },
]

// Markers beside the three things the figure's caption names (percent of the
// image's width and height): the fold, the continuation points, the grid points.
const marks = [
  { id: 1, x: 87.2, y: 41.5, text: 'The fold: two branches meet here and turn back.' },
  { id: 2, x: 35, y: 13.5, text: 'Blue points: continuation follows the branch all the way around the turn.' },
  { id: 3, x: 47, y: 71, text: 'Red points: one branch returned to a regular grid (PCHIP), checked against the purple marching-squares curve.' },
]

export default function InsideResearch() {
  const figureRef = useRef(null)
  usePointerDepth(figureRef, 10)
  return <section className="home-band home-research" aria-labelledby="inside-title">
    <div className="home-band-inner research-layout">
      <div className="research-figure-column" ref={figureRef} data-reveal>
        <figure className="research-paper">
          <div className="research-paper-sheet">
            <p className="research-paper-label">From the team’s working manuscript · Figure 14 · §3.1 · p. 16</p>
            <div className="research-paper-image">
              <img src="/images/research/manuscript-figure-14-pac.png" width="1648" height="728" loading="lazy" decoding="async" alt="Manuscript Figure 14: blue continuation points follow a branch around a rightward fold near x equals minus 1.89 and y equals 0.79. Red interpolated points lie along the lower branch, compared with a purple marching-squares curve." />
              {marks.map(mark => <span key={mark.id} className="research-mark" style={{ left: `${mark.x}%`, top: `${mark.y}%` }} aria-hidden="true">{mark.id}</span>)}
            </div>
          </div>
          <figcaption className="research-annotation">
            <p className="research-annotation-title">What to notice</p>
            <ol>{marks.map(mark => <li key={mark.id}><span className="research-mark is-static" aria-hidden="true">{mark.id}</span>{mark.text}</li>)}</ol>
            <p className="research-annotation-source"><EvidenceTag kind="synthetic">Synthetic test</EvidenceTag> F(x, y) = (y³ + xy + 1)(y² + 2xy + 2). The axes are the model’s dimensionless variables, not ring radius or Cassini data.</p>
          </figcaption>
        </figure>
      </div>
      <header className="research-head" data-reveal>
        <p className="home-kicker"><span className="mono">03</span> Inside the research</p>
        <h2 id="inside-title">The rings leave a trace. <em>How do we read it?</em></h2>
      </header>
      <div className="research-note" data-reveal>
        <p>As a radio signal passes through the rings, its strength and phase change. Recovering the finest structure also means accounting for diffraction: waves travelling along nearby paths interfere.</p>
        <blockquote className="research-question-callout"><p className="research-question-label">The research question</p><p>How do we find the relevant branches, keep their identities, and decide when the approximation needs more care?</p></blockquote>
        <p>A stationary-phase calculation focuses on angles where the phase stops changing. One starting guess can find one such angle and miss others. Near a fold, two branches approach each other and turn — the figure shows the method following that turn.</p>
        <p className="research-limit"><strong>What this is not.</strong> These tests use synthetic branches and a stated scalar geometry. They do not produce a new high-resolution ring profile, and this website does not run the team’s solver.</p>
        <div className="research-people">
          <p className="research-people-title">{project.program} · the people behind the work</p>
          <ul>{people.map(person => <li key={person.name}><strong>{person.name}</strong><span>{person.focus}</span><small>{person.work}</small></li>)}</ul>
          <p className="research-people-mentor">Mentored by {project.mentor}, who proposed the project. Contributions follow the acknowledgments in the team’s working manuscript.</p>
        </div>
        <div className="research-note-links"><Link className="research-text-link" to="/research/2026">Read the research story <span aria-hidden="true">→</span></Link><Link className="research-text-link" to="/research/2026#research-method">See the method step by step <span aria-hidden="true">→</span></Link></div>
      </div>
    </div>
  </section>
}
