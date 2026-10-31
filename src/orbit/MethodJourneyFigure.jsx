import { useId, useState } from 'react'
import { toyFold, toyRoots } from '../components/research/toyBranchMath.js'
import ResearchMath from './ResearchMath.jsx'

const plot = { width: 720, height: 365, left: 50, right: 22, top: 27, bottom: 41 }
const xPosition = value => plot.left + ((value + 8) / 10) * (plot.width - plot.left - plot.right)
const yPosition = value => plot.top + ((4 - value) / 8) * (plot.height - plot.top - plot.bottom)
const toPath = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${xPosition(x).toFixed(2)},${yPosition(y).toFixed(2)}`).join(' ')
const branches = [[], [], []]
for (let step = 0; step <= 400; step += 1) {
  const x = -8 + step / 40
  const roots = toyRoots(x)
  branches[2].push([x, roots.at(-1)])
  if (roots.length === 3) { branches[0].push([x, roots[0]]); branches[1].push([x, roots[1]]) }
}
branches[0].push([toyFold.x, toyFold.y])
branches[1].push([toyFold.x, toyFold.y])
const paths = branches.map(toPath)
const moments = [{ value: -3, label: 'Before the fold' }, { value: toyFold.x, label: 'At the fold' }, { value: -1, label: 'Beyond the fold' }]

export default function MethodJourneyFigure() {
  const [selectedX, setSelectedX] = useState(-3)
  const id = useId()
  const roots = toyRoots(selectedX)
  const atFold = Math.abs(selectedX - toyFold.x) < 1e-10
  const state = atFold ? 'Two branches meet.' : selectedX < toyFold.x ? 'Three roots, three paths.' : 'The real pair is gone.'
  const explanation = atFold
    ? 'The two lower branches touch at one double root. Along the full solution curve, the parameter turns here.'
    : selectedX < toyFold.x
      ? 'The vertical line meets three branches. Each intersection is a solution at this parameter; following a branch preserves the connection between nearby solutions.'
      : 'Only the upper real root remains at this parameter. The folded curve continues back toward smaller parameter values; it does not continue forward as two real roots.'

  return <figure className="research-method-figure" aria-labelledby={`${id}-title`}>
    <div className="research-method-figure-intro"><div><p className="research-method-mini-label">A teaching model</p><h3 id={`${id}-title`}>When two paths become one.</h3><p>Here, a simple cubic makes the geometry visible.</p></div><ResearchMath display>{String.raw`y^3+xy-1=0`}</ResearchMath></div>
    <div className="research-method-moments" aria-label="Choose a point in the branch story">
      {moments.map(moment => <button key={moment.label} type="button" aria-pressed={Math.abs(selectedX - moment.value) < 1e-10} onClick={() => setSelectedX(moment.value)}>{moment.label}</button>)}
    </div>
    <div className="research-method-figure-layout">
      <div className="research-method-chart">
        <div className="research-method-chart-scroll" tabIndex={0} role="region" aria-label="Teaching plot of real solution branches, horizontally scrollable on smaller screens">
        <svg viewBox={`0 0 ${plot.width} ${plot.height}`} role="img" aria-labelledby={`${id}-chart-title ${id}-chart-description`}>
          <title id={`${id}-chart-title`}>Real solution branches of the teaching cubic</title>
          <desc id={`${id}-chart-description`}>The horizontal axis is the dimensionless parameter x, from minus eight to two. The vertical axis is the root y, from minus four to four. At x equals {selectedX.toFixed(4)}, there are {roots.length} distinct real roots. Two lower branches meet at x approximately {toyFold.x.toFixed(4)}.</desc>
          <defs><linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bddff8" /><stop offset="1" stopColor="#7098ce" /></linearGradient></defs>
          {[-8, -6, -4, -2, 0, 2].map(x => <g key={x}><line className="research-method-grid" x1={xPosition(x)} x2={xPosition(x)} y1={plot.top} y2={plot.height - plot.bottom} /><text x={xPosition(x)} y={plot.height - 14} textAnchor="middle">{x}</text></g>)}
          {[-4, -2, 0, 2, 4].map(y => <g key={y}><line className="research-method-grid" x1={plot.left} x2={plot.width - plot.right} y1={yPosition(y)} y2={yPosition(y)} /><text x={plot.left - 15} y={yPosition(y) + 5} textAnchor="end">{y}</text></g>)}
          <text x={plot.width - 7} y={plot.height - 14} className="research-method-axis-letter">x</text><text x={15} y={17} className="research-method-axis-letter">y</text>
          {paths.map((d, index) => <path key={index} className={`research-method-branch research-method-branch-${index}`} d={d} stroke={index === 1 ? '#d8c7bd' : `url(#${id}-gradient)`} />)}
          <circle className="research-method-fold-glow" cx={xPosition(toyFold.x)} cy={yPosition(toyFold.y)} r="20" />
          <circle className="research-method-fold" cx={xPosition(toyFold.x)} cy={yPosition(toyFold.y)} r="5" />
          <text className="research-method-fold-label" x={xPosition(toyFold.x) + 14} y={yPosition(toyFold.y) + 5}>Fold</text>
          <line className="research-method-slice" x1={xPosition(selectedX)} x2={xPosition(selectedX)} y1={plot.top} y2={plot.height - plot.bottom} />
          {roots.map(y => <g key={y}><circle className="research-method-selected-glow" cx={xPosition(selectedX)} cy={yPosition(y)} r="13" /><circle className="research-method-selected-root" cx={xPosition(selectedX)} cy={yPosition(y)} r="5" /></g>)}
        </svg>
        </div>
        <label className="research-method-slider" htmlFor={`${id}-parameter`}><span>Move the parameter <ResearchMath>x</ResearchMath><output htmlFor={`${id}-parameter`}>{selectedX.toFixed(4)}</output></span><input id={`${id}-parameter`} type="range" min="-8" max="2" step="0.01" value={selectedX} aria-valuetext={`${selectedX.toFixed(4)}, ${roots.length} distinct real roots`} onChange={event => setSelectedX(Number(event.target.value))} /></label>
      </div>
      <div className="research-method-reading" aria-live="polite" aria-atomic="true"><span className="research-method-reading-count">{atFold ? '2' : roots.length}<span> distinct real roots{atFold ? ' · one is double' : ''}</span></span><h4>{state}</h4><p>{explanation}</p><p className="research-method-root-values">Root values: {roots.map(value => value.toFixed(4)).join(' · ')}</p></div>
    </div>
    <figcaption>This dimensionless teaching equation illustrates a fold. It is separate from the Cassini phase equation and from the manuscript’s numerical experiments.</figcaption>
  </figure>
}
