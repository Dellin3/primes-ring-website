import { useId, useState } from 'react'
import { branchCases, integralWork, localIntegralSamples, scalarFold, summarizeIntegralEvidence } from '../content/paperEvidence.js'
import ResearchMath from './ResearchMath.jsx'
import './ResearchEvidence.css'

const summary = summarizeIntegralEvidence()
const percent = value => value < 0.0001 ? value.toExponential(2) : value.toFixed(4)
const number = value => value.toLocaleString('en-US')
const scientificTex = value => {
  const [mantissa, exponent] = String(value).replace('−', '-').split('e')
  return exponent === undefined ? mantissa : String.raw`${mantissa}\times 10^{${Number(exponent)}}`
}
const percentTex = value => String.raw`${scientificTex(percent(value))}\%`

function ErrorChart({ selectedIndex }) {
  const chartId = useId()
  const left = 83, right = 714, top = 44, bottom = 272
  const x = value => left + ((Math.log10(value) + 3) / (Math.log10(3) + 3)) * (right - left)
  const y = value => bottom - ((Math.log10(value) + 11) / 13) * (bottom - top)
  const line = key => localIntegralSamples.map((sample, index) => `${index ? 'L' : 'M'} ${x(sample.offsetKm)} ${y(sample[key])}`).join(' ')
  const selected = localIntegralSamples[selectedIndex]
  return <div className="ev-chart-scroll" tabIndex={0} role="region" aria-label="Error comparison chart, scroll horizontally on small screens">
    <svg className="ev-error-chart" viewBox="0 0 750 343" role="img" aria-labelledby={`${chartId}-title ${chartId}-description`}>
      <title id={`${chartId}-title`}>Local integral errors at eight reported radial offsets</title>
      <desc id={`${chartId}-description`}>Both axes are logarithmic. At {selected.offsetKm} kilometres, ordinary stationary-phase approximation has {percent(selected.spaPercent)} percent symmetric error and the switched evaluator has {percent(selected.switchedPercent)} percent. The controls above select each reported sample. Connecting lines do not represent additional measurements.</desc>
      <text x={left} y="20" className="ev-axis-title">Symmetric error (%) · lower is better</text>
      {[2, -1, -4, -7, -10].map(exponent => <g key={exponent}>
        <line className="ev-grid" x1={left} x2={right} y1={y(10 ** exponent)} y2={y(10 ** exponent)} />
        <text x={left - 16} y={y(10 ** exponent) + 5} textAnchor="end">10<tspan baselineShift="super" fontSize="10">{exponent}</tspan></text>
      </g>)}
      {[0.001, 0.01, 0.1, 1, 3].map(value => <g key={value}>
        <line className="ev-grid ev-grid-vertical" x1={x(value)} x2={x(value)} y1={top} y2={bottom} />
        <text x={x(value)} y={bottom + 27} textAnchor="middle">{value}</text>
      </g>)}
      <line className="ev-selection-line" x1={x(selected.offsetKm)} x2={x(selected.offsetKm)} y1={top} y2={bottom} />
      <path className="ev-spa-line" d={line('spaPercent')} />
      <path className="ev-switched-line" d={line('switchedPercent')} />
      {localIntegralSamples.map((sample, index) => <g key={sample.offsetKm}>
        <circle className="ev-spa-point" cx={x(sample.offsetKm)} cy={y(sample.spaPercent)} r="5" />
        <rect className="ev-switched-point" x={x(sample.offsetKm) - 3.5} y={y(sample.switchedPercent) - 3.5} width="7" height="7" />
        {index === selectedIndex && <>
          <circle className="ev-selection-ring" cx={x(sample.offsetKm)} cy={y(sample.spaPercent)} r="11" />
          {sample.switchedPercent !== sample.spaPercent && <circle className="ev-selection-ring" cx={x(sample.offsetKm)} cy={y(sample.switchedPercent)} r="11" />}
        </>}
      </g>)}
      <text className="ev-axis-title" x={(left + right) / 2} y="334" textAnchor="middle">Distance from the fold · km</text>
    </svg>
  </div>
}

