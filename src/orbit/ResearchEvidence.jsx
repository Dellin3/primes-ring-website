import { useId, useRef, useState } from 'react'
import { branchCases, integralWork, localIntegralSamples, scalarFold, summarizeIntegralEvidence } from '../content/paperEvidence.js'
import './ResearchEvidence.css'

const evidenceViews = [
  { id: 'integral', name: 'Local integral' },
  { id: 'fold', name: 'Fold verification' },
  { id: 'identity', name: 'Branch identity' },
]
const summary = summarizeIntegralEvidence()
const percent = value => value < 0.0001 ? value.toExponential(2) : value.toFixed(4)
const number = value => value.toLocaleString('en-US')

function ErrorChart({ selectedIndex }) {
  const chartId = useId()
  const left = 81, right = 715, top = 42, bottom = 275
  const x = value => left + ((Math.log10(value) + 3) / (Math.log10(3) + 3)) * (right - left)
  const y = value => bottom - ((Math.log10(value) + 11) / 13) * (bottom - top)
  const line = key => localIntegralSamples.map((sample, index) => `${index ? 'L' : 'M'} ${x(sample.offsetKm)} ${y(sample[key])}`).join(' ')
  const selected = localIntegralSamples[selectedIndex]
  return <div className="evidence-chart-scroll" tabIndex={0} role="region" aria-label="Local integral comparison chart; scroll horizontally if needed">
    <svg className="evidence-error-chart" viewBox="0 0 750 343" role="img" aria-labelledby={`${chartId}-title ${chartId}-description`}>
      <title id={`${chartId}-title`}>Reported local integral errors at eight positive offsets</title>
      <desc id={`${chartId}-description`}>Logarithmic axes: radial offset in kilometres and symmetric error in percent. Ordinary stationary phase approximation is compared with the switched evaluator. At {selected.offsetKm} kilometres, ordinary SPA is {percent(selected.spaPercent)} percent and switched is {percent(selected.switchedPercent)} percent. Select a sample below for exact values. Lines only connect reported samples.</desc>
      <text x={left} y="19" className="evidence-axis-title">Symmetric error (%) · log scale</text>
      {[2, -1, -4, -7, -10].map(exponent => <g key={exponent}>
        <line className="evidence-grid" x1={left} x2={right} y1={y(10 ** exponent)} y2={y(10 ** exponent)} />
        <text className="evidence-tick" x={left - 15} y={y(10 ** exponent) + 4} textAnchor="end">10<tspan baselineShift="super" fontSize="9">{exponent}</tspan></text>
      </g>)}
      {[0.001, 0.01, 0.1, 1, 3].map(value => <g key={value}>
        <line className="evidence-grid evidence-grid-vertical" x1={x(value)} x2={x(value)} y1={top} y2={bottom} />
        <text className="evidence-tick" x={x(value)} y={bottom + 23} textAnchor="middle">{value}</text>
      </g>)}
      <line className="evidence-chart-baseline" x1={left} x2={right} y1={bottom} y2={bottom} />
      <line className="evidence-selection-line" x1={x(selected.offsetKm)} x2={x(selected.offsetKm)} y1={top} y2={bottom} />
      <path className="evidence-spa-line" d={line('spaPercent')} />
      <path className="evidence-switched-line" d={line('switchedPercent')} />
      {localIntegralSamples.map((sample, index) => <g key={sample.offsetKm}>
        <circle className="evidence-spa-point" cx={x(sample.offsetKm)} cy={y(sample.spaPercent)} r="5" />
        <rect className="evidence-switched-point" x={x(sample.offsetKm) - 3.4} y={y(sample.switchedPercent) - 3.4} width="6.8" height="6.8" />
        {index === selectedIndex && <>
          <circle className="evidence-selection-ring" cx={x(sample.offsetKm)} cy={y(sample.spaPercent)} r="10" />
          {sample.switchedPercent !== sample.spaPercent && <circle className="evidence-selection-ring" cx={x(sample.offsetKm)} cy={y(sample.switchedPercent)} r="10" />}
        </>}
      </g>)}
      <text className="evidence-axis-title" x={(left + right) / 2} y="329" textAnchor="middle">Radial offset μ = ρ − ρc (km) · log scale</text>
    </svg>
  </div>
}

