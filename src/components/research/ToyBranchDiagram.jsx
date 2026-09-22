import { useId, useMemo, useState } from 'react'
import { toyFold, toyRoots } from './toyBranchMath.js'

const plot = { width: 660, height: 350, left: 45, right: 20, top: 20, bottom: 38 }
const xPosition = (value) => plot.left + ((value + 8) / 10) * (plot.width - plot.left - plot.right)
const yPosition = (value) => plot.top + ((4 - value) / 8) * (plot.height - plot.top - plot.bottom)
const path = (points) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${xPosition(x).toFixed(2)},${yPosition(y).toFixed(2)}`).join(' ')

export default function ToyBranchDiagram() {
  const [selectedX, setSelectedX] = useState(-3)
  const titleId = useId()
  const paths = useMemo(() => {
    const branches = [[], [], []]
    for (let i = 0; i <= 300; i += 1) {
      const x = -8 + i / 30
      const roots = toyRoots(x)
      branches[2].push([x, roots.at(-1)])
      if (roots.length === 3) {
        branches[0].push([x, roots[0]])
        branches[1].push([x, roots[1]])
      }
    }
    branches[0].push([toyFold.x, toyFold.y])
    branches[1].push([toyFold.x, toyFold.y])
    return branches.map(path)
  }, [])
  const roots = toyRoots(selectedX)
  const atFold = Math.abs(selectedX - toyFold.x) < 1e-10
  return (
    <figure className="toy-branch-diagram">
      <p className="eyebrow">Illustrative model · dimensionless variables</p>
      <p className="toy-equation">F(x, y) = y³ + xy − 1 = 0</p>
      <div className="toy-controls">
        <label htmlFor={titleId}>Parameter x = {selectedX.toFixed(4)}
          <input id={titleId} type="range" min="-8" max="2" step="0.01" value={selectedX} onChange={(event) => setSelectedX(Number(event.target.value))} />
        </label>
        <button className="button button-secondary" type="button" onClick={() => setSelectedX(toyFold.x)}>Select the fold</button>
      </div>
      <svg viewBox={`0 0 ${plot.width} ${plot.height}`} role="img" aria-label={`Illustrative cubic branch diagram at x ${selectedX.toFixed(4)}, ${roots.length} distinct real roots`}>
        {[-8, -6, -4, -2, 0, 2].map((x) => <g key={x}>
          <line className="toy-grid" x1={xPosition(x)} x2={xPosition(x)} y1={plot.top} y2={plot.height - plot.bottom} />
          <text x={xPosition(x)} y={plot.height - 17} textAnchor="middle">{x}</text>
        </g>)}
        {[-4, -2, 0, 2, 4].map((y) => <g key={y}>
          <line className="toy-grid" x1={plot.left} x2={plot.width - plot.right} y1={yPosition(y)} y2={yPosition(y)} />
          <text x={plot.left - 12} y={yPosition(y) + 4} textAnchor="end">{y}</text>
        </g>)}
        <text x={plot.width - 8} y={plot.height - 17}>x</text>
        <text x={10} y={14}>y</text>
        {paths.map((d, index) => <path key={index} className="toy-branch" d={d} />)}
        <line className="toy-slice" x1={xPosition(selectedX)} x2={xPosition(selectedX)} y1={plot.top} y2={plot.height - plot.bottom} />
        {roots.map((y) => <circle key={y} className="toy-root" cx={xPosition(selectedX)} cy={yPosition(y)} r="5" />)}
        <circle className="toy-fold" cx={xPosition(toyFold.x)} cy={yPosition(toyFold.y)} r="6" />
      </svg>
      <figcaption aria-live="polite">
        <strong>{atFold ? 'Two distinct real roots: one simple and one double.' : `${roots.length} distinct real ${roots.length === 1 ? 'root' : 'roots'}.`}</strong>
        {' '}y = {roots.map((value) => value.toFixed(6)).join(', ')}.
        <span>Teaching model retained from the project’s earlier Toy Branch Diagram. These are solutions of the cubic above, not Cassini measurements or research outputs.</span>
      </figcaption>
    </figure>
  )
}
