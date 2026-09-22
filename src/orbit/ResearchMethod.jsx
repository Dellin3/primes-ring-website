import { useId, useRef, useState } from 'react'
import ToyBranchDiagram from '../components/research/ToyBranchDiagram.jsx'
import './ResearchMethod.css'

const stages = [
  {
    label: 'Locate',
    title: 'Give the extra roots a starting point.',
    description: 'A low-order Padé approximation or an adaptive least-squares fit supplies initial candidates. After finding the stable root, the fit focuses on the remaining pair and adjusts its sampling interval.',
    equation: 'f(ρ, φ) ≈ P₃(φ) / Qₙ(φ)',
    equationLabel: 'At fixed radius rho, approximate f of rho and phi by P three of phi divided by Q n of phi.',
    note: 'Use the numerator roots as candidates; exclude candidates associated with denominator poles.',
    source: 'Section 3.1 · pp. 10–14',
  },
  {
    label: 'Continue',
    title: 'Follow the curve into a fold.',
    description: 'Pseudo-arclength continuation predicts along the branch tangent, then corrects with a constrained Newton step. PCHIP interpolation returns the tracked solutions to the regular data grid for refinement.',
    equation: 'f(z) = 0;  (z − z₀) · t₀ = Δs',
    equationLabel: 'Solve f of z equals zero together with z minus z zero dot tangent t zero equals the arclength step delta s.',
    note: 'Here z = (ρ, φ) and t₀ is the unit tangent. The step follows the curve rather than fixing the next radius.',
    source: 'Section 3.1 · pp. 14–16',
  },
  {
    label: 'Refine',
    title: 'Check candidates on the original equation.',
    description: 'Halley’s method corrects each candidate on the original stationary equation. Acceptance checks the function residual, the approximation error, and stability when additional samples are introduced.',
    equation: 'φₙ₊₁ = φₙ − 2ff′ / (2f′² − ff″)',
    equationLabel: 'The next phi equals current phi minus two f times f prime divided by two f prime squared minus f times f double prime.',
    note: 'All functions are evaluated at φₙ, at a fixed radius. A small step alone does not establish a root.',
    source: 'Section 3.2 · pp. 16–17',
  },
]

export default function ResearchMethod() {
  const [selected, setSelected] = useState(0)
  const id = useId()
  const tabs = useRef([])

  function changeWithKeyboard(event, index) {
    const next = {
      ArrowRight: (index + 1) % stages.length,
      ArrowLeft: (index - 1 + stages.length) % stages.length,
      Home: 0,
      End: stages.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    setSelected(next)
    tabs.current[next]?.focus()
  }

  return <section className="research-method-story" aria-labelledby={`${id}-heading`}>
    <div className="research-method-heading">
      <p className="eyebrow">01 / How the method works</p>
      <h2 id={`${id}-heading`}>Find the roots. <em>Keep the branches.</em></h2>
      <p>The stationary equation is f(ρ, φ) = ∂ψ/∂φ = 0. The team combines three numerical steps to follow its solutions.</p>
    </div>

    <div className="research-method-card glass-panel">
      <div className="research-method-tabs" role="tablist" aria-label="Root-finding stages">
        {stages.map((stage, index) => <button
          key={stage.label}
          type="button"
          role="tab"
          id={`${id}-tab-${index}`}
          aria-controls={`${id}-panel-${index}`}
          aria-selected={selected === index}
          tabIndex={selected === index ? 0 : -1}
          ref={element => { tabs.current[index] = element }}
          onClick={() => setSelected(index)}
          onKeyDown={event => changeWithKeyboard(event, index)}
        ><span aria-hidden="true">0{index + 1}</span>{stage.label}<span className="research-method-tab-arrow" aria-hidden="true">↗</span></button>)}
      </div>

      {stages.map((stage, index) => <div
        key={stage.label}
        className="research-method-panel"
        id={`${id}-panel-${index}`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${index}`}
        hidden={selected !== index}
        tabIndex={0}
      >
        <div className="research-method-copy"><h3>{stage.title}</h3><p>{stage.description}</p></div>
        <div className="research-method-math">
          <p className="research-method-equation" role="math" aria-label={stage.equationLabel}><span aria-hidden="true">{stage.equation}</span></p>
          <p>{stage.note}</p>
          <span className="research-method-source">{stage.source}</span>
        </div>
      </div>)}

      <div className="research-method-record">
        <div><p className="eyebrow">Carry each branch forward</p><p className="research-method-fields">Identity · phase · curvature · amplitude · status</p></div>
        <p>One-to-one matching uses circular angle distance to reconnect unordered roots. Labels preserve identity; the numerical evaluation is checked separately. <span>Section 4 · pp. 17–18</span></p>
      </div>
    </div>

    <div className="research-method-foot">
      <p>The manuscript demonstrates these numerical steps on synthetic test functions. This page explains the workflow; it does not run a Cassini reconstruction solver.</p>
      <details className="research-method-demo">
        <summary>Try a simple branch model</summary>
        <ToyBranchDiagram />
      </details>
    </div>
  </section>
}