function IntegralEvidence() {
  const [selectedIndex, setSelectedIndex] = useState(5)
  const selected = localIntegralSamples[selectedIndex]
  return <>
    <div className="evidence-view-heading"><div><p className="evidence-kind">Scalar-geometry benchmark · Table 3, p. 20</p><h3>Correct roots.<br /><em>A better local evaluation.</em></h3></div><p>Close to a fold, separate stationary-phase contributions can be inaccurate even when the roots are correct. The preset rule selects direct integration when the pair’s phase separation χ ≤ 1.</p></div>
    <dl className="evidence-stat-row">
      <div><dt>Largest error across all eight offsets</dt><dd>{summary.maximumSpaPercent.toFixed(4)}<span>%</span><span className="evidence-stat-arrow" aria-label="reduced to"> → </span>{summary.maximumSwitchedPercent.toFixed(4)}<span>%</span></dd></div>
      <div><dt>Offsets using local quadrature</dt><dd>{summary.quadratureCount}<span> / {summary.sampleCount}</span></dd></div>
      <div><dt>Fewer direct integrand samples than all-quadrature</dt><dd>{summary.fewerIntegrandSamplesPercent.toFixed(1)}<span>%</span></dd></div>
    </dl>
    <figure className="evidence-chart-figure">
      <div className="evidence-legend"><span><i className="evidence-legend-spa" aria-hidden="true" />Ordinary SPA</span><span><i className="evidence-legend-switched" aria-hidden="true" />Switched evaluator</span></div>
      <ErrorChart selectedIndex={selectedIndex} />
      <figcaption>Positive offsets only. Lines connect reported samples. Adding labels or flags alone gives exactly the ordinary SPA values.</figcaption>
    </figure>
    <div className="evidence-sample-control"><p>Select a reported offset <span>μ · km</span></p><div className="evidence-samples" role="group" aria-label="Select radial offset in kilometres">{localIntegralSamples.map((sample, index) => <button type="button" key={sample.offsetKm} aria-pressed={selectedIndex === index} aria-label={`Offset ${sample.offsetKm} kilometres`} onClick={() => setSelectedIndex(index)}>{sample.offsetKm}</button>)}</div></div>
    <div className="evidence-readout" aria-live="polite" aria-atomic="true">
      <div><span>Ordinary SPA</span><strong>{percent(selected.spaPercent)}<small>%</small></strong></div>
      <div><span>Switched · {selected.evaluator === 'Simpson' ? 'local quadrature' : 'retained SPA'}</span><strong>{percent(selected.switchedPercent)}<small>%</small></strong></div>
      <p>{selected.offsetKm === 0.3 ? <>The remaining worst case: χ ≈ 3.60 retains SPA here. This rule does not guarantee 1% accuracy on the tested grid.</> : selected.evaluator === 'Simpson' ? <>This sample uses 16,385-point Simpson quadrature. The small numerical error is relative to an independent integration reference.</> : <>The preset rule retains ordinary SPA at this sample; its numerical value is unchanged.</>}</p>
    </div>
    <p className="evidence-method-limit">These are errors in a windowed <strong>local angular contribution</strong> for one fixed scalar geometry informed by Rev 133. They do not measure receiver-data reconstruction accuracy or a gain in ring-profile resolution.</p>
    <details className="evidence-details"><summary>All eight results &amp; benchmark conditions</summary>
      <div className="evidence-table-scroll" tabIndex={0} role="region" aria-label="Table 3 values, horizontally scrollable"><table><caption>Manuscript Table 3 · symmetric error (%)</caption><thead><tr><th scope="col">μ (km)</th><th scope="col">SPA</th><th scope="col">+ labels</th><th scope="col">+ flags</th><th scope="col">Switched</th><th scope="col">Evaluator</th></tr></thead><tbody>{localIntegralSamples.map(sample => <tr key={sample.offsetKm} className={sample.offsetKm === selected.offsetKm ? 'evidence-current-row' : ''}><th scope="row">{sample.offsetKm}</th><td>{percent(sample.spaPercent)}</td><td>{percent(sample.spaPercent)}</td><td>{percent(sample.spaPercent)}</td><td>{percent(sample.switchedPercent)}</td><td>{sample.evaluator}</td></tr>)}</tbody></table></div>
      <p><strong>Error definition:</strong> 100 × |I_method − I_ref| / (|I_method| + |I_ref|). SPA denotes the stationary-phase approximation; the switched evaluator uses Simpson quadrature when χ ≤ 1, and SPA otherwise.</p>
      <p><strong>Sampling work:</strong> {number(integralWork.hybridIntegrandSamples)} direct integrand samples plus {integralWork.hybridSaddleEvaluations} saddle evaluations, compared with {number(integralWork.allQuadratureIntegrandSamples)} integrand samples for quadrature at all eight offsets. The {summary.fewerIntegrandSamplesPercent.toFixed(1)}% reduction concerns sampling work, not runtime. The hybrid remains slower than ordinary SPA.</p>
      <p><strong>Reference:</strong> adaptive Gauss–Kronrod, independently checked against 131,073-point Simpson and trapezoid calculations. A common taper is 1 within 0.4° of the fold angle and 0 beyond 0.8°. The fixed χ ≤ 1 rule is a test setting, not a universal error bound. Small quadrature discrepancies do not establish equally small physical uncertainty.</p>
      <ScalarConditions />
    </details>
  </>
}

