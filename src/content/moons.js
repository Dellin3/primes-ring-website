// Sixteen of Saturn’s moons, from the ring moonlets out to Phoebe.
// Radius and density: JPL “Planetary Satellite Physical Parameters”.
// Orbits: JPL “Planetary Satellite Mean Elements” (Laplace plane, epoch
// 2000-01-01.5 TDB; mean elements, not for computing positions).
// Discovery: NASA Science “Saturn Moons” table. Values are kept as published
// strings so that the download reproduces them exactly.
export const moonGroups = {
  ring: 'Ring moon',
  coorbital: 'Co-orbital moon',
  major: 'Major moon',
  outer: 'Small outer moon',
  irregular: 'Irregular moon',
}

export const moons = [
  { id: 'pan', name: 'Pan', group: 'ring', radius: '14.0', density: '0.3650', a: '133600', e: '0.000', i: '0.0', period: '0.575051', year: '1990', discoverers: 'M.R. Showalter' },
  { id: 'daphnis', name: 'Daphnis', group: 'ring', radius: null, density: null, a: '136500', e: '0.000', i: '0.0', period: '0.594080', year: '2005', discoverers: 'Cassini Imaging Science Team', note: 'JPL lists no mean radius; the NSSDC gives 4.3 × 4.1 × 3.2 km.' },
  { id: 'atlas', name: 'Atlas', group: 'ring', radius: '15.1', density: '0.3850', a: '137700', e: '0.001', i: '0.0', period: '0.604602', year: '1980', discoverers: 'Voyager Science Team' },
  { id: 'prometheus', name: 'Prometheus', group: 'ring', radius: '43.1', density: '0.4784', a: '139400', e: '0.002', i: '0.0', period: '0.615878', year: '1980', discoverers: 'Voyager Science Team' },
  { id: 'pandora', name: 'Pandora', group: 'ring', radius: '40.6', density: '0.4948', a: '141700', e: '0.004', i: '0.0', period: '0.631369', year: '1980', discoverers: 'Voyager Science Team' },
  { id: 'epimetheus', name: 'Epimetheus', group: 'coorbital', radius: '58.2', density: '0.6375', a: '151400', e: '0.020', i: '0.3', period: '0.697012', year: '1977, 1980', discoverers: 'J. Fountain, S. Larson (1977); D. Cruikshank (1980)' },
  { id: 'janus', name: 'Janus', group: 'coorbital', radius: '89.2', density: '0.6381', a: '151500', e: '0.007', i: '0.2', period: '0.697353', year: '1966, 1980', discoverers: 'A. Dollfus (1966); D. Pascu (1980)' },
  { id: 'mimas', name: 'Mimas', group: 'major', radius: '198.20', density: '1.1501', a: '186000', e: '0.020', i: '1.6', period: '0.942422', year: '1789', discoverers: 'W. Herschel' },
  { id: 'enceladus', name: 'Enceladus', group: 'major', radius: '252.10', density: '1.6097', a: '238400', e: '0.005', i: '0.0', period: '1.370218', year: '1789', discoverers: 'W. Herschel' },
  { id: 'tethys', name: 'Tethys', group: 'major', radius: '531.10', density: '0.9840', a: '295000', e: '0.001', i: '1.1', period: '1.887802', year: '1684', discoverers: 'G.D. Cassini' },
  { id: 'dione', name: 'Dione', group: 'major', radius: '561.40', density: '1.4781', a: '377700', e: '0.002', i: '0.0', period: '2.736916', year: '1684', discoverers: 'G.D. Cassini' },
  { id: 'rhea', name: 'Rhea', group: 'major', radius: '763.50', density: '1.2372', a: '527200', e: '0.001', i: '0.3', period: '4.517503', year: '1672', discoverers: 'G.D. Cassini' },
  { id: 'titan', name: 'Titan', group: 'major', radius: '2574.76', density: '1.8814', a: '1221900', e: '0.029', i: '0.3', period: '15.945448', year: '1655', discoverers: 'C. Huygens' },
  { id: 'hyperion', name: 'Hyperion', group: 'outer', radius: '135.00', density: '0.5386', a: '1481500', e: '0.105', i: '0.6', period: '21.276658', year: '1848', discoverers: 'W.C. Bond, G.P. Bond, W. Lassell' },
  { id: 'iapetus', name: 'Iapetus', group: 'major', radius: '734.30', density: '1.0887', a: '3561700', e: '0.028', i: '7.6', period: '79.331002', year: '1671', discoverers: 'G.D. Cassini' },
  { id: 'phoebe', name: 'Phoebe', group: 'irregular', radius: '106.50', density: '1.6428', a: '12929400', e: '0.164', i: '175.2', period: '550.303910', year: '1898', discoverers: 'W.H. Pickering' },
]

