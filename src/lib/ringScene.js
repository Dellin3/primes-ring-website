// Geometry and content for the home page's "Follow the signal" scene.
//
// What is to scale: Saturn's equatorial and polar radii (NSSDC fact sheet, as
// listed in src/content/saturn.js) and every ring radius (NASA PDS ring table,
// src/content/rings.js). Ring brightness follows a real profile's normal
// optical depth (Rev 007, display overview).
// What is schematic: Cassini's distance, the direction to Earth, and the
// straight radial track of the crossing point. A real occultation track also
// moves around the ring, and its geometry differs between observations.
//
// Scene units are Saturn equatorial radii; the ring plane is y = 0 and +y is
// Saturn's north pole. The renderers (SVG and WebGL) share these numbers.
import { mapObservation, mapWindow, explorerHref, ringRegions } from '../content/rings.js'

export const SATURN_EQUATORIAL_KM = 60268
export const SATURN_POLAR_KM = 54364
export const FLATTENING = SATURN_POLAR_KM / SATURN_EQUATORIAL_KM
export const kmToScene = km => km / SATURN_EQUATORIAL_KM

// Schematic choices, picked so the line, the rings and the planet read clearly.
export const TRACK_AZIMUTH_DEG = 30
export const SIGNAL_ELEVATION_DEG = 28
export const SPACECRAFT_DISTANCE = 1.75
export const EARTHWARD_LENGTH = 2.1

const sceneRingIds = ['d-ring', 'c-ring', 'b-ring', 'cassini-division', 'a-ring', 'encke-gap', 'f-ring']
export const sceneRings = sceneRingIds.map(id => ringRegions.find(region => region.id === id))
export const RING_SPAN_KM = [sceneRings[0].inner, sceneRings.at(-1).outer]
// The crossing moves across the rings the six profiles cover well: from the
// inner edge of the C ring to the outer edge of the F ring (PDS ring table).
export const CROSSING_RANGE_KM = [ringRegions.find(r => r.id === 'c-ring').inner, ringRegions.find(r => r.id === 'f-ring').outer]
export const DEFAULT_CROSSING_KM = 119800

const rad = degrees => degrees * Math.PI / 180
const deg = radians => radians * 180 / Math.PI
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

// Unit vector along the crossing track, and the schematic direction to Earth:
// tilted SIGNAL_ELEVATION_DEG above the ring plane, across the track.
export const trackDirection = [Math.cos(rad(TRACK_AZIMUTH_DEG)), 0, Math.sin(rad(TRACK_AZIMUTH_DEG))]
export const earthDirection = (() => {
  // Across the track, away from the default viewpoint, so the line toward
  // Earth never runs across the face of the planet in the overview.
  const across = [Math.sin(rad(TRACK_AZIMUTH_DEG)), 0, -Math.cos(rad(TRACK_AZIMUTH_DEG))]
  const b = rad(SIGNAL_ELEVATION_DEG)
  return [across[0] * Math.cos(b), Math.sin(b), across[2] * Math.cos(b)]
})()

export function clampCrossing(km) {
  return Math.min(CROSSING_RANGE_KM[1], Math.max(CROSSING_RANGE_KM[0], km))
}

// The signal path for a crossing at ringRadiusKm: Cassini below the ring plane,
// the point where the line pierces the plane, and the line on toward Earth.
export function signalGeometry(ringRadiusKm) {
  const crossing = scale(trackDirection, kmToScene(ringRadiusKm))
  return {
    crossing,
    spacecraft: add(crossing, scale(earthDirection, -SPACECRAFT_DISTANCE)),
    earthward: add(crossing, scale(earthDirection, EARTHWARD_LENGTH)),
  }
}

// The most specific ring feature at a radius: a gap inside a ring wins over
// the ring around it. Only the features drawn in the scene are considered.
export function regionAtRadius(km) {
  const hits = sceneRings.filter(region => km >= region.inner && km <= region.outer)
  return hits.find(region => region.kind === 'gap') || hits.find(region => region.kind === 'division') || hits[0] || null
}

