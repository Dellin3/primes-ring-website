import { useEffect, useMemo, useRef, useState } from 'react'
import EvidenceTag from '../../components/common/EvidenceTag.jsx'
import { formatObservationDate } from '../../content/rings.js'
import { CROSSING_RANGE_KM, nearestOverviewPoint, regionAtRadius, sceneRings } from '../../lib/ringScene.js'

const km = value => Math.round(value).toLocaleString('en-US')
const exact = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value)
const ticks = [80000, 100000, 120000, 140000]
const short = { 'd-ring': 'D', 'c-ring': 'C', 'b-ring': 'B', 'cassini-division': 'CD', 'a-ring': 'A', 'encke-gap': '', 'f-ring': 'F' }

// The real profile under the scene: Rev 007's display overview, drawn upright
// with fixed axes. The crossing marker reads the nearest stored overview point;
// nothing is interpolated between points.
export default function ProfileStrip({ rows, status, crossingKm, onCrossingChange, playing, canPlay, onPlayToggle, observation }) {
  const plotRef = useRef(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const element = plotRef.current
    if (!element) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const height = 104
  const pad = { left: 30, right: 10, top: 10, bottom: 22 }
  const domain = [observation.radial_range.minimum, observation.radial_range.maximum]
  const x = radius => pad.left + (radius - domain[0]) / (domain[1] - domain[0]) * (width - pad.left - pad.right)
  const extent = useMemo(() => {
    const values = (rows || []).map(row => row.optical_depth).filter(Number.isFinite)
    return values.length ? [Math.min(0, ...values), Math.max(...values)] : [0, 1]
  }, [rows])
  const y = value => pad.top + (1 - (value - extent[0]) / (extent[1] - extent[0])) * (height - pad.top - pad.bottom)
  const path = useMemo(() => {
    if (!rows) return ''
    let open = false
    return rows.map(row => {
      if (!Number.isFinite(row.optical_depth)) { open = false; return '' }
      const command = `${open ? 'L' : 'M'}${x(row.ring_radius_km).toFixed(1)},${y(row.optical_depth).toFixed(1)}`
      open = true
      return command
    }).join('')
    // x and y depend only on width and extent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, width, extent])
  const nearest = rows ? nearestOverviewPoint(rows, crossingKm) : null
  const region = regionAtRadius(crossingKm)
  // The slider moves in round 50 km steps inside the C-to-F ring span.
  const sliderMin = Math.ceil(CROSSING_RANGE_KM[0] / 50) * 50
  const sliderMax = Math.floor(CROSSING_RANGE_KM[1] / 50) * 50
  const left = x(sliderMin)
  const right = x(sliderMax)

  return <figure className="profile-strip">
    <figcaption className="profile-strip-head">
      <span><strong>Rev 007</strong> · {formatObservationDate(observation)} · normal optical depth against ring radius</span>
      <EvidenceTag kind="observation">Cassini observation · display overview</EvidenceTag>
    </figcaption>
    <div className="profile-strip-plot" ref={plotRef}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" focusable="false">
        {sceneRings.filter(ring => ring.kind !== 'gap').map((ring, index) => <g key={ring.id}>
          <rect x={x(Math.max(domain[0], ring.inner))} y={pad.top} width={Math.max(0, x(Math.min(domain[1], ring.outer)) - x(Math.max(domain[0], ring.inner)))} height={height - pad.top - pad.bottom} fill={index % 2 ? 'rgba(168,201,237,.05)' : 'rgba(225,198,156,.045)'} />
          {short[ring.id] && <text x={(x(Math.max(domain[0], ring.inner)) + x(Math.min(domain[1], ring.outer))) / 2} y={pad.top + 9} textAnchor="middle" className="profile-strip-region">{short[ring.id]}</text>}
        </g>)}
        <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} className="profile-strip-zero" />
        <text x={pad.left - 6} y={y(0) + 3} textAnchor="end" className="profile-strip-tick">0</text>
        <text x={pad.left - 6} y={y(extent[1]) + 7} textAnchor="end" className="profile-strip-tick">{Math.round(extent[1])}</text>
        {path ? <path d={path} className="profile-strip-line" /> : <text x={width / 2} y={height / 2} textAnchor="middle" className="profile-strip-tick">{status === 'error' ? 'The profile could not be loaded.' : 'Loading the profile…'}</text>}
        {ticks.map(tick => <text key={tick} x={x(tick)} y={height - 6} textAnchor="middle" className="profile-strip-tick">{(tick / 1000).toLocaleString('en-US')}k km</text>)}
        <line x1={x(crossingKm)} x2={x(crossingKm)} y1={pad.top} y2={height - pad.bottom} className="profile-strip-cursor" />
        {nearest && Number.isFinite(nearest.optical_depth) && <circle cx={x(nearest.ring_radius_km)} cy={y(nearest.optical_depth)} r="4" className="profile-strip-dot" />}
      </svg>
      <input className="profile-strip-range" type="range" min={sliderMin} max={sliderMax} step="50" value={Math.min(sliderMax, Math.max(sliderMin, Math.round(crossingKm / 50) * 50))} style={{ left: `${left}px`, width: `${right - left}px` }} onChange={event => onCrossingChange(Number(event.target.value))} aria-label="Crossing radius, in kilometers from Saturn’s center" aria-valuetext={`${km(crossingKm)} km${region ? `, ${region.name}` : ''}`} />
    </div>
    <div className="profile-strip-readout">
      <p><span>Crossing</span> <strong className="mono">{km(crossingKm)} km</strong>{region ? <> · {region.name}</> : <> · between rings</>}</p>
      <p>{nearest ? <><span>Nearest overview point</span> optical depth <strong className="mono">{exact(nearest.optical_depth)}</strong> at <span className="mono">{exact(nearest.ring_radius_km)} km</span></> : <span>{status === 'error' ? 'Open the explorer to read the profile.' : 'Loading the profile…'}</span>}</p>
      {canPlay && <button type="button" className="profile-strip-play" aria-pressed={playing} onClick={onPlayToggle}>{playing ? 'Pause' : 'Play the crossing'}<span className="sr-only"> (illustrative timing)</span></button>}
    </div>
  </figure>
}