export const moonColumns = [
  { key: 'name', label: 'Moon', sortName: 'name', numeric: false },
  { key: 'radius', label: 'Mean radius', sortName: 'mean radius', unit: 'km', numeric: true },
  { key: 'a', label: 'Mean distance from Saturn', sortName: 'mean distance from Saturn', unit: 'km', numeric: true },
  { key: 'period', label: 'Orbital period', sortName: 'orbital period', unit: 'days', numeric: true },
  { key: 'density', label: 'Mean density', sortName: 'mean density', unit: 'g/cm³', numeric: true },
  // Sorted as a number, but shown left-aligned next to the discoverers' names.
  { key: 'year', label: 'Discovered', sortName: 'year of discovery', numeric: true, alignStart: true },
]

export function numericValue(moon, key) {
  const raw = moon[key]
  if (raw === null || raw === undefined) return null
  const value = Number(String(raw).split(',')[0])
  return Number.isFinite(value) ? value : null
}

// Groups digits without changing the published decimal places.
export function formatPublished(raw) {
  if (raw === null || raw === undefined) return '—'
  const [whole, fraction] = String(raw).split('.')
  if (!/^\d+$/.test(whole)) return String(raw)
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}

export function sortMoons(list, key, direction = 'ascending') {
  const factor = direction === 'descending' ? -1 : 1
  return [...list].sort((left, right) => {
    if (key === 'name') return factor * left.name.localeCompare(right.name)
    const a = numericValue(left, key), b = numericValue(right, key)
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1
    return factor * (a - b) || numericValue(left, 'a') - numericValue(right, 'a')
  })
}

const csvCell = value => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export const moonsCsvPath = '/downloads/saturn-major-moons.csv'

export function moonsCsv() {
  const header = [
    '# Sixteen moons of Saturn — compiled by Saturn: A Cassini Explorer',
    '# Mean radius and mean density: NASA JPL Solar System Dynamics, Planetary Satellite Physical Parameters, https://ssd.jpl.nasa.gov/sats/phys_par/',
    '# Semi-major axis, eccentricity, inclination, period: NASA JPL Solar System Dynamics, Planetary Satellite Mean Elements, https://ssd.jpl.nasa.gov/sats/elem/',
    '#   Mean elements in the Laplace reference plane, epoch 2000-01-01.5 TDB. JPL notes they are not intended for computing positions; use JPL Horizons for ephemerides.',
    '# Discovery year and discoverers: NASA Science, Saturn Moons, https://science.nasa.gov/saturn/moons/',
    '# Blank cells: no value published by the cited source.',
  ]
  const columns = ['name', 'group', 'mean_radius_km', 'mean_density_g_cm3', 'semi_major_axis_km', 'eccentricity', 'inclination_deg', 'orbital_period_days', 'discovery_year', 'discoverers']
  const rows = moons.map(moon => [moon.name, moonGroups[moon.group], moon.radius, moon.density, moon.a, moon.e, moon.i, moon.period, moon.year, moon.discoverers].map(csvCell).join(','))
  return `${[...header, columns.join(','), ...rows].join('\n')}\n`
}