const ringNotes = {
  'cassini-division': 'Where the profile drops toward zero, the signal passed almost freely.',
  'b-ring': 'The signal was blocked most strongly here; very opaque stretches can only be measured up to a limit.',
  'encke-gap': 'A narrow gap: zoom in on it in the explorer to see its edges.',
}

// Label priority decides which label stays when two overlap (higher wins).
export const sceneFeatures = [
  { id: 'saturn', kind: 'planet', label: 'Saturn', priority: 9 },
  ...sceneRings.map(region => ({
    id: region.id, kind: 'ring', label: region.name, region,
    priority: { 'b-ring': 8, 'a-ring': 7, 'c-ring': 6, 'cassini-division': 6, 'f-ring': 4, 'encke-gap': 3, 'd-ring': 2 }[region.id],
    hint: ringNotes[region.id] || '',
  })),
  { id: 'cassini', kind: 'spacecraft', label: 'Cassini', priority: 9 },
  { id: 'signal', kind: 'signal', label: 'Radio signal to Earth', priority: 5 },
]
export const findFeature = id => sceneFeatures.find(feature => feature.id === id) || null

// Ring labels sit beside the track (a little around the ring) so they do not
// cover the crossing marker; other labels follow the objects they name.
const LABEL_AZIMUTH_DEG = TRACK_AZIMUTH_DEG - 14
export function featureAnchor(id, ringRadiusKm = DEFAULT_CROSSING_KM) {
  const feature = findFeature(id)
  if (!feature) return null
  if (feature.kind === 'ring') {
    const middle = (feature.region.inner + feature.region.outer) / 2
    const r = kmToScene(middle)
    return [r * Math.cos(rad(LABEL_AZIMUTH_DEG)), 0, r * Math.sin(rad(LABEL_AZIMUTH_DEG))]
  }
  const geometry = signalGeometry(ringRadiusKm)
  if (id === 'saturn') return [0, FLATTENING * 1.02, 0]
  if (id === 'cassini') return geometry.spacecraft
  return add(geometry.crossing, scale(earthDirection, EARTHWARD_LENGTH * 0.72))
}

// Where each feature leads: an exact explorer window from the ring map's
// observation (Rev 007), and the page that explains it.
export function featureLinks(id) {
  const feature = findFeature(id)
  if (!feature) return []
  if (feature.kind === 'ring') {
    const window = mapWindow(feature.region)
    return [
      window && { label: `Open the ${feature.label} in Rev 007`, to: explorerHref(mapObservation, window.map(value => Math.round(value * 4) / 4)), kind: 'data' },
      { label: 'See it on the to-scale ring map', to: '/rings#rings-map', kind: 'learn' },
    ].filter(Boolean)
  }
  if (id === 'saturn') return [{ label: 'Meet the planet', to: '/planet', kind: 'learn' }]
  if (id === 'cassini') return [{ label: 'How Cassini read the rings', to: '/rings#rings-reading', kind: 'learn' }, { label: 'The Cassini mission', to: '/missions', kind: 'learn' }]
  return [{ label: 'What the received signal records', to: '/rings#rings-reading', kind: 'learn' }]
}

