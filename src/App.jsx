import { useEffect, useMemo, useState } from 'react'
import './App.css'

const portalMenuItems = [
  { id: 'overview', title: 'Project Overview' },
  { id: 'background', title: 'Mission Background' },
  { id: 'math', title: 'Mathematical Framework' },
  { id: 'team', title: 'Team Members' },
  { id: 'algorithms', title: 'Algorithm Modules' },
  { id: 'gallery', title: 'Visual Gallery' },
  { id: 'data', title: 'Real Data Viewer' },
  { id: 'progress', title: 'Progress & Next Steps' },
]

function getPanelFromHash() {
  const hash = window.location.hash.replace('#', '')
  return portalMenuItems.some((item) => item.id === hash) ? hash : 'menu'
}

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

const formulaLibrary = [
  {
    title: 'Oscillatory Integral Model',
    formula: (
      <>
        <span>I(p) = ∫ A(φ; p)e</span>
        <sup>ikψ(φ; p)</sup>
        <span> dφ</span>
      </>
    ),
    purpose:
      'Represents the oscillatory integral framework behind the reconstruction problem. The amplitude A changes slowly, while the phase ψ controls rapid oscillation.',
  },
  {
    title: 'Stationary Phase Condition',
    formula: (
      <>
        <span>∂ψ / ∂φ = 0</span>
      </>
    ),
    purpose:
      'Defines stationary roots, where the phase changes slowly. These roots often dominate the contribution of the oscillatory integral.',
  },
  {
    title: 'Second Derivative Diagnostic',
    formula: (
      <>
        <span>ψ″(φ</span>
        <sub>s</sub>
        <span>; p) = ∂</span>
        <sup>2</sup>
        <span>ψ / ∂φ</span>
        <sup>2</sup>
        <span> at φ = φ</span>
        <sub>s</sub>
      </>
    ),
    purpose:
      'Measures local curvature near a stationary point. Small |ψ″| can indicate instability, caustic behavior, or a nearby bifurcation.',
  },
  {
    title: 'Local Taylor Expansion',
    formula: (
      <>
        <span>ψ(φ; p) ≈ ψ(φ</span>
        <sub>s</sub>
        <span>; p) + 1/2 ψ″(φ</span>
        <sub>s</sub>
        <span>; p)(φ − φ</span>
        <sub>s</sub>
        <span>)</span>
        <sup>2</sup>
        <span> + 1/6 ψ‴(φ</span>
        <sub>s</sub>
        <span>; p)(φ − φ</span>
        <sub>s</sub>
        <span>)</span>
        <sup>3</sup>
      </>
    ),
    purpose:
      'Approximates the phase near a stationary root and helps diagnose whether a local region is regular or nearly degenerate.',
  },
  {
    title: 'Stationary Phase Approximation',
    formula: (
      <>
        <span>I(p) ≈ A(φ</span>
        <sub>s</sub>
        <span>; p)e</span>
        <sup>ikψ(φ_s; p)</sup>
        <span> √(2π / (k |ψ″(φ</span>
        <sub>s</sub>
        <span>; p)|))</span>
      </>
    ),
    purpose:
      'Estimates the main contribution from an isolated stationary point and shows why curvature matters.',
  },
  {
    title: 'Bifurcation / Caustic Warning',
    formula: (
      <>
        <span>|ψ″(φ</span>
        <sub>s</sub>
        <span>; p)| &lt; ε</span>
        <sub>bif</sub>
      </>
    ),
    purpose: 'Flags regions where stationary roots may merge, disappear, or become difficult to track.',
  },
  {
    title: 'Newton Root-Finding Update',
    formula: (
      <>
        <span>φ</span>
        <sub>n+1</sub>
        <span> = φ</span>
        <sub>n</sub>
        <span> − f(φ</span>
        <sub>n</sub>
        <span>) / f′(φ</span>
        <sub>n</sub>
        <span>), where f(φ) = ∂ψ / ∂φ</span>
      </>
    ),
    purpose: 'Iteratively solves the stationary phase condition f(φ)=0.',
  },
  {
    title: 'Halley Root-Finding Update',
    formula: (
      <>
        <span>φ</span>
        <sub>n+1</sub>
        <span> = φ</span>
        <sub>n</sub>
        <span> − [2 f(φ</span>
        <sub>n</sub>
        <span>) f′(φ</span>
        <sub>n</sub>
        <span>)] / [2(f′(φ</span>
        <sub>n</sub>
        <span>))</span>
        <sup>2</sup>
        <span> − f(φ</span>
        <sub>n</sub>
        <span>) f″(φ</span>
        <sub>n</sub>
        <span>)]</span>
      </>
    ),
    purpose:
      'A faster root-finding method that uses second-derivative information when the initial guess is good.',
  },
  {
    title: 'Branch Output Tuple',
    formula: (
      <>
        <span>{'{ φ'}</span>
        <sub>s</sub>
        <span>, ψ, ψ″, label, flag {'}'}</span>
      </>
    ),
    purpose:
      'Stores each stationary root with its phase value, curvature, branch label, and diagnostic flag.',
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

const teamMembers = [
  {
    name: 'Dr. Ryan Maguire',
    role: 'Mentor / research advisor.',
    cardRole: 'Mentor / research advisor',
    paperSections: ['Research guidance and supervision'],
    focus: 'Provides research guidance, mathematical supervision, and project direction.',
    keyIdeas: [
      'Refining mathematical assumptions',
      'Guiding numerical strategy',
      'Supporting the team reading and research process',
    ],
    module: 'Research guidance and project overview.',
    status: 'Ongoing mentorship.',
  },
  {
    name: 'Maiya Qiu',
    role: 'Interpolation and stationary-root numerical methods.',
    cardRole: 'Interpolation and stationary-root methods',
    paperSections: [
      'Introduction',
      '1D Interpolation of the Phase for Reconstruction',
      'Numerical Methods for the Solutions to the Stationary Phase',
    ],
    focus:
      'Develops the motivation and numerical methods for improving phase approximation and root tracking.',
    keyIdeas: [
      'Radio occultation motivation',
      'C-Spline interpolation',
      'PCHIP interpolation',
      'Floater-Hormann interpolation',
      'Newton and Halley root-finding',
      'Pseudo-arclength continuation for tracking folded solution branches',
    ],
    module: 'Interpolation and root-tracking overview.',
    status: 'Algorithm design and comparison under development.',
  },
  {
    name: 'Yutong Zhao',
    role: 'Theoretical background and multivariate interpolation.',
    cardRole: 'Theory and multivariate interpolation',
    paperSections: ['Theoretical Background', 'Multivariate Interpolation'],
    focus:
      'Builds the mathematical and physical background for the reconstruction framework.',
    keyIdeas: [
      'Wave optics',
      'Huygens-Fresnel principle',
      'Fresnel diffraction',
      'Saturn ring geometry',
      'Fresnel scale',
      'Stationary phase framework',
      'Multivariate / implicit reconstruction ideas',
      'RBF-style reconstruction',
    ],
    module: 'Theory background and multivariate reconstruction overview.',
    status: 'Theory framework and multivariate methods under development.',
  },
  {
    name: 'Dell Li',
    role: 'Branch bookkeeping, local diagnostics, reliability testing, and research portal.',
    cardRole: 'Branch bookkeeping and diagnostics',
    paperSections: [
      'Abstract',
      'Branch Bookkeeping Between Root Finding and Reconstruction',
      'Local Diagnostics Near Bifurcation',
      'Reliability of the Stationary-Point Approximation and Possible Residual Contributions',
    ],
    focus:
      'Connects stationary-root finding to the reconstruction layer by organizing roots, labels, curvature, branch status, confidence scores, and validation logic.',
    keyIdeas: [
      'Branch labels',
      'Stationary-root records',
      'Second-derivative diagnostics',
      'Bifurcation warning flags',
      'Confidence score prototype',
      'Stationary-point reliability benchmark',
      'Website / research portal development',
      'Real-data viewer prototype',
    ],
    module: 'Branch record dashboard, confidence calculator, real-data viewer, and research portal.',
    status: 'Active development.',
  },
]

const progressGroups = [
  {
    title: 'Completed',
    items: [
      'React/Vite research portal',
      'GitHub + Vercel deployment',
      'NASA/JPL image gallery',
      'Team algorithm module layout',
      'Real Cassini subset data viewer',
      'Local window export prototype',
    ],
  },
  {
    title: 'In progress',
    items: [
      'More real data subsets',
      'Data comparison between multiple days',
      'Derivative diagnostics',
      'Stationary phase visualization',
      'Branch bookkeeping prototype',
    ],
  },
  {
    title: 'Next',
    items: [
      'Add Day 141 dataset',
      'Add overlay comparison',
      'Add derivative plot',
      'Add root/bifurcation toy demo',
      'Ask teammates/mentor which names and contributions can be shown publicly',
    ],
  },
]

const cassiniDataPath = '/data/cassini_day232.csv'
const cassiniXAxisColumn = 'ring_radius_km'

function parseNumericValue(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : null
}

function detectNumericColumns(rows) {
  if (!rows.length) {
    return []
  }

  return Object.keys(rows[0]).filter((column) => {
    const values = rows.map((row) => parseNumericValue(row[column])).filter((value) => value !== null)
    return values.length > 0 && values.length / rows.length > 0.8
  })
}

function chooseDefaultColumn(columns, preferredNames, fallbackIndex = 0) {
  const normalizedColumns = columns.map((column) => column.toLowerCase())
  const preferred = preferredNames
    .map((name) => normalizedColumns.findIndex((column) => column.includes(name)))
    .find((index) => index >= 0)

  return columns[preferred >= 0 ? preferred : fallbackIndex] || ''
}

function formatStat(value) {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return Math.abs(value) >= 1000 ? value.toFixed(2) : value.toPrecision(4)
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && nextCharacter === '"') {
      current += '"'
      index += 1
    } else if (character === '"') {
      inQuotes = !inQuotes
    } else if (character === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += character
    }
  }

  values.push(current)
  return values
}