// Short, sourced introductions. Numbers in `facts` come from the table above.
export const moonHighlights = [
  {
    id: 'titan', names: ['Titan'], headline: 'Bigger than Mercury, wrapped in haze',
    text: 'Titan is larger than the planet Mercury. Its thick atmosphere is mostly nitrogen, and its surface holds seas of liquid methane. In 2005 the Huygens probe made the first landing on a moon of another planet here, and NASA’s Dragonfly is planned to fly between dozens of sites on its surface.',
    sources: ['nasaMoons', 'voyager1', 'moonMysteries', 'exploration', 'dragonfly'],
  },
  {
    id: 'enceladus', names: ['Enceladus'], headline: 'An ocean that feeds a ring',
    text: 'Enceladus is only about 500 km across, yet jets of water vapor and ice burst from warm “tiger stripe” fractures near its south pole. A global ocean under the ice supplies the jets, and the jets supply Saturn’s faint E ring.',
    sources: ['enceladus'], ring: { to: '/rings#ring-table', label: 'Find the E ring in the ring table' },
  },
  {
    id: 'mimas', names: ['Mimas'], headline: 'A small moon with a long reach',
    text: 'The PDS ring table links the Huygens Gap, at the inner edge of the Cassini Division, to Mimas. Cassini also saw Mimas wobble as it rotates, a clue that it may hide an unusual core or an ocean.',
    sources: ['ringTable', 'moonMysteries'], ring: { to: '/rings#guided-cassini-division', label: 'See the Cassini Division in real data' },
  },
  {
    id: 'pan-daphnis', names: ['Pan', 'Daphnis'], headline: 'Moons that live inside the rings',
    text: 'Pan orbits inside the Encke Gap and Daphnis inside the Keeler Gap, and each keeps its gap open. You can measure the width of Pan’s gap yourself in a Cassini radio profile.',
    sources: ['ringTable'], ring: { to: '/rings#guided-encke-gap', label: 'Measure the Encke Gap' },
  },
  {
    id: 'shepherds', names: ['Prometheus', 'Pandora'], headline: 'Shepherds of the F ring',
    text: 'Voyager 1 tied the braided pattern of the narrow F ring to two newly discovered shepherd moons. Voyager 2 photographed them: Prometheus and Pandora help herd the ring’s particles.',
    sources: ['voyager1', 'voyager2'],
  },
  {
    id: 'coorbitals', names: ['Janus', 'Epimetheus'], headline: 'Two moons, almost one orbit',
    text: 'JPL lists mean distances of 151,500 km for Janus and 151,400 km for Epimetheus — nearly the same orbit. In 2006 a faint ring was discovered sharing their orbits.',
    sources: ['jplElements', 'exploration'],
  },
  {
    id: 'iapetus', names: ['Iapetus'], headline: 'Two-toned',
    text: 'Iapetus has been called the yin and yang of Saturn’s moons: its leading hemisphere is as dark as coal (albedo 0.03–0.05), while its trailing hemisphere is much brighter (0.5–0.6).',
    sources: ['iapetus'],
  },
  {
    id: 'hyperion', names: ['Hyperion'], headline: 'Light, lumpy and tumbling',
    text: 'Hyperion’s mean density is about 0.54 g/cm³ — lower than that of water ice — and the NSSDC records its rotation as chaotic rather than locked to Saturn.',
    sources: ['jplPhysical', 'nssdcMoons'],
  },
  {
    id: 'phoebe', names: ['Phoebe'], headline: 'Going the other way',
    text: 'Phoebe orbits about 12.9 million km from Saturn, in the opposite direction to the major moons (its inclination is 175°). It likely formed elsewhere and was captured. In 2009 the Spitzer Space Telescope revealed a huge, faint ring along its orbit.',
    sources: ['jplElements', 'moonMysteries', 'exploration'],
  },
]