// Camera views as (azimuth, elevation, distance, target). The camera sits at
// target + distance * (cos(el) sin(az), sin(el), cos(el) cos(az)).
export function viewFor(name, ringRadiusKm = DEFAULT_CROSSING_KM) {
  const { crossing } = signalGeometry(ringRadiusKm)
  const earthAzimuth = deg(Math.atan2(earthDirection[0], earthDirection[2]))
  switch (name) {
    case 'earth': return { name, azimuth: earthAzimuth, elevation: SIGNAL_ELEVATION_DEG, distance: 6.4, target: crossing }
    case 'edge': return { name, azimuth: 90 - TRACK_AZIMUTH_DEG, elevation: 1.2, distance: 8.2, target: [0, -0.15, 0] }
    case 'above': return { name, azimuth: -TRACK_AZIMUTH_DEG + 90, elevation: 89, distance: 8.8, target: scale(trackDirection, 0.9) }
    case 'sweep': return { name, azimuth: 100 - TRACK_AZIMUTH_DEG, elevation: 50, distance: 8.3, target: add(scale(trackDirection, 1.2), [0, 0.38, 0]) }
    case 'close': {
      // Close to the outer A ring, framed so the crossing sits left of the
      // info card that opens on the right.
      const azimuth = 70 - TRACK_AZIMUTH_DEG
      const right = [Math.cos(rad(azimuth)), 0, -Math.sin(rad(azimuth))]
      return { name, azimuth, elevation: 34, distance: 2.1, target: add(scale(trackDirection, kmToScene(132600)), scale(right, 0.3)) }
    }
    default: return { name: 'overview', azimuth: 52 - TRACK_AZIMUTH_DEG, elevation: 21, distance: 8.9, target: [0.55, -0.36, 0.25] }
  }
}

// Both renderers frame a view with the same vertical field of view, so the
// SVG drawing and the WebGL scene show the same region for the same view.
export const FIELD_OF_VIEW_DEG = 30
export const pixelsPerUnit = (view, height) => height / (2 * view.distance * Math.tan((FIELD_OF_VIEW_DEG / 2) * Math.PI / 180))

export const presetViews = [
  { name: 'overview', label: 'Overview', description: 'The default view: Saturn, the rings, Cassini and the signal.' },
  { name: 'earth', label: 'Earth’s view', description: 'Look back along the signal from Earth: Cassini sits behind the rings.' },
  { name: 'edge', label: 'Edge-on', description: 'The ring plane seen edge-on: Cassini below it, Earth above it.' },
  { name: 'above', label: 'From above', description: 'The rings face-on, with every radius to scale.' },
]

// Orthographic projection used by the SVG illustration and its labels.
// Returns screen x to the right and y downward, plus depth toward the viewer.
export function cameraBasis(view) {
  const az = rad(view.azimuth)
  const el = rad(view.elevation)
  return {
    toward: [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)],
    right: [Math.cos(az), 0, -Math.sin(az)],
    up: [-Math.sin(el) * Math.sin(az), Math.cos(el), -Math.sin(el) * Math.cos(az)],
  }
}

export function projectOrthographic(point, view, pixelsPerUnit, center) {
  const basis = cameraBasis(view)
  const relative = [point[0] - view.target[0], point[1] - view.target[1], point[2] - view.target[2]]
  return {
    x: center[0] + dot(relative, basis.right) * pixelsPerUnit,
    y: center[1] - dot(relative, basis.up) * pixelsPerUnit,
    depth: dot(relative, basis.toward),
  }
}

// Is a point hidden behind the planet for a viewer looking along -toward?
// The oblate planet is stretched to a unit sphere for the test.
export function hiddenByPlanet(point, toward) {
  const p = [point[0], point[1] / FLATTENING, point[2]]
  const d = [toward[0], toward[1] / FLATTENING, toward[2]]
  const length = Math.hypot(...d)
  const u = d.map(value => value / length)
  // Ray from the point toward the viewer: p + s u, s > 0.
  const b = dot(p, u)
  const c = dot(p, p) - 1
  if (c <= 0) return true
  const discriminant = b * b - c
  if (discriminant <= 0) return false
  return -b - Math.sqrt(discriminant) > 0
}

