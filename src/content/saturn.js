// Facts about Saturn for the public pages. Each fact names the source it was
// checked against so later editors can re-verify it. When a value changes,
// update it here together with its `asOf` date; pages read only from this file.

// `short` labels tell apart two pages from the same publisher in one source line.
export const sources = {
  nasaFacts: { short: 'Saturn facts', title: 'Saturn: Facts', publisher: 'NASA Science', url: 'https://science.nasa.gov/saturn/facts/' },
  nssdc: { short: 'Saturn fact sheet', title: 'Saturn Fact Sheet', publisher: 'NASA Space Science Data Coordinated Archive', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html' },
  nasaMoons: { short: 'Saturn moons', title: 'Saturn Moons', publisher: 'NASA Science', url: 'https://science.nasa.gov/saturn/moons/' },
  nssdcMoons: { short: 'satellite fact sheet', title: 'Saturnian Satellite Fact Sheet', publisher: 'NASA Space Science Data Coordinated Archive', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html' },
  jplPhysical: { short: 'physical parameters', title: 'Planetary Satellite Physical Parameters', publisher: 'NASA JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/sats/phys_par/' },
  jplElements: { short: 'mean elements', title: 'Planetary Satellite Mean Elements', publisher: 'NASA JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/sats/elem/' },
  dayLength: { short: 'day length', title: 'Scientists Finally Know What Time It Is on Saturn', publisher: 'NASA JPL · January 18, 2019', url: 'https://www.jpl.nasa.gov/news/scientists-finally-know-what-time-it-is-on-saturn/' },
  ringTable: { short: 'ring table', title: 'Vital Statistics for Saturn’s Rings', publisher: 'NASA PDS Ring-Moon Systems Node', url: 'https://pds-rings.seti.org/saturn/saturn_rings_table.html' },
  cassiniRings: { short: 'Cassini rings science', title: 'Cassini science: Rings', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/cassini/science/rings/' },
  ringAge: { short: 'ring age', title: 'A new perspective on the age of Saturn’s rings', publisher: 'Institut de physique du globe de Paris · January 23, 2025', url: 'https://www.ipgp.fr/en/news-and-agenda/news/a-new-perspective-on-the-age-of-saturns-rings' },
  ringAgePaper: { short: 'ring age paper', title: 'Hyodo, Genda & Madeira, Nature Geoscience (2024)', publisher: 'Nature Geoscience', url: 'https://www.nature.com/articles/s41561-024-01598-9' },
  moonMysteries: { short: 'moon mysteries', title: '10 Things: Unsolved Mysteries of Saturn’s Moons', publisher: 'NASA Science', url: 'https://science.nasa.gov/solar-system/10-things-unsolved-mysteries-of-saturns-moons/' },
  enceladus: { short: 'Enceladus', title: 'Enceladus', publisher: 'NASA Science', url: 'https://science.nasa.gov/saturn/moons/enceladus/' },
  iapetus: { short: 'Iapetus', title: 'Iapetus', publisher: 'NASA Science', url: 'https://science.nasa.gov/saturn/moons/iapetus/' },
  exploration: { short: 'Saturn exploration', title: 'Saturn: Exploration', publisher: 'NASA Science', url: 'https://science.nasa.gov/saturn/exploration/' },
  cassiniTimeline: { short: 'Cassini timeline', title: 'Cassini timeline', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/cassini/the-journey/timeline/' },
  voyager1: { short: 'Voyager 1', title: '40 Years Ago: Voyager 1 Explores Saturn', publisher: 'NASA History', url: 'https://www.nasa.gov/history/40-years-ago-voyager-1-explores-saturn/' },
  voyager2: { short: 'Voyager 2', title: '40 Years Ago: Voyager 2 Explores Saturn', publisher: 'NASA History', url: 'https://www.nasa.gov/history/40-years-ago-voyager-2-explores-saturn/' },
  dragonfly: { short: 'Dragonfly', title: 'Dragonfly mission confirmed for 2028 launch', publisher: 'Johns Hopkins APL · April 17, 2024', url: 'https://www.jhuapl.edu/news/news-releases/240417-nasa-confirms-apl-led-dragonfly-mission-to-saturn-moon-titan' },
  dragonflyReview: { short: 'Dragonfly review', title: 'Dragonfly clears key hurdle ahead of 2028 launch', publisher: 'Space.com · April 26, 2025', url: 'https://www.space.com/space-exploration/missions/nasas-dragonfly-nuclear-powered-helicopter-clears-key-hurdle-ahead-of-2028-launch-toward-huge-saturn-moon-titan' },
  pdsRss: { short: 'RSS archive', title: 'Cassini RSS ring occultation archive', publisher: 'NASA PDS Ring-Moon Systems Node', url: 'https://pds-rings.seti.org/cassini/rss/' },
}

export function collectSources(...lists) {
  return [...new Set(lists.flat().filter(Boolean))]
}

export function sourceList(ids) {
  return ids.map(id => {
    if (!sources[id]) throw new Error(`Unknown source: ${id}`)
    return { id, ...sources[id] }
  })
}

// NASA updates the count as new moons are confirmed; keep the date with it.
export const moonCount = { value: 293, asOf: 'August 2026', previous: { value: 274, asOf: 'March 2025' }, source: 'nasaMoons' }

export const keyFacts = [
  { id: 'distance', value: '9.5 AU', label: 'Average distance from the Sun', detail: 'About 1.4 billion km. Sunlight takes about 80 minutes to arrive.', sources: ['nasaFacts'] },
  { id: 'year', value: '29.4 years', label: 'One orbit of the Sun', detail: 'About 10,756 Earth days.', sources: ['nasaFacts'] },
  { id: 'day', value: '10 h 33 m', label: 'One rotation', detail: '10 hours, 33 minutes and 38 seconds, measured from waves in the rings (2019).', sources: ['dayLength'] },
  { id: 'width', value: '9.4 × Earth', label: 'Width at the equator', detail: 'Equatorial radius 60,268 km; polar radius 54,364 km.', sources: ['nssdc'] },
  { id: 'mass', value: '95 × Earth', label: 'Mass', detail: '568.32 × 10²⁴ kg.', sources: ['nssdc'] },
  { id: 'density', value: '0.687 g/cm³', label: 'Average density', detail: 'Lower than water — the only planet in the solar system for which that is true.', sources: ['nssdc', 'nasaFacts'] },
  { id: 'tilt', value: '26.73°', label: 'Axial tilt', detail: 'Enough for seasons; each lasts about seven Earth years.', sources: ['nssdc'] },
  { id: 'moons', value: String(moonCount.value), label: 'Confirmed moons', detail: `As of ${moonCount.asOf}.`, sources: ['nasaMoons'] },
]

// Physical and orbital values for researchers, exactly as the NSSDC lists them.
export const planetTable = [
  ['Equatorial radius (1 bar)', '60,268 km'],
  ['Polar radius', '54,364 km'],
  ['Volumetric mean radius', '58,232 km'],
  ['Mass', '568.32 × 10²⁴ kg'],
  ['Mean density', '687 kg/m³'],
  ['Gravity (mean, 1 bar)', '11.19 m/s²'],
  ['Escape velocity', '35.5 km/s'],
  ['Semimajor axis of orbit', '1,432.041 × 10⁶ km'],
  ['Sidereal orbit period', '10,755.699 days'],
  ['Orbit eccentricity', '0.0520'],
  ['Obliquity to orbit', '26.73°'],
  ['Sidereal rotation period', '10.656 hours'],
  ['Temperature at 1 bar', '134 K (−139 °C)'],
  ['Atmosphere by volume', 'H₂ 96.3% · He 3.25%'],
]

export const sections = [
  { id: 'planet', number: '01', path: '/planet', title: 'The planet', summary: 'A giant of hydrogen and helium, less dense than water, with a hexagon at its pole.' },
  { id: 'rings', number: '02', path: '/rings', title: 'The rings', summary: 'Ice in orbit, mapped to scale — and six real Cassini radio observations to explore.' },
  { id: 'moons', number: '03', path: '/moons', title: 'The moons', summary: `${moonCount.value} confirmed moons, from ocean worlds to the moonlets that carve gaps.` },
  { id: 'missions', number: '04', path: '/missions', title: 'Missions', summary: 'Four centuries of looking closer, from Galileo to Cassini — and Dragonfly next.' },
  { id: 'research', number: '05', path: '/research', title: 'Research', summary: 'The MIT PRIMES Saturn rings project, year by year.' },
]