function IntegralEvidence() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = localIntegralSamples[selectedIndex]
  const usingQuadrature = selected.evaluator === 'Simpson'
  return <>
    <div className="ev-case-intro">
      <p>Consider a point just <strong>0.001 km from the fold.</strong> The stationary roots are already correct, but treating their contributions separately gives a large error. Our next decision is about <em>how to evaluate the integral.</em></p>
      <p className="ev-scope">This example tests a local angular contribution in a scalar geometry informed by Rev 133. The percentages compare numerical evaluations with an independent reference; they are not errors in a reconstructed ring profile.</p>
    </div>

    <div className="ev-case-stage">
      <div className="ev-case-topline"><span>Explore the reported example</span><span><ResearchMath>{String.raw`\mu = ${selected.offsetKm}\,\mathrm{km}`}</ResearchMath></span></div>
      <div className="ev-comparison" aria-live="polite" aria-atomic="true">
        <div className="ev-result ev-result-before"><span className="ev-result-label">Ordinary stationary phase</span><strong><ResearchMath>{percentTex(selected.spaPercent)}</ResearchMath></strong><span className="ev-result-caption">Approximate each contribution separately</span></div>
        <span className="ev-comparison-arrow" aria-hidden="true">→</span>
        <div className="ev-result ev-result-after"><span className="ev-result-label">Our switched evaluation</span><strong><ResearchMath>{percentTex(selected.switchedPercent)}</ResearchMath></strong><span className="ev-result-caption">{usingQuadrature ? 'Integrate the local contribution directly' : 'Keep the ordinary approximation'}</span></div>
      </div>
      <div className="ev-case-explanation" aria-live="polite">
        <span className="ev-evaluator-tag">{usingQuadrature ? 'Local quadrature' : 'SPA retained'}</span>
        <p>{usingQuadrature ? <>Here the phase gap passes the preset <ResearchMath>{String.raw`\chi\leq 1`}</ResearchMath> rule, so the evaluator uses Simpson quadrature. The difference comes from that extra calculation, not from changing root labels.</> : selected.offsetKm === 0.3 ? <>At this offset, <ResearchMath>{String.raw`\chi\approx 3.60`}</ResearchMath> leaves SPA in place. Its {percent(selected.switchedPercent)}% error is the largest remaining error in the tested grid.</> : <>The phase-gap rule leaves SPA in place here. Both values are the same because no additional integration is performed.</>}</p>
      </div>
      <div className="ev-sample-control">
        <p>Move farther from the fold <span>Choose one of eight reported offsets, in km.</span></p>
        <div className="ev-samples" role="group" aria-label="Select reported radial offset in kilometres">{localIntegralSamples.map((sample, index) => <button type="button" key={sample.offsetKm} aria-pressed={selectedIndex === index} aria-label={`Offset ${sample.offsetKm} kilometres`} onClick={() => setSelectedIndex(index)}>{sample.offsetKm}</button>)}</div>
      </div>
      <figure className="ev-chart-figure">
        <div className="ev-legend"><span><i className="ev-legend-spa" aria-hidden="true" />Ordinary SPA</span><span><i className="ev-legend-switched" aria-hidden="true" />Switched evaluator</span></div>
        <ErrorChart selectedIndex={selectedIndex} />
        <figcaption>Logarithmic axes · lines connect the eight reported samples. At the last three offsets, the methods coincide.</figcaption>
      </figure>
    </div>

    <div className="ev-grid-conclusion">
      <div><p className="ev-kicker">Across the full tested grid</p><h3>A local improvement.<br /><em>A measured trade-off.</em></h3></div>
      <dl><div><dt>Largest symmetric error</dt><dd><span>{summary.maximumSpaPercent.toFixed(4)}%</span><span className="ev-metric-arrow" aria-label="reduced to">→</span><strong>{summary.maximumSwitchedPercent.toFixed(4)}%</strong></dd></div><div><dt>Fewer direct integrand samples than quadrature everywhere</dt><dd><strong>{summary.fewerIntegrandSamplesPercent.toFixed(1)}%</strong></dd></div></dl>
      <p>The rule chooses quadrature at {summary.quadratureCount} of {summary.sampleCount} offsets. It reduces sampling work compared with integrating at every offset; it does not establish a runtime speed-up or a 1% error guarantee.</p>
    </div>
    <details className="ev-details">
      <summary>Inspect all eight results &amp; experiment conditions <span aria-hidden="true">+</span></summary>
      <div className="ev-detail-body">
        <div className="ev-table-scroll" tabIndex={0} role="region" aria-label="Table 3, horizontally scrollable"><table><caption>Team manuscript · Table 3 · symmetric error (%)</caption><thead><tr><th scope="col">Offset (km)</th><th scope="col">SPA</th><th scope="col">+ labels</th><th scope="col">+ flags</th><th scope="col">Switched</th><th scope="col">Evaluator</th></tr></thead><tbody>{localIntegralSamples.map(sample => <tr key={sample.offsetKm} className={sample.offsetKm === selected.offsetKm ? 'ev-current-row' : ''}><th scope="row">{sample.offsetKm}</th><td>{percent(sample.spaPercent)}</td><td>{percent(sample.spaPercent)}</td><td>{percent(sample.spaPercent)}</td><td>{percent(sample.switchedPercent)}</td><td>{sample.evaluator}</td></tr>)}</tbody></table></div>
        <p><strong>Error definition.</strong> Both methods are compared with the same independent reference:</p>
        <ResearchMath display>{String.raw`E_{\mathrm{sym}}=100\,\frac{\left|I_{\mathrm{method}}-I_{\mathrm{ref}}\right|}{\left|I_{\mathrm{method}}\right|+\left|I_{\mathrm{ref}}\right|}\%`}</ResearchMath>
        <p><strong>Sampling work.</strong> {number(integralWork.hybridIntegrandSamples)} direct integrand samples plus {integralWork.hybridSaddleEvaluations} saddle evaluations, versus {number(integralWork.allQuadratureIntegrandSamples)} integrand samples for quadrature at all eight offsets. Each selected quadrature uses {number(integralWork.integrandSamplesPerQuadrature)} Simpson samples. The hybrid requires more work than ordinary SPA.</p>
        <p><strong>Independent reference.</strong> Adaptive Gauss–Kronrod, checked against 131,073-point Simpson and trapezoid calculations. A common taper is 1 within 0.4° of the fold angle and 0 beyond 0.8°. The threshold was fixed before this comparison. Small quadrature discrepancies do not establish equally small physical uncertainty.</p>
        <ScalarConditions />
      </div>
    </details>
  </>
}

