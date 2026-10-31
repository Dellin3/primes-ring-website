import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { explorerHref, formatObservationDate, findObservation, mapObservation, mapWindow, observedSpan, ringRegions, shortName } from '../content/rings.js'

const DOMAIN = [58000, 142000]
const LEFT = 40, RIGHT = 960
const SATURN_EQUATOR_KM = 60268
const BAND_TOP = 92, BAND_HEIGHT = 50
const x = radius => LEFT + (Math.min(Math.max(radius, DOMAIN[0]), DOMAIN[1]) - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0]) * (RIGHT - LEFT)
const km = value => Math.round(value).toLocaleString('en-US')
// Shading follows the PDS table’s typical optical depth: denser rings are brighter.
const shade = { 'd-ring': .1, 'c-ring': .3, 'b-ring': .85, 'cassini-division': .16, 'a-ring': .55, 'f-ring': .4 }
const labelled = { 'd-ring': 'D', 'c-ring': 'C ring', 'b-ring': 'B ring', 'cassini-division': 'Cassini Division', 'a-ring': 'A ring', 'f-ring': 'F' }
const gapLabelRow = { 'keeler-gap': 184 }

// Defined at module level so React keeps the same element (and keyboard focus)
// when the highlighted region changes.
function RegionLink({ region, focusBox, onOpen, onActive, children }) {
  const range = mapWindow(region)
  if (!range) return <g>{children}</g>
  const href = explorerHref(mapObservation, range)
  return <a href={href} aria-label={`Open the ${region.name} (${km(region.inner)}–${km(region.outer)} km) in the data explorer`} onClick={event => onOpen(event, href)} onMouseEnter={() => onActive(region.id)} onMouseLeave={() => onActive(null)} onFocus={() => onActive(region.id)} onBlur={() => onActive(null)}>
    {children}
    <rect className="ring-focus" x={focusBox[0]} y={BAND_TOP - 6} width={focusBox[1]} height={BAND_HEIGHT + 12} rx="3" />
  </a>
}

export default function RingMap() {
  const navigate = useNavigate()
  const [active, setActive] = useState(null)
  const observation = findObservation(mapObservation)
  const visible = ringRegions.filter(region => region.inner < DOMAIN[1] && region.kind !== 'faint')
  const bands = visible.filter(region => region.kind !== 'gap')
  const gaps = visible.filter(region => region.kind === 'gap')
  const current = ringRegions.find(region => region.id === active)
  function open(event, href) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return
    event.preventDefault()
    navigate(href)
  }
  return <figure className="ring-map">
    <div className="ring-map-scroll" tabIndex={0} role="region" aria-label="Map of Saturn’s main rings to scale. Scroll sideways on small screens.">
      <svg viewBox="0 0 1000 266" role="group" aria-labelledby="ring-map-caption">
        <rect className="ring-planet" x="0" y="40" width={x(SATURN_EQUATOR_KM)} height="150" />
        <text x={x(SATURN_EQUATOR_KM) - 8} y="34" textAnchor="end" className="ring-label-small">Saturn</text>
        {bands.map(region => {
          const left = x(region.inner), width = Math.max(2.2, x(region.outer) - left)
          return <RegionLink key={region.id} region={region} focusBox={[left - 2, width + 4]} onOpen={open} onActive={setActive}>
            <rect className="ring-band" x={left} y={BAND_TOP} width={width} height={BAND_HEIGHT} fillOpacity={shade[region.id]} />
          </RegionLink>
        })}
        {gaps.map(region => {
          const left = x(region.inner), width = Math.max(2.2, x(region.outer) - left), center = left + width / 2
          const row = gapLabelRow[region.id] || 166
          return <RegionLink key={region.id} region={region} focusBox={[center - 4, 8]} onOpen={open} onActive={setActive}>
            <rect className="ring-gap" x={left} y={BAND_TOP} width={width} height={BAND_HEIGHT} />
            <line className="ring-leader" x1={center} x2={center} y1={BAND_TOP + BAND_HEIGHT + 2} y2={row - 12} />
            <text x={center} y={row} textAnchor="middle" className="ring-label-small">{region.name}</text>
          </RegionLink>
        })}
        {bands.map(region => {
          const center = (x(region.inner) + x(region.outer)) / 2
          const small = region.id === 'cassini-division'
          return <text key={`label-${region.id}`} x={center} y={small ? 66 : 82} textAnchor="middle" className={small ? 'ring-label-small' : 'ring-label'} aria-hidden="true">{labelled[region.id]}</text>
        })}
        <g className="ring-tick" aria-hidden="true">
          <line className="ring-axis" x1={LEFT} x2={RIGHT} y1="205" y2="205" />
          {[60000, 80000, 100000, 120000, 140000].map(value => <g key={value}><line className="ring-axis" x1={x(value)} x2={x(value)} y1="201" y2="209" /><text x={x(value)} y="224" textAnchor="middle">{km(value)} km</text></g>)}
        </g>
        <g aria-hidden="true">
          <line className="ring-coverage" x1={x(observedSpan[0])} x2={RIGHT} y1="242" y2="242" />
          <line className="ring-coverage" x1={x(observedSpan[0])} x2={x(observedSpan[0])} y1="236" y2="248" />
          <path className="ring-coverage" d={`M${RIGHT - 7},236 L${RIGHT},242 L${RIGHT - 7},248`} fill="none" />
          <text x={x(observedSpan[0])} y="261" className="ring-coverage-label">Radio profiles on this site: {km(observedSpan[0])}–{km(observedSpan[1])} km from Saturn’s center</text>
        </g>
      </svg>
    </div>
    <figcaption id="ring-map-caption">
      <span className="ring-map-status" role="status">{current ? `${current.name} · ${km(current.inner)}–${km(current.outer)} km · typical optical depth ${current.opticalDepth}` : 'Select a ring or gap to open it in the data explorer.'}</span>
      <span>Radii: NASA PDS Ring-Moon Systems Node. Links open {shortName(mapObservation)} ({formatObservationDate(observation)}). Fainter outer rings are listed in the table below.</span>
    </figcaption>
  </figure>
}
