import catalog from '../../public/data/observations/catalog.json' with { type: 'json' }
import { explorationExamples } from './explorationExamples.js'

// Radii as listed by the NASA PDS Ring-Moon Systems Node, “Vital Statistics for
// Saturn’s Rings”. Typical optical depths are that table’s ranges, not values
// measured on this website.
export const ringRegions = [
  { id: 'd-ring', name: 'D ring', kind: 'ring', inner: 66900, outer: 74491, opticalDepth: '10⁻⁵ to 10⁻³', note: 'Tenuous; narrow ringlets at 67,580 and 71,710 km.' },
  { id: 'c-ring', name: 'C ring', kind: 'ring', inner: 74491, outer: 91975, opticalDepth: '0.05 to 0.35', note: 'Isolated plateaus within a fainter ring.' },
  { id: 'colombo-gap', name: 'Colombo Gap', kind: 'gap', parent: 'c-ring', inner: 77748, outer: 77926, opticalDepth: '~0', note: 'The Titan Ringlet occupies its outer third.' },
  { id: 'maxwell-gap', name: 'Maxwell Gap', kind: 'gap', parent: 'c-ring', inner: 87343, outer: 87610, opticalDepth: '~0', note: 'The widest gap in the C ring.' },
  { id: 'b-ring', name: 'B ring', kind: 'ring', inner: 91975, outer: 117570, opticalDepth: '0.4 to 5', note: 'The most opaque ring, with fine structure on all scales.' },
  { id: 'cassini-division', name: 'Cassini Division', kind: 'division', inner: 117500, outer: 122050, opticalDepth: '0 to 0.2', note: 'A broad, low-optical-depth region between the B and A rings.' },
  { id: 'huygens-gap', name: 'Huygens Gap', kind: 'gap', parent: 'cassini-division', inner: 117500, outer: 117930, opticalDepth: '~0', note: 'Associated with the moon Mimas.' },
  { id: 'a-ring', name: 'A ring', kind: 'ring', inner: 122050, outer: 136770, opticalDepth: '0.4 to 1', note: 'Density and bending waves, especially near its outer edge.' },
  { id: 'encke-gap', name: 'Encke Gap', kind: 'gap', parent: 'a-ring', inner: 133423, outer: 133745, opticalDepth: '~0', note: 'Kept open by the embedded moon Pan; faint ringlets inside.' },
  { id: 'keeler-gap', name: 'Keeler Gap', kind: 'gap', parent: 'a-ring', inner: 136487, outer: 136522, opticalDepth: '~0', note: 'Kept open by the embedded moon Daphnis.' },
  { id: 'f-ring', name: 'F ring', kind: 'ring', inner: 139826, outer: 140612, opticalDepth: '0.01 to 0.2', note: 'Narrow, eccentric and inclined; denser core near 140,224 km.', siteNote: 'In the six profiles on this site, the F ring barely rises above the background.' },
  { id: 'janus-epimetheus-ring', name: 'Janus/Epimetheus ring', kind: 'faint', inner: 149000, outer: 154000, opticalDepth: '10⁻⁷', note: 'Very faint, in the region of the two moons’ orbits.' },
  { id: 'g-ring', name: 'G ring', kind: 'faint', inner: 166000, outer: 173200, opticalDepth: '10⁻⁶', note: 'Faint dust ring associated with the moonlet Aegaeon.' },
  { id: 'e-ring', name: 'E ring', kind: 'faint', inner: 180000, outer: 480000, opticalDepth: '5 × 10⁻⁶', note: 'Broad dust ring from just inside Mimas’s orbit to beyond Dione’s, densest near Enceladus.' },
  { id: 'phoebe-ring', name: 'Phoebe ring', kind: 'faint', inner: 7720000, outer: 12500000, opticalDepth: '~2 × 10⁻⁸', note: 'Huge, faint ring associated with the distant moon Phoebe; extent as reported at its discovery in 2009.' },
]

export const observations = catalog.observations

// The radial span covered by at least one of the six archived profiles.
export const observedSpan = [
  Math.min(...observations.map(item => item.radial_range.minimum)),
  Math.max(...observations.map(item => item.radial_range.maximum)),
]

// RSS_2005_123_X43_E → 2005-05-03 (year and day of year of the ring event).
export function observationDate(observation) {
  const match = /^RSS_(\d{4})_(\d{3})_/.exec(observation.ring_observation_id)
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), 0, Number(match[2])))
  return date.toISOString().slice(0, 10)
}