// One display value per overview bucket (1,024 source records, 256 km), used
// to shade the rings: the median of the source points the overview kept for
// that bucket (its first, last, minimum and maximum records), which damps the
// extremes the overview deliberately keeps. Returns sorted [radius, tau]
// pairs; missing values are skipped, negative values count as clear.
export function opacityProfile(overview) {
  if (!overview?.points?.length) return []
  const columns = overview.columns
  const at = name => columns.indexOf(name)
  const iSample = at('sample_index'), iRadius = at('ring_radius_km'), iTau = at('optical_depth')
  const size = overview.bucket_size_records || 1024
  const buckets = new Map()
  for (const point of overview.points) {
    const radius = point[iRadius]
    const tau = point[iTau]
    if (!Number.isFinite(radius) || !Number.isFinite(tau)) continue
    const key = Math.floor(point[iSample] / size)
    const bucket = buckets.get(key) || { radii: [], taus: [] }
    bucket.radii.push(radius)
    bucket.taus.push(Math.max(0, tau))
    buckets.set(key, bucket)
  }
  const median = values => {
    const sorted = [...values].sort((a, b) => a - b)
    const middle = sorted.length >> 1
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  }
  return [...buckets.values()].map(bucket => [bucket.radii.reduce((sum, value) => sum + value, 0) / bucket.radii.length, median(bucket.taus)]).sort((a, b) => a[0] - b[0])
}

// Shading used only until the measured profile has loaded (and in the
// prerendered page): one value per ring inside the PDS table's typical range.
const typicalTau = { 'd-ring': 0.001, 'c-ring': 0.1, 'b-ring': 1.8, 'cassini-division': 0.1, 'a-ring': 0.55, 'encke-gap': 0, 'f-ring': 0.1 }
export function typicalProfile(step = 250) {
  const pairs = []
  for (let km = RING_SPAN_KM[0] + step / 2; km < RING_SPAN_KM[1]; km += step) {
    const region = regionAtRadius(km)
    pairs.push([km, region ? typicalTau[region.id] : 0])
  }
  return pairs
}

// Fraction of light a ring stretch blocks on a straight path: 1 - exp(-tau).
export const blockedFraction = tau => 1 - Math.exp(-Math.min(6, Math.max(0, tau)))

// Illustrative ring color: browner where a ring is thin, paler where dense.
export function ringColorRgb(alpha) {
  const mix = (a, b) => Math.round(a + (b - a) * Math.min(1, alpha * 1.15))
  return [mix(150, 236), mix(118, 218), mix(84, 182)]
}

// Ring bands every ~400 km. Brightness follows the measured profile where the
// observation covers the ring, and the PDS table's faint D ring elsewhere.
export function ringBands(profile, step = 400) {
  const bands = []
  for (let inner = RING_SPAN_KM[0]; inner < RING_SPAN_KM[1]; inner += step) {
    const outer = Math.min(RING_SPAN_KM[1], inner + step)
    const sample = profileAt(profile, (inner + outer) / 2)
    const alpha = sample ? blockedFraction(sample[1]) : 0.03
    if (alpha > 0.015) bands.push({ inner, outer, alpha })
  }
  return bands
}

// Sample the profile at a radius by taking the nearest bucket (no blending).
export function profileAt(profile, km) {
  if (!profile.length || km < profile[0][0] - 400 || km > profile.at(-1)[0] + 400) return null
  let low = 0, high = profile.length - 1
  while (high - low > 1) {
    const middle = (low + high) >> 1
    if (profile[middle][0] <= km) low = middle; else high = middle
  }
  return Math.abs(profile[low][0] - km) <= Math.abs(profile[high][0] - km) ? profile[low] : profile[high]
}

// The nearest real overview point to a radius, for the readout. Values are
// reported exactly as stored; nothing is interpolated.
export function nearestOverviewPoint(rows, km) {
  let best = null
  for (const row of rows) {
    if (!Number.isFinite(row.ring_radius_km)) continue
    if (!best || Math.abs(row.ring_radius_km - km) < Math.abs(best.ring_radius_km - km)) best = row
  }
  return best
}
