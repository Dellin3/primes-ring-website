import { memo, useMemo } from 'react'
import {
  FLATTENING, findFeature, kmToScene, pixelsPerUnit, projectOrthographic, ringBands, ringColorRgb, signalGeometry,
} from '../../lib/ringScene.js'

// The SVG version of the scene: an orthographic drawing from the same numbers
// as the WebGL scene. It is what the page shows before WebGL loads, and the
// full fallback when WebGL is unavailable.

const ringColor = alpha => `rgb(${ringColorRgb(alpha).join(',')})`

function halfAnnulus(cx, cy, inner, outer, squash, half) {
  // half = 'back' draws the far half of the ring, 'front' the near half.
  const sweep = half === 'back' ? 0 : 1
  const ri = inner, ro = outer
  return `M${cx + ro},${cy}A${ro},${ro * squash} 0 0 ${sweep} ${cx - ro},${cy}L${cx - ri},${cy}A${ri},${ri * squash} 0 0 ${1 - sweep} ${cx + ri},${cy}Z`
}

function SaturnIllustration({ view, width, height, profile, crossingKm, highlightId, idPrefix = 'saturn' }) {
  const ppu = pixelsPerUnit(view, height)
  const center = [width / 2, height / 2]
  const origin = projectOrthographic([0, 0, 0], view, ppu, center)
  const sinEl = Math.sin(view.elevation * Math.PI / 180)
  // Seen from below the ring plane the near half is the upper one.
  const below = sinEl < 0
  const squash = Math.max(Math.abs(sinEl), 0.004)
  const bands = useMemo(() => ringBands(profile), [profile])
  const planetRy = Math.sqrt(sinEl ** 2 + (FLATTENING ** 2) * (1 - sinEl ** 2)) * ppu
  const geometry = signalGeometry(crossingKm)
  const s = projectOrthographic(geometry.spacecraft, view, ppu, center)
  const p = projectOrthographic(geometry.crossing, view, ppu, center)
  const e = projectOrthographic(geometry.earthward, view, ppu, center)
  const highlight = findFeature(highlightId)
  const highlightRegion = highlight?.kind === 'ring' ? highlight.region : null
  const bandPath = (band, half) => halfAnnulus(origin.x, origin.y, kmToScene(band.inner) * ppu, kmToScene(band.outer) * ppu, squash, below ? (half === 'back' ? 'front' : 'back') : half)
  const ringLayer = half => <g className={`scene-svg-rings is-${half}`}>
    {bands.map(band => <path key={band.inner} d={bandPath(band, half)} fill={ringColor(band.alpha)} fillOpacity={Math.min(0.94, 0.1 + band.alpha * 0.86)} />)}
    {highlightRegion && <path d={bandPath(highlightRegion, half)} fill="#f3dcae" fillOpacity="0.32" stroke="#f6e3bd" strokeOpacity="0.9" strokeWidth="1.2" />}
  </g>
  // Faint latitude lines give the planet its banded look (illustration).
  const latitudes = [-52, -34, -18, -6, 8, 22, 38, 56]
  const light = [-0.55, 0.4]
  return <svg className="scene-svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={`${idPrefix}-planet`} cx={0.5 + light[0] * 0.42} cy={0.5 - light[1] * 0.42} r="0.85">
        <stop offset="0" stopColor="#f2e0bb" />
        <stop offset="0.45" stopColor="#d6b47f" />
        <stop offset="0.78" stopColor="#8a6a45" />
        <stop offset="1" stopColor="#2a2118" />
      </radialGradient>
      <clipPath id={`${idPrefix}-planet-clip`}><ellipse cx={origin.x} cy={origin.y} rx={ppu} ry={planetRy} /></clipPath>
    </defs>
    {ringLayer('back')}
    <ellipse cx={origin.x} cy={origin.y} rx={ppu} ry={planetRy} fill={`url(#${idPrefix}-planet)`} />
    <g clipPath={`url(#${idPrefix}-planet-clip)`} stroke="#5d4630" strokeOpacity="0.28" fill="none">
      {latitudes.map(latitude => {
        const phi = latitude * Math.PI / 180
        const y = FLATTENING * Math.sin(phi)
        const c = projectOrthographic([0, y, 0], view, ppu, center)
        const r = Math.cos(phi) * ppu
        const ry = Math.max(0.6, r * Math.abs(sinEl))
        // Only the near half of each latitude circle faces the viewer.
        return <path key={latitude} d={`M${c.x + r},${c.y}A${r},${ry} 0 0 ${below ? 0 : 1} ${c.x - r},${c.y}`} strokeWidth={Math.max(1, ppu * 0.035)} />
      })}
    </g>
    {highlight?.kind === 'planet' && <ellipse cx={origin.x} cy={origin.y} rx={ppu + 3} ry={planetRy + 3} fill="none" stroke="#f6e3bd" strokeOpacity="0.85" strokeWidth="1.5" />}
    {ringLayer('front')}
    <line className="scene-svg-radius" x1={origin.x} y1={origin.y} x2={p.x} y2={p.y} />
    <line className={`scene-svg-signal is-incoming${highlightId === 'signal' ? ' is-highlighted' : ''}`} x1={s.x} y1={s.y} x2={p.x} y2={p.y} />
    <line className={`scene-svg-signal is-outgoing${highlightId === 'signal' ? ' is-highlighted' : ''}`} x1={p.x} y1={p.y} x2={e.x} y2={e.y} />
    <ellipse className="scene-svg-crossing" cx={p.x} cy={p.y} rx={7} ry={Math.max(2.4, 7 * squash)} />
    <circle cx={p.x} cy={p.y} r="2.6" fill="#fff6e4" />
    <g className={`scene-svg-craft${highlightId === 'cassini' ? ' is-highlighted' : ''}`} transform={`translate(${s.x} ${s.y})`}>
      <circle r="9" fill="#0b131d" stroke="#f0d9b4" strokeWidth="1.4" />
      <path d="M-4.5 2.5 L0 -4.5 L4.5 2.5 Z" fill="#f0d9b4" />
    </g>
  </svg>
}

export default memo(SaturnIllustration)