export function formatObservationDate(observation) {
  const iso = observationDate(observation)
  return iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''
}

export function findObservation(slug) {
  return observations.find(item => item.slug === slug)
}

export function shortName(slug) {
  const observation = findObservation(slug)
  return observation ? `Rev ${String(observation.revolution_number).padStart(3, '0')}` : slug
}

// A link the data explorer opens directly. Version pins the verified web data.
export function explorerHref(slug, [from, to], variable = 'optical_depth') {
  const example = Object.values(explorationExamples).find(item => item.slug === slug)
  const params = new URLSearchParams({ variable, from: String(from), to: String(to) })
  if (example) params.set('version', example.webProductVersion)
  return `/data/${slug}?${params}`
}

// Ring-map links use the 2005 Rev 007 profile, which covers the C ring through
// the F ring with the strongest contrast among the six.
export const mapObservation = 'rev007e-x43-dlp-500m'

export function mapWindow(region, slug = mapObservation) {
  const observation = findObservation(slug)
  const { minimum, maximum } = observation.radial_range
  if (region.outer < minimum || region.inner > maximum) return null
  const pad = region.kind === 'gap' ? Math.max(150, (region.outer - region.inner) * 0.5) : 0
  return [Math.max(minimum, region.inner - pad), Math.min(maximum, region.outer + pad)]
}

// Each statement below is checked against the exact website data by
// tests/saturn-content.test.mjs; `checks` lists those measurements.
export const guidedObservations = [
  {
    id: 'c-to-b',
    title: 'Where the C ring meets the B ring',
    question: 'What happens to the signal as it leaves the C ring and enters the B ring?',
    slug: 'rev064e-x43-dlp-500m',
    range: [89000, 95000],
    look: 'Read the optical depth from left to right and find the radius where it jumps.',
    notice: 'In Rev 064 the median optical depth is about 0.18 across this part of the C ring and about 1.2 in the inner B ring. It first rises above 1 near 92,002 km, close to the 91,975 km boundary in the PDS ring table.',
    caution: 'A higher optical depth means the ring blocked more of the signal. On its own it is not a measure of mass.',
    checks: [
      { kind: 'median', range: [89000, 91800], expect: 0.175, tolerance: 0.01 },
      { kind: 'median', range: [92200, 95000], expect: 1.2, tolerance: 0.02 },
      { kind: 'firstAbove', range: [91000, 95000], threshold: 1, expect: 92002.25, tolerance: 0.5 },
    ],
  },
  {
    id: 'maxwell-ringlet',
    title: 'A gap that is not empty',
    question: 'The Maxwell Gap is the widest gap in the C ring. Is there anything inside it?',
    slug: 'rev044e-x63-dlp-500m',
    range: [87200, 87750],
    look: 'Find the low, flat stretch of the gap, then look for a narrow spike inside it.',
    notice: 'Most of the gap sits near zero optical depth, but a narrow ringlet inside it reaches about 2.8 near 87,530 km in Rev 044. Open the same window in another observation: the spike sits at a slightly different radius each time, between about 87,500 and 87,556 km in the five profiles that cover this gap.',
    caution: 'Comparing radii between observations tells you the ringlet’s position changes; the plot alone cannot tell you why.',
    checks: [
      { kind: 'median', range: [87343, 87610], expect: 0.005, tolerance: 0.01 },
      { kind: 'peak', range: [87343, 87610], expectValue: 2.801, valueTolerance: 0.01, expectRadius: 87530.5, radiusTolerance: 1 },
      { kind: 'peakRadiusSpread', range: [87343, 87610], slugs: ['rev007e-x43-dlp-500m', 'rev044e-x63-dlp-500m', 'rev064e-x43-dlp-500m', 'rev123e-x63-dlp-500m', 'rev133e-x43-dlp-500m'], expect: [87500.75, 87555.5], tolerance: 1 },
    ],
  },
  {
    id: 'cassini-division',
    title: 'Find the Cassini Division',
    question: 'Giovanni Cassini saw a dark band between two rings in 1675. What does it look like in a radio signal?',
    slug: 'rev007e-x43-dlp-500m',
    range: [115500, 123500],
    look: 'Compare the left edge (outer B ring), the middle, and the right edge (inner A ring).',
    notice: 'In Rev 007 the median optical depth is about 2.2 at the outer edge of the B ring, drops to about 0.16 across the Cassini Division, and rises to about 1.3 in the inner A ring.',
    caution: 'The division is not empty: its optical depth is low but not zero, and it contains narrow features of its own.',
    checks: [
      { kind: 'median', range: [115500, 117400], expect: 2.18, tolerance: 0.02 },
      { kind: 'median', range: [118200, 121900], expect: 0.162, tolerance: 0.01 },
      { kind: 'median', range: [122200, 123500], expect: 1.26, tolerance: 0.02 },
    ],
  },
  {
    id: 'encke-gap',
    title: 'Measure the Encke Gap',
    question: 'The tiny moon Pan keeps a gap open in the outer A ring. How wide is it?',
    slug: 'rev123e-x63-dlp-500m',
    range: [133250, 133950],
    look: 'Choose point A at the gap’s inner edge and point B at its outer edge, then read the radius difference.',
    notice: 'In Rev 123 the optical depth stays below 0.05 from about 133,428 km to 133,744 km — roughly 316 km — while the A ring on either side sits near 0.4. The PDS ring table lists the gap at 133,423–133,745 km.',
    caution: 'Where you place an “edge” depends on the threshold you choose; write yours down with your measurement.',
    checks: [
      { kind: 'clearRun', range: [133300, 133900], threshold: 0.05, expect: [133427.5, 133744], tolerance: 1 },
      { kind: 'median', range: [133250, 133400], expect: 0.404, tolerance: 0.01 },
      { kind: 'median', range: [133760, 133900], expect: 0.45, tolerance: 0.01 },
    ],
  },
  {
    id: 'same-ring-different-years',
    title: 'Same ring, different years',
    question: 'Five observations cross the same stretch of the B ring between 2005 and 2010. Do they agree?',
    slug: 'rev007e-x43-dlp-500m',
    compareSlug: 'rev133e-x43-dlp-500m',
    range: [100000, 104000],
    look: 'Open the 2005 view, then the 2010 view, and compare the typical optical depth.',
    notice: 'The median optical depth in this window is about 2.8 in Rev 007 (2005), 1.8 in Rev 044 (2007), 1.3 in Rev 064 (2008), 0.61 in Rev 123 (2009) and 0.31 in Rev 133 (2010).',
    caution: 'This does not show the B ring thinning. Each signal crossed the rings at a different angle, the files correct optical depth for that angle, and a ring that blocks almost all of the signal can only be measured up to a limit. Before comparing observations, check how each was made.',
    checks: [
      { kind: 'median', slug: 'rev007e-x43-dlp-500m', range: [100000, 104000], expect: 2.797, tolerance: 0.01 },
      { kind: 'median', slug: 'rev044e-x63-dlp-500m', range: [100000, 104000], expect: 1.791, tolerance: 0.01 },
      { kind: 'median', slug: 'rev064e-x43-dlp-500m', range: [100000, 104000], expect: 1.334, tolerance: 0.01 },
      { kind: 'median', slug: 'rev123e-x63-dlp-500m', range: [100000, 104000], expect: 0.614, tolerance: 0.01 },
      { kind: 'median', slug: 'rev133e-x43-dlp-500m', range: [100000, 104000], expect: 0.309, tolerance: 0.01 },
    ],
  },
]