function ScalarConditions() {
  return <div className="ev-scalar-conditions"><p><strong>Fixed scalar geometry.</strong></p><ResearchMath display>{String.raw`\begin{aligned}\rho_0&=${scalarFold.referenceRadiusKm}\,\mathrm{km},&D&=${scalarFold.distanceKm}\,\mathrm{km}\\B&=${scalarFold.openingAngleDegrees}^{\circ},&\varphi_0&=${scalarFold.referenceAzimuthDegrees}^{\circ}\\\lambda&=${scientificTex(scalarFold.wavelengthKm)}\,\mathrm{km}\end{aligned}`}</ResearchMath><p>The manuscript cites <code>RSS_2010_170_X34_E_GEO</code>. That geometry product differs from the <code>X43_E_DLP_500M</code> profile available for Rev 133 in the data explorer. The scalar azimuth-to-vector coordinate conversion has not been independently verified.</p></div>
}

function FoldEvidence() {
  return <details className="ev-supporting-experiment">
    <summary><span className="ev-supporting-number" aria-hidden="true">A</span><span><span className="ev-kicker">Check the geometry</span><strong>Are the roots really meeting at a fold?</strong><span className="ev-supporting-description">A predicted separation law meets independently solved roots.</span></span><span className="ev-disclosure-plus" aria-hidden="true">+</span></summary>
    <div className="ev-experiment-body">
      <p>A disappearing track is not enough to identify a fold. We checked the phase derivatives, counted the nearby roots on each side, and compared their separation with the local prediction.</p>
      <figure className="ev-manuscript-figure">
        <a href="/images/research/manuscript-figure-17-fold-verification.png" target="_blank" rel="noreferrer" aria-label="Open the manuscript fold verification figure at full size">
          <img src="/images/research/manuscript-figure-17-fold-verification.png" width="1976" height="812" loading="lazy" alt="Manuscript Figure 17: two stationary roots separate from a fold as radial offset increases; their squared separation follows the derivative prediction, with numerical roots plotted as circles." />
        </a>
        <figcaption><span>From our manuscript · Figure 17, p. 19</span>The scalar-model root pair and separation check. The plot rounds the reported slope difference to 0.00135%. <a href="/images/research/manuscript-figure-17-fold-verification.png" target="_blank" rel="noreferrer">View full size <span aria-hidden="true">↗</span></a></figcaption>
      </figure>
      <div className="ev-fold-grid">
        <div className="ev-fold-location"><p className="ev-kicker">Recomputed location</p><ResearchMath display>{String.raw`\begin{aligned}\rho_c&=${scalarFold.radiusKm}\,\mathrm{km}\\\varphi_c&=${scalarFold.angleDegrees}^{\circ}\end{aligned}`}</ResearchMath><div className="ev-root-counts"><div><span>−0.01 km from the fold</span><strong>0 <small>local roots</small></strong></div><div><span>+0.01 km from the fold</span><strong>2 <small>local roots</small></strong></div></div></div>
        <div className="ev-fold-slope"><p className="ev-kicker">Squared separation law</p><ResearchMath display>{String.raw`\left|\varphi_+-\varphi_-\right|^2\approx m\mu`}</ResearchMath><dl><div><dt>Predicted slope</dt><dd>{scalarFold.predictedSlope.toFixed(8)}</dd></div><div><dt>Measured slope</dt><dd>{scalarFold.measuredSlope.toFixed(8)}</dd></div></dl><p className="ev-slope-unit"><ResearchMath>{String.raw`\mathrm{deg}^2/\mathrm{km}`}</ResearchMath></p><p className="ev-slope-match"><strong>{scalarFold.relativeSlopeDifferencePercent}%</strong> reported relative difference</p></div>
      </div>
      <p>The close agreement supports a local fold in the stated scalar convention. The generic derivative conditions are:</p>
      <ResearchMath display>{String.raw`\Phi_{\varphi}=\Phi_{\varphi\varphi}=0,\qquad\Phi_{\varphi\varphi\varphi}\ne0,\quad\Phi_{\varphi\rho}\ne0`}</ResearchMath>
      <details className="ev-details"><summary>Derivative values &amp; geometry <span aria-hidden="true">+</span></summary><div className="ev-detail-body"><p>Reported derivative values use kilometres and radians:</p><ResearchMath display>{String.raw`\begin{aligned}\Phi_{\varphi}&=${scientificTex(scalarFold.phaseAngularDerivative)}\\\Phi_{\varphi\varphi}&=${scientificTex(scalarFold.phaseSecondAngularDerivative)}\\\Phi_{\varphi\varphi\varphi}&=${scalarFold.phaseThirdAngularDerivative}\\\Phi_{\varphi\rho}&=${scientificTex(scalarFold.phaseMixedDerivative)}\end{aligned}`}</ResearchMath><p>The two displayed slopes are rounded; the relative difference is the manuscript’s reported value. These summary values do not supply a measured root trajectory.</p><ScalarConditions /></div></details>
      <p className="ev-experiment-source">Team manuscript · Table 2, pp. 18–19</p>
    </div>
  </details>
}