function parseCsvText(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? ''
      return row
    }, {})
  })
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '')

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

function rowsToCsv(rows) {
  if (!rows.length) {
    return ''
  }

  const headers = Object.keys(rows[0])
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(','))].join('\n')
}

function NavBar({ onSelect }) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => onSelect('menu')} aria-label="Go to main menu">
        <span className="brand-mark">SR</span>
        <span>
          <strong>Saturn Rings</strong>
          <small>MIT PRIMES Math Junior</small>
        </span>
      </button>
      <nav aria-label="Main navigation">
        {portalMenuItems.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)}>
            {item.title}
          </button>
        ))}
      </nav>
    </header>
  )
}

function HeroImageCard({ onOpenModel }) {
  return (
    <figure className="visual-card hero-image-card">
      <img src="/images/cassini-occultation.jpg" alt="Cassini radio occultation context" />
      <figcaption>
        <button className="open-model-button" type="button" onClick={onOpenModel}>
          Open 3D Saturn Model
        </button>
      </figcaption>
    </figure>
  )
}

function SaturnModelModal({ onClose }) {
  return (
    <div className="saturn-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="saturn-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saturn-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="saturn-modal-header">
          <div>
            <span className="card-kicker">Interactive model</span>
            <h3 id="saturn-modal-title">Interactive Saturn 3D Model</h3>
          </div>
          <button className="model-close-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="saturn-stage">
          <model-viewer
            src="/model/Saturn.glb"
            alt="Interactive 3D model of Saturn"
            camera-controls
            auto-rotate
            exposure="1.3"
            shadow-intensity="0"
          ></model-viewer>
        </div>
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

const branchPlot = {
  xMin: -8,
  xMax: 2,
  yMin: -4,
  yMax: 4,
  width: 620,
  height: 360,
  padX: 54,
  padY: 34,
}
const branchFoldPoint = {
  x: -Math.cbrt(27 / 4),
  y: -Math.cbrt(1 / 2),
}
const branchFoldTolerance = 0.04

function branchEquation(x, y) {
  return y ** 3 + x * y - 1
}

function mapBranchPoint(x, y) {
  const { xMin, xMax, yMin, yMax, width, height, padX, padY } = branchPlot
  const innerWidth = width - padX * 2
  const innerHeight = height - padY * 2

  return {
    x: padX + ((x - xMin) / (xMax - xMin)) * innerWidth,
    y: padY + ((yMax - y) / (yMax - yMin)) * innerHeight,
  }
}

function findBranchRoots(x) {
  const yMin = -5
  const yMax = 5
  const steps = 420
  const roots = []
  let previousY = yMin
  let previousValue = branchEquation(x, previousY)

  for (let index = 1; index <= steps; index += 1) {
    const currentY = yMin + ((yMax - yMin) * index) / steps
    const currentValue = branchEquation(x, currentY)

    if (Math.abs(previousValue) < 1e-5) {
      roots.push(previousY)
    } else if (previousValue * currentValue < 0) {
      let low = previousY
      let high = currentY
      let lowValue = previousValue

      for (let step = 0; step < 34; step += 1) {
        const mid = (low + high) / 2
        const midValue = branchEquation(x, mid)

        if (lowValue * midValue <= 0) {
          high = mid
        } else {
          low = mid
          lowValue = midValue
        }
      }

      roots.push((low + high) / 2)
    }

    previousY = currentY
    previousValue = currentValue
  }

  return roots
    .sort((a, b) => a - b)
    .filter((root, index, sortedRoots) => index === 0 || Math.abs(root - sortedRoots[index - 1]) > 0.01)
}

function pointsToPath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
}

function StationaryPhaseDemo() {
  const [selectedX, setSelectedX] = useState(-3)

  const branchPaths = useMemo(() => {
    const samples = 360
    const upper = []
    const middle = []
    const lower = []

    for (let index = 0; index <= samples; index += 1) {
      const x = branchPlot.xMin + ((branchPlot.xMax - branchPlot.xMin) * index) / samples
      const roots = findBranchRoots(x)

      if (roots.length >= 3) {
        lower.push(mapBranchPoint(x, roots[0]))
        middle.push(mapBranchPoint(x, roots[1]))
        upper.push(mapBranchPoint(x, roots[2]))
      } else if (roots.length === 1) {
        upper.push(mapBranchPoint(x, roots[0]))
      }
    }

    const mappedFoldPoint = mapBranchPoint(branchFoldPoint.x, branchFoldPoint.y)
    middle.push(mappedFoldPoint)
    lower.push(mappedFoldPoint)

    return {
      upper: pointsToPath(upper),
      middle: pointsToPath(middle),
      lower: pointsToPath(lower),
      fold: mappedFoldPoint,
    }
  }, [])

  const isFoldSelected = Math.abs(selectedX - branchFoldPoint.x) <= branchFoldTolerance
  const sliceX = isFoldSelected ? branchFoldPoint.x : selectedX
  const selectedRoots = useMemo(() => findBranchRoots(sliceX), [sliceX])
  const selectedLineX = mapBranchPoint(sliceX, 0).x
  const selectedRootMarkers = isFoldSelected
    ? selectedRoots.filter((root) => Math.abs(root - branchFoldPoint.y) > 0.05)
    : selectedRoots
  const rootCountLabel = isFoldSelected
    ? 'Fold point: double root'
    : selectedRoots.length === 3
      ? '3 real roots'
      : '1 real root'
  const verticalGrid = [-8, -6, -4, -2, 0, 2]
  const horizontalGrid = [-4, -2, 0, 2, 4]

  return (
    <Section
      id="stationary-demo"
      eyebrow="03 / Toy Demo"
      title="Toy Branch Diagram: Multi-Root Structure"
      className="demo-section"
    >
      <div className="branch-demo-panel">
        <div className="branch-demo-copy">
          <span className="card-kicker">Branch tracking intuition</span>
          <h3>Folded solution branches</h3>
          <p>
            This toy model visualizes how the number of real solution branches changes near
            a fold-like region. It is not Cassini data; it is a simplified diagram for
            branch tracking intuition.
          </p>
          <div className="branch-equation">
            <span>y</span>
            <sup>3</sup>
            <span> + xy = 1</span>
          </div>
          <label className="branch-slider">
            <span>x = {selectedX.toFixed(2)}</span>
            <input
              type="range"
              min={branchPlot.xMin}
              max={branchPlot.xMax}
              step="0.01"
              value={selectedX}
              onChange={(event) => setSelectedX(Number(event.target.value))}
            />
          </label>
          <div className="root-count-pill">{rootCountLabel}</div>
        </div>
        <div className="branch-demo-plot" aria-label="Implicit branch diagram for y cubed plus x y equals one">
          <svg className="branch-svg" viewBox={`0 0 ${branchPlot.width} ${branchPlot.height}`} role="img">
            <title>Implicit branch diagram for y cubed plus x y equals one</title>
            {verticalGrid.map((xValue) => {
              const point = mapBranchPoint(xValue, 0)
              return (
                <line
                  className="branch-grid-line"
                  x1={point.x}
                  x2={point.x}
                  y1={branchPlot.padY}
                  y2={branchPlot.height - branchPlot.padY}
                  key={`x-${xValue}`}
                />
              )
            })}
            {horizontalGrid.map((yValue) => {
              const point = mapBranchPoint(0, yValue)
              return (
                <line
                  className="branch-grid-line"
                  x1={branchPlot.padX}
                  x2={branchPlot.width - branchPlot.padX}
                  y1={point.y}
                  y2={point.y}
                  key={`y-${yValue}`}
                />
              )
            })}
            <line
              className="branch-axis"
              x1={branchPlot.padX}
              x2={branchPlot.width - branchPlot.padX}
              y1={mapBranchPoint(0, 0).y}
              y2={mapBranchPoint(0, 0).y}
            />
            <line
              className="branch-axis"
              x1={mapBranchPoint(0, 0).x}
              x2={mapBranchPoint(0, 0).x}
              y1={branchPlot.padY}
              y2={branchPlot.height - branchPlot.padY}
            />
            <text className="branch-axis-label" x={branchPlot.width - branchPlot.padX + 10} y={mapBranchPoint(0, 0).y - 8}>
              x
            </text>
            <text className="branch-axis-label" x={mapBranchPoint(0, 0).x + 8} y={branchPlot.padY + 14}>
              y
            </text>
            <path className="branch-path branch-upper" d={branchPaths.upper} />
            <path className="branch-path branch-middle" d={branchPaths.middle} />
            <path className="branch-path branch-lower" d={branchPaths.lower} />
            <line
              className="branch-slice-line"
              x1={selectedLineX}
              x2={selectedLineX}
              y1={branchPlot.padY}
              y2={branchPlot.height - branchPlot.padY}
            />
            {selectedRootMarkers.map((root) => {
              const point = mapBranchPoint(sliceX, root)
              return <circle className="branch-root-dot" cx={point.x} cy={point.y} r="4.5" key={root.toFixed(5)} />
            })}
            <circle
              className={`branch-fold-dot${isFoldSelected ? ' active' : ''}`}
              cx={branchPaths.fold.x}
              cy={branchPaths.fold.y}
              r={isFoldSelected ? '5.2' : '4.2'}
            />
            {isFoldSelected && (
              <text className="branch-double-root-label" x={branchPaths.fold.x + 10} y={branchPaths.fold.y - 10}>
                double root
              </text>
            )}
          </svg>
          <div className="branch-plot-caption">F(x, y) = y³ + xy − 1 = 0</div>
        </div>
      </div>
    </Section>
  )
}

function CassiniDataViewer() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [yColumn, setYColumn] = useState('')
  const [windowMin, setWindowMin] = useState('')
  const [windowMax, setWindowMax] = useState('')

  const numericColumns = useMemo(() => detectNumericColumns(rows), [rows])
  const yColumns = useMemo(
    () => numericColumns.filter((column) => column !== cassiniXAxisColumn),
    [numericColumns],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadDataset() {
      setIsLoading(true)
      setError('')
      setRows([])

      try {
        const response = await fetch(cassiniDataPath)

        if (!response.ok) {
          throw new Error(`Could not load ${cassiniDataPath}. Check that the CSV exists in public/data.`)
        }

        const csvText = await response.text()
        const parsedRows = parseCsvText(csvText).filter((row) => Object.values(row).some((value) => value !== ''))

        if (!parsedRows.length) {
          throw new Error('The selected CSV loaded, but it did not contain any data rows.')
        }

        if (!isCancelled) {
          setRows(parsedRows)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message || 'Unable to load the selected Cassini dataset.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDataset()

    return () => {
      isCancelled = true
    }
  }, [])

  const activeXColumn = numericColumns.includes(cassiniXAxisColumn) ? cassiniXAxisColumn : ''
  const defaultYColumn = chooseDefaultColumn(yColumns, ['normal_optical_depth', 'optical_depth'], 0)
  const activeYColumn = yColumns.includes(yColumn) ? yColumn : defaultYColumn

  const numericData = useMemo(() => {
    if (!activeXColumn || !activeYColumn) {
      return []
    }

    return rows
      .map((row) => ({
        row,
        x: parseNumericValue(row[activeXColumn]),
        y: parseNumericValue(row[activeYColumn]),
      }))
      .filter(({ x, y }) => x !== null && y !== null)
  }, [rows, activeXColumn, activeYColumn])

  const xExtent = useMemo(() => {
    if (!numericData.length) {
      return { min: null, max: null }
    }

    const values = numericData.map((point) => point.x)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [numericData])

  const filteredData = useMemo(() => {
    const min = windowMin === '' ? xExtent.min : parseNumericValue(windowMin)
    const max = windowMax === '' ? xExtent.max : parseNumericValue(windowMax)

    return numericData.filter(({ x }) => {
      const aboveMin = min === null || x >= min
      const belowMax = max === null || x <= max
      return aboveMin && belowMax
    })
  }, [numericData, windowMin, windowMax, xExtent])

  const summary = useMemo(() => {
    if (!filteredData.length) {
      return null
    }

    const xValues = filteredData.map((point) => point.x)
    const yValues = filteredData.map((point) => point.y)
    const yMean = yValues.reduce((sum, value) => sum + value, 0) / yValues.length
    const variance = yValues.reduce((sum, value) => sum + (value - yMean) ** 2, 0) / yValues.length

    return {
      count: filteredData.length,
      xMin: Math.min(...xValues),
      xMax: Math.max(...xValues),
      yMin: Math.min(...yValues),
      yMax: Math.max(...yValues),
      yMean,
      yStd: Math.sqrt(variance),
    }
  }, [filteredData])

  const chart = useMemo(() => {
    if (!summary || filteredData.length < 2) {
      return { points: [], path: '' }
    }

    const width = 760
    const height = 320
    const padding = { left: 54, right: 22, top: 24, bottom: 46 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom
    const xSpan = summary.xMax - summary.xMin || 1
    const ySpan = summary.yMax - summary.yMin || 1

    const points = filteredData.map((point) => ({
      ...point,
      svgX: padding.left + ((point.x - summary.xMin) / xSpan) * innerWidth,
      svgY: padding.top + (1 - (point.y - summary.yMin) / ySpan) * innerHeight,
    }))

    return {
      points,
      path: points.map((point) => `${point.svgX.toFixed(2)},${point.svgY.toFixed(2)}`).join(' '),
    }
  }, [filteredData, summary])

  function resetWindow() {
    if (xExtent.min === null || xExtent.max === null) {
      return
    }

    setWindowMin(String(xExtent.min))
    setWindowMax(String(xExtent.max))
  }

  function downloadSelectedWindow() {
    if (!filteredData.length) {
      return
    }

    const csv = rowsToCsv(filteredData.map((point) => point.row))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cassini_day232_window.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="data-viewer">
      <div className="data-viewer-header">
        <div>
          <span className="coming-soon">Live prototype</span>
          <h3>Cassini Data Viewer</h3>
          <p>
            Explore the Day 232 public CSV sample in a local radial window. This
            front-end viewer is intended for inspection and visualization, not for
            claiming new reconstruction results.
          </p>
        </div>
      </div>

      <div className="viewer-controls">
        <div className="dataset-badge">
          <span>Dataset</span>
          <strong>Cassini Day 232</strong>
        </div>
        <div className="dataset-badge">
          <span>X-axis</span>
          <strong>{cassiniXAxisColumn}</strong>
        </div>
        <label>
          <span>Y-axis</span>
          <select value={activeYColumn} onChange={(event) => setYColumn(event.target.value)} disabled={!yColumns.length}>
            {yColumns.map((column) => (
              <option value={column} key={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Window minimum</span>
          <input type="number" value={windowMin} onChange={(event) => setWindowMin(event.target.value)} />
        </label>
        <label>
          <span>Window maximum</span>
          <input type="number" value={windowMax} onChange={(event) => setWindowMax(event.target.value)} />
        </label>
        <button className="reset-window" type="button" onClick={resetWindow} disabled={xExtent.min === null}>
          Reset view
        </button>
      </div>

      {error && <div className="viewer-message">{error}</div>}
      {!error && !numericColumns.length && !isLoading && (
        <div className="viewer-message">No numeric columns were detected in this CSV.</div>
      )}
      {!error && numericColumns.length > 0 && !activeXColumn && (
        <div className="viewer-message">The CSV loaded, but it does not include the required ring_radius_km column.</div>
      )}

      <div className="viewer-count-label">
        Showing {filteredData.length} of total {numericData.length} points
      </div>
      {filteredData.length > 0 && filteredData.length < 2 && (
        <div className="viewer-message compact">Selected window is too small to plot.</div>
      )}

      <div className="viewer-plot-card">
        {isLoading ? (
          <div className="viewer-placeholder">Loading Cassini CSV data…</div>
        ) : (
          <svg className="data-svg" viewBox="0 0 760 320" role="img">
            <title>
              Cassini Day 232: {activeXColumn} versus {activeYColumn}
            </title>
            <path className="data-grid-line" d="M54 24 V274 M225 24 V274 M396 24 V274 M567 24 V274 M738 24 V274" />
            <path className="data-grid-line" d="M54 24 H738 M54 86.5 H738 M54 149 H738 M54 211.5 H738 M54 274 H738" />
            <path className="data-axis" d="M54 24 V274 H738" />
            {chart.path && <polyline className="data-line" points={chart.path} />}
            {chart.points.map((point, index) => (
              <circle className="data-point" cx={point.svgX} cy={point.svgY} r="3.5" key={`${point.x}-${index}`}>
                <title>
                  {activeXColumn}: {formatStat(point.x)}
                  {'\n'}
                  {activeYColumn}: {formatStat(point.y)}
                </title>
              </circle>
            ))}
            <text className="data-axis-label" x="396" y="309">
              {activeXColumn || 'x'}
            </text>
            <text className="data-axis-label y" x="-149" y="18">
              {activeYColumn || 'y'}
            </text>
            <text className="data-tick" x="54" y="294">
              {formatStat(summary?.xMin)}
            </text>
            <text className="data-tick end" x="738" y="294">
              {formatStat(summary?.xMax)}
            </text>
            <text className="data-tick" x="12" y="278">
              {formatStat(summary?.yMin)}
            </text>
            <text className="data-tick" x="12" y="30">
              {formatStat(summary?.yMax)}
            </text>
          </svg>
        )}
      </div>

      <div className="viewer-summary">
        <div>
          <span>Points</span>
          <strong>{summary ? summary.count : 0}</strong>
        </div>
        <div>
          <span>X min / max</span>
          <strong>
            {formatStat(summary?.xMin)} / {formatStat(summary?.xMax)}
          </strong>
        </div>
        <div>
          <span>Y min / max</span>
          <strong>
            {formatStat(summary?.yMin)} / {formatStat(summary?.yMax)}
          </strong>
        </div>
        <div>
          <span>Y mean</span>
          <strong>{formatStat(summary?.yMean)}</strong>
        </div>
        <div>
          <span>Y std. dev.</span>
          <strong>{formatStat(summary?.yStd)}</strong>
        </div>
      </div>

      <button className="download-window" type="button" onClick={downloadSelectedWindow} disabled={!filteredData.length}>
        Export Local Window CSV
      </button>
      <p className="download-helper">
        Exports only the currently selected radial window for follow-up reconstruction or diagnostics.
      </p>
    </div>
  )
}

function App() {
  const [activePanel, setActivePanel] = useState(() => getPanelFromHash())
  const [selectedPipelineIndex, setSelectedPipelineIndex] = useState(0)
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)
  const [isSaturnModelOpen, setIsSaturnModelOpen] = useState(false)
  const selectedPipelineStep = pipelineSteps[selectedPipelineIndex]
  const selectedMember = teamMembers[selectedMemberIndex]

  function openPanel(panelId) {
    setActivePanel(panelId)
    if (panelId === 'menu') {
      window.history.pushState(null, '', window.location.pathname)
    } else {
      window.history.pushState(null, '', `#${panelId}`)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    function handleHashChange() {
      setActivePanel(getPanelFromHash())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
    }
  }, [])

  function goBackToMenu() {
    openPanel('menu')
  }

  function PanelShell({ children }) {
    return (
      <div className="portal-panel-wrap">
        <button className="back-button" type="button" onClick={goBackToMenu}>
          ← Back to Main Menu
        </button>
        {children}
      </div>
    )
  }

  function renderMenu() {
    return (
      <section className="hero section portal-home">
        <div className="hero-copy">
          <p className="eyebrow">Research Portal</p>
          <h1>Mathematics of Saturn Ring Occultations</h1>
        </div>
        <HeroImageCard onOpenModel={() => setIsSaturnModelOpen(true)} />
        <div className="portal-menu" aria-label="Research portal main menu">
          {portalMenuItems.map((item) => (
            <button className="portal-menu-card" type="button" key={item.id} onClick={() => openPanel(item.id)}>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </section>
    )
  }

  function renderOverview() {
    return (
      <PanelShell>
        <Section id="overview" eyebrow="01 / Overview" title="Project Overview">
          <div className="two-column">
            <p>
              This portal presents an MIT PRIMES Math Junior project about how radio
              occultation measurements can support careful study of Saturn’s rings. The
              focus is mathematical structure, visualization, and local diagnostic tools.
            </p>
            <p>
              The current site is a research-support interface. It uses public or
              schematic material only, avoids unpublished PRIMES data, and does not claim
              final reconstruction results.
            </p>
          </div>
          <div className="contribution-panel portal-spaced">
            <div>
              <h3>Current role of the portal</h3>
              <p>
                The portal organizes background, algorithms, image references, and local
                radial-window tools so the research can be inspected in focused modules.
              </p>
            </div>
            <ul>
              {contributions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderBackground() {
    return (
      <PanelShell>
        <Section id="background" eyebrow="02 / Mission Context" title="Radio Occultation as a Window into Rings">
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
              diffraction, phase, and numerical reconstruction all matter.
            </p>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderMath() {
    return (
      <PanelShell>
        <Section id="math" eyebrow="03 / Mathematical Framework" title="Stationary Phase and Caustic Regions">
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
          <div className="formula-library">
            <div className="formula-library-heading">
              <h3>Formula Library</h3>
              <p>
                These formulas summarize the mathematical objects used throughout the portal:
                oscillatory integrals, stationary roots, curvature diagnostics, root-finding,
                and branch bookkeeping.
              </p>
            </div>
            <div className="formula-panel">
              {formulaLibrary.map((item, index) => (
                <article className="formula-row" key={item.title}>
                  <div className="formula-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="formula-main">
                    <h4>{item.title}</h4>
                    <div className="formula-expression">{item.formula}</div>
                    <p className="formula-purpose">{item.purpose}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Section>
        <StationaryPhaseDemo />
      </PanelShell>
    )
  }

  function renderTeam() {
    return (
      <PanelShell>
        <Section id="team" eyebrow="04 / Team Members" title="Paper-Based Contribution Dashboard">
          <div className="team-layout">
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <button
                  className={`member-card${selectedMemberIndex === index ? ' active' : ''}`}
                  type="button"
                  key={member.name}
                  onClick={() => setSelectedMemberIndex(index)}
                >
                  <h3>{member.name}</h3>
                  <p>{member.cardRole}</p>
                </button>
              ))}
            </div>
            <article className="member-detail">
              <span className="card-kicker">Selected member</span>
              <h3>{selectedMember.name}</h3>
              <div className="member-detail-grid">
                <section>
                  <h4>Role</h4>
                  <p>{selectedMember.role}</p>
                </section>
                <section>
                  <h4>Paper sections</h4>
                  <ul>
                    {selectedMember.paperSections.map((section) => (
                      <li key={section}>{section}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4>Focus</h4>
                  <p>{selectedMember.focus}</p>
                </section>
                <section>
                  <h4>Key ideas</h4>
                  <ul>
                    {selectedMember.keyIdeas.map((idea) => (
                      <li key={idea}>{idea}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4>Website module</h4>
                  <p>{selectedMember.module}</p>
                </section>
                <section>
                  <h4>Status</h4>
                  <p>{selectedMember.status}</p>
                </section>
              </div>
            </article>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderAlgorithms() {
    const relatedMembers = ['Member C', 'Member A', 'Dell', 'Member B', 'Member B', 'Dell']
    const statuses = [
      'Reference module in progress.',
      'Prototype workflow.',
      'Active implementation.',
      'Research prototype.',
      'Early diagnostic design.',
      'Visualization prototype.',
    ]

    return (
      <PanelShell>
        <Section id="pipeline" eyebrow="05 / Algorithm Modules" title="Team Algorithm Modules">
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
            <span className="card-kicker">Selected module</span>
            <h3>{selectedPipelineStep.title}</h3>
            <div className="detail-grid">
              <p><strong>Goal:</strong> {selectedPipelineStep.does}</p>
              <p><strong>Input / output:</strong> {selectedPipelineStep.io}</p>
              <p><strong>Current status:</strong> {statuses[selectedPipelineIndex]}</p>
              <p><strong>Related team member:</strong> {relatedMembers[selectedPipelineIndex]}</p>
            </div>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderGallery() {
    return (
      <PanelShell>
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
      </PanelShell>
    )
  }

  function renderDataViewer() {
    return (
      <PanelShell>
        <Section id="tool" eyebrow="07 / Real Data Viewer" title="Cassini Data Viewer">
          <p className="gallery-intro">
            This tool lets the team inspect a local radial window, compute basic
            statistics, and export a selected window for follow-up reconstruction or
            diagnostics.
          </p>
          <CassiniDataViewer />
        </Section>
      </PanelShell>
    )
  }

  function renderProgress() {
    return (
      <PanelShell>
        <Section id="progress" eyebrow="08 / Progress" title="Progress & Next Steps">
          <div className="progress-grid">
            {progressGroups.map((group) => (
              <article className="progress-card" key={group.title}>
                <span className="card-kicker">{group.title}</span>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderActivePanel() {
    if (activePanel === 'menu') return renderMenu()
    if (activePanel === 'overview') return renderOverview()
    if (activePanel === 'background') return renderBackground()
    if (activePanel === 'math') return renderMath()
    if (activePanel === 'team') return renderTeam()
    if (activePanel === 'algorithms') return renderAlgorithms()
    if (activePanel === 'gallery') return renderGallery()
    if (activePanel === 'data') return renderDataViewer()
    if (activePanel === 'progress') return renderProgress()
    return renderMenu()
  }

  return (
    <div className="app-shell" id="top">
      <NavBar onSelect={openPanel} />
      <main>{renderActivePanel()}</main>
      {isSaturnModelOpen && <SaturnModelModal onClose={() => setIsSaturnModelOpen(false)} />}
      {activePanel !== 'menu' && (
        <footer className="site-footer">
          <p>
            Research portfolio for an MIT PRIMES Math Junior project. Public imagery and
            sample data are used for context; unpublished PRIMES data is not displayed.
          </p>
        </footer>
      )}
    </div>
  )
}

export default App