export const glossary = [
  { term: 'Radio occultation', definition: 'Cassini sent a radio signal toward Earth through the rings. Ring material along the path weakened the signal and shifted its phase; antennas on Earth recorded the result.' },
  { term: 'Ring radius', definition: 'The distance, in kilometers, from Saturn’s center to the point where the signal crossed the ring plane.' },
  { term: 'Normal optical depth', definition: 'How strongly the ring weakened the signal, converted to a path straight through the ring. Zero means the signal passed freely; larger numbers mean more was blocked. It has no unit and is not a direct measure of mass.' },
  { term: 'Normalized signal power', definition: 'The received power divided by the power expected with no rings in the way, so 1 means unobstructed.' },
  { term: 'Phase shift', definition: 'The change in the timing of the radio wave, in degrees. This site shows the stored values without unwrapping them.' },
  { term: 'Diffraction-limited profile', definition: 'Radio waves spread and interfere, which blurs the finest structure. These archived profiles keep that blur; reconstructing sharper detail is the problem the PRIMES project studies.' },
  { term: 'Ingress and egress', definition: 'Labels for the two directions in which the signal path can cross the rings during an occultation. Each profile records one.' },
  { term: 'Rev', definition: 'Cassini’s label for each orbit (revolution) of Saturn. A redesign of the early tour replaced Revs 1 and 2 with Revs A, B and C, so Rev 133 is not exactly the 133rd orbit.' },
]