function IdentityEvidence() {
  return <details className="ev-supporting-experiment">
    <summary><span className="ev-supporting-number" aria-hidden="true">B</span><span><span className="ev-kicker">Check the tracking</span><strong>Does each root keep its identity?</strong><span className="ev-supporting-description">Separate a better association from a better integral.</span></span><span className="ev-disclosure-plus" aria-hidden="true">+</span></summary>
    <div className="ev-experiment-body">
      <p>Two nearby roots can both choose the same predecessor if each makes an independent nearest-neighbour match. A one-to-one assignment resolves that competition within a fixed distance gate.</p>
      <figure className="ev-manuscript-figure">
        <a href="/images/research/manuscript-figure-16-branch-matching.png" target="_blank" rel="noreferrer" aria-label="Open the manuscript branch matching figure at full size">
          <img src="/images/research/manuscript-figure-16-branch-matching.png" width="1496" height="644" loading="lazy" alt="Manuscript Figure 16: independent matching creates dashed wrong links between two synthetic root tracks; global one-to-one matching preserves two separate tracks." />
        </a>
        <figcaption><span>From our manuscript · Figure 16, p. 17</span>The first five samples of the synthetic close-track test. The counts below cover all ten samples. <a href="/images/research/manuscript-figure-16-branch-matching.png" target="_blank" rel="noreferrer">View full size <span aria-hidden="true">↗</span></a></figcaption>
      </figure>
      <div className="ev-identity-comparison"><div><span>Close parallel tracks · independent matching</span><strong>9 wrong links</strong><p>and 9 false unmatched-predecessor flags</p></div><span aria-hidden="true">→</span><div><span>Same roots · one-to-one assignment</span><strong>0 wrong links</strong><p>and 0 false unmatched-predecessor flags</p></div></div>
      <p>This improves which root is linked to which. Relabelling the same roots changes their complex sum by at most <ResearchMath>{String.raw`8.88\times10^{-16}`}</ResearchMath>, at rounding scale. The local-integral improvement above requires the additional integration step.</p>
      <div className="ev-table-scroll ev-identity-table" tabIndex={0} role="region" aria-label="Five synthetic matching cases, horizontally scrollable"><table><caption>Five synthetic cases · 10 samples each · 0.28-radian gate · no observational noise</caption><thead><tr><th scope="col">Case</th><th scope="col">Independent matching</th><th scope="col">One-to-one assignment</th><th scope="col">Assignment + prediction</th></tr></thead><tbody>{branchCases.map(item => <tr key={item.name}><th scope="row">{item.name}</th><td>{item.independent}</td><td>{item.assignment}</td><td>{item.predicted}</td></tr>)}</tbody></table></div>
      <p>Prediction made no further improvement in these five cases. When motion exceeded the gate, all methods lost three identities—a case that calls for finer sampling or a recovery step.</p>
      <details className="ev-details"><summary>How the matching comparison works <span aria-hidden="true">+</span></summary><div className="ev-detail-body"><p>Every method receives identical candidate roots. Known identities are used only to assess the links; the random seed changes root order. Assignment first maximizes links within the gate, then minimizes total squared circular distance.</p><p>The test evaluates association between samples, not ring-profile reconstruction. An unmatched root can be a missed solution; it does not establish a physical merger.</p></div></details>
      <p className="ev-experiment-source">Team manuscript · §4, pp. 17–18</p>
    </div>
  </details>
}

export default function ResearchEvidence() {
  const id = useId()
  return <section id="research-results" className="research-evidence glass-panel" aria-labelledby={`${id}-title`}>
    <div className="ev-heading"><p className="ev-kicker">03 / The evidence</p><h2 id={`${id}-title`}>One difficult point.<br /><em>A different calculation.</em></h2><p>Follow one example, then open the checks that support it.</p></div>
    <IntegralEvidence />
    <div className="ev-supporting-heading"><h3>Two checks behind the result.</h3><p>Open either experiment to follow the reasoning.</p></div>
    <div className="ev-supporting-list"><FoldEvidence /><IdentityEvidence /></div>
    <p className="ev-source">Reported evidence from our team’s working manuscript, §§4–6, pp. 17–20. The controls explore those results; the website does not rerun the research solver.</p>
  </section>
}