function ScalarConditions() {
  return <div className="evidence-scalar-conditions"><p><strong>Fixed scalar inputs:</strong> ρ₀ = {scalarFold.referenceRadiusKm} km; D = {scalarFold.distanceKm} km; B = {scalarFold.openingAngleDegrees}°; φ₀ = {scalarFold.referenceAzimuthDegrees}°; λ = {scalarFold.wavelengthKm} km.</p><p>The manuscript cites earlier work with <code>RSS_2010_170_X34_E_GEO</code>. That geometry product differs from the <code>X43_E_DLP_500M</code> profile shown for Rev 133 in the explorer. The scalar azimuth-to-vector coordinate conversion has not been independently verified.</p></div>
}

function FoldEvidence() {
  return <>
    <div className="evidence-view-heading"><div><p className="evidence-kind">Scalar-geometry check · Table 2, pp. 18–19</p><h3>Verify the fold.<br /><em>Then trust the interpretation.</em></h3></div><p>A disappearing track alone does not prove a fold. The experiment checks the derivative conditions, counts nearby roots, and compares a predicted separation law with independently solved roots.</p></div>
    <div className="evidence-fold-grid">
      <div className="evidence-fold-location"><p className="eyebrow">Recomputed fold location</p><dl><div><dt>Ring radius ρc</dt><dd>{scalarFold.radiusKm}<span> km</span></dd></div><div><dt>Stationary angle φc</dt><dd>{scalarFold.angleDegrees}<span>°</span></dd></div></dl><div className="evidence-root-counts"><div><span>μ = −0.01 km</span><strong>0 <small>local roots</small></strong></div><span aria-hidden="true">→</span><div><span>μ = +0.01 km</span><strong>2 <small>local roots</small></strong></div></div></div>
      <div className="evidence-fold-slope"><p className="eyebrow">Squared separation · |φ+ − φ−|² ≈ slope × μ</p><dl><div><dt>Derivative prediction</dt><dd>{scalarFold.predictedSlope.toFixed(8)}<span> deg²/km</span></dd></div><div><dt>Independently solved roots</dt><dd>{scalarFold.measuredSlope.toFixed(8)}<span> deg²/km</span></dd></div></dl><p className="evidence-slope-match"><strong>{scalarFold.relativeSlopeDifferencePercent}%</strong><span>reported relative slope difference</span></p></div>
    </div>
    <p className="evidence-method-limit">This verifies a local fold in the stated scalar angle convention. It checks geometry parameters and numerical roots; it is not a new reduction of Cassini receiver data.</p>
    <details className="evidence-details"><summary>Derivative checks &amp; scalar geometry</summary><p>At a generic fold, Φφ = Φφφ = 0 while Φφφφ and Φφρ remain nonzero. The reported values use kilometres and radians:</p><dl className="evidence-derivatives"><div><dt>Φφ</dt><dd>{scalarFold.phaseAngularDerivative}</dd></div><div><dt>Φφφ</dt><dd>{scalarFold.phaseSecondAngularDerivative}</dd></div><div><dt>Φφφφ</dt><dd>{scalarFold.phaseThirdAngularDerivative}</dd></div><div><dt>Φφρ</dt><dd>{scalarFold.phaseMixedDerivative}</dd></div></dl><p>The slope difference is reported from the manuscript’s calculations; the two displayed slopes have been rounded. No root trajectories are inferred or generated from these summary values.</p><ScalarConditions /></details>
  </>
}

function IdentityEvidence() {
  return <>
    <div className="evidence-view-heading"><div><p className="evidence-kind">Synthetic matching benchmark · §4, pp. 17–18</p><h3>Keep the identity.<br /><em>Keep the limits visible.</em></h3></div><p>Independent nearest-root matches can reuse the same predecessor. Global one-to-one assignment gives each new root at most one link, within a fixed circular-distance gate.</p></div>
    <dl className="evidence-stat-row evidence-identity-stats"><div><dt>Wrong links in close parallel tracks</dt><dd>9 <span className="evidence-stat-arrow" aria-label="reduced to">→</span> 0</dd></div><div><dt>False unmatched-predecessor flags</dt><dd>9 <span className="evidence-stat-arrow" aria-label="reduced to">→</span> 0</dd></div><div><dt>Largest complex-sum change after relabeling</dt><dd>8.88 <span>× 10<sup>−16</sup></span></dd></div></dl>
    <div className="evidence-table-scroll evidence-identity-table" tabIndex={0} role="region" aria-label="Reported synthetic matching cases, horizontally scrollable"><table><caption>Five synthetic cases · 10 samples each · 0.28-radian gate · no observational noise</caption><thead><tr><th scope="col">Case</th><th scope="col">Independent matching</th><th scope="col">One-to-one assignment</th><th scope="col">Assignment + prediction</th></tr></thead><tbody>{branchCases.map(item => <tr key={item.name}><th scope="row">{item.name}</th><td>{item.independent}</td><td>{item.assignment}</td><td>{item.predicted}</td></tr>)}</tbody></table></div>
    <p className="evidence-method-limit">Prediction gave no further improvement in these cases. All methods lost three identities when motion exceeded the gate. Relabeling changes the complex sum only at floating-point rounding scale; the local-integral improvement comes from additional integration.</p>
    <details className="evidence-details"><summary>What this test establishes</summary><p>The methods receive identical candidate roots. Known identities are used only to assess the links; the random seed changes root order. One-to-one assignment first maximizes the number of links within the gate, then minimizes total squared circular distance.</p><p>These tests measure branch association between samples, not reconstruction accuracy. Beyond-gate failures require finer sampling or a recovery step. An unmatched root may reflect a missed solution and does not by itself establish a physical merger.</p></details>
  </>
}

export default function ResearchEvidence() {
  const [activeView, setActiveView] = useState('integral')
  const tabRefs = useRef([])
  const id = useId()
  function handleTabKey(event, index) {
    let next
    if (event.key === 'ArrowRight') next = (index + 1) % evidenceViews.length
    else if (event.key === 'ArrowLeft') next = (index + evidenceViews.length - 1) % evidenceViews.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = evidenceViews.length - 1
    else return
    event.preventDefault()
    setActiveView(evidenceViews[next].id)
    tabRefs.current[next]?.focus()
  }
  return <section className="research-evidence glass-panel" aria-labelledby={`${id}-title`}>
    <div className="evidence-heading"><div><p className="eyebrow">02 / The reported evidence</p><h2 id={`${id}-title`}>What the tests <em>actually show.</em></h2></div><p>Three experiments from our team’s manuscript.</p></div>
    <div className="evidence-tabs" role="tablist" aria-label="Research evidence">{evidenceViews.map((view, index) => <button key={view.id} ref={node => { tabRefs.current[index] = node }} type="button" role="tab" id={`${id}-tab-${view.id}`} aria-selected={activeView === view.id} aria-controls={`${id}-panel-${view.id}`} tabIndex={activeView === view.id ? 0 : -1} onClick={() => setActiveView(view.id)} onKeyDown={event => handleTabKey(event, index)}><span className="evidence-tab-number" aria-hidden="true">0{index + 1}</span>{view.name}</button>)}</div>
    {evidenceViews.map(view => <div key={view.id} id={`${id}-panel-${view.id}`} role="tabpanel" aria-labelledby={`${id}-tab-${view.id}`} tabIndex={0} hidden={activeView !== view.id} className="evidence-view">{view.id === 'integral' ? <IntegralEvidence /> : view.id === 'fold' ? <FoldEvidence /> : <IdentityEvidence />}</div>)}
    <p className="evidence-source">Source: team master manuscript, §§4–6, pp. 17–20. Values are reported results; this interface does not rerun the research solver.</p>
  </section>
}
