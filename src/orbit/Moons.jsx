import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { collectSources } from '../content/saturn.js'
import { moonCount } from '../content/saturn.js'
import { formatPublished, moonColumns, moonGroups, moonHighlights, moons, moonsCsvPath, sortMoons } from '../content/moons.js'
import { photos } from '../content/photos.js'
import { Chapter, Photo, SectionHero, SourceNote, SourcesCard } from './SaturnPage.jsx'

const chapters = [
  { id: 'moons-worlds', label: 'Worlds to know' },
  { id: 'moons-compare', label: 'Compare' },
  { id: 'moons-count', label: 'Counting moons' },
]
const filters = [
  { id: 'all', label: 'All sixteen', groups: Object.keys(moonGroups) },
  { id: 'rings', label: 'In and near the rings', groups: ['ring', 'coorbital'] },
  { id: 'major', label: 'Major moons', groups: ['major'] },
  { id: 'outer', label: 'Small outer moons', groups: ['outer', 'irregular'] },
]
const byId = Object.fromEntries(moons.map(moon => [moon.id, moon]))
const highlightPhotos = { titan: photos.titan, enceladus: photos.enceladusPlume, mimas: photos.mimas, 'pan-daphnis': photos.pan, shepherds: photos.prometheus, coorbitals: photos.epimetheus, iapetus: photos.iapetus, hyperion: photos.hyperion, phoebe: photos.phoebe }

function MoonFact({ id }) {
  const moon = byId[id]
  if (!moon) return null
  return <span>{moon.name}: {moon.radius ? `${formatPublished(moon.radius)} km mean radius · ` : ''}{formatPublished(moon.a)} km from Saturn</span>
}

function MoonTable() {
  const [sort, setSort] = useState({ key: 'a', direction: 'ascending' })
  const [filter, setFilter] = useState('all')
  const groups = filters.find(item => item.id === filter).groups
  const rows = useMemo(() => sortMoons(moons.filter(moon => groups.includes(moon.group)), sort.key, sort.direction), [groups, sort])
  const sortLabel = moonColumns.find(column => column.key === sort.key).sortName
  function sortBy(key) {
    setSort(current => ({ key, direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending' }))
  }
  return <>
    <div className="saturn-table-tools">
      <fieldset className="saturn-filter"><legend>Show</legend>{filters.map(item => <label key={item.id} className={item.id === filter ? 'is-selected' : undefined}><input type="radio" name="moon-filter" value={item.id} checked={item.id === filter} onChange={() => setFilter(item.id)} />{item.label}</label>)}</fieldset>
      <a className="saturn-download" href={moonsCsvPath} download>Download the table as CSV <span aria-hidden="true">↓</span></a>
    </div>
    <div className="saturn-table-scroll" role="region" aria-labelledby="moon-table-caption" tabIndex={0}>
      <table className="saturn-table saturn-table-wide">
        <caption id="moon-table-caption">{rows.length} of Saturn’s moons, sorted by {sortLabel} ({sort.direction})</caption>
        <thead><tr>{moonColumns.map(column => <th key={column.key} scope="col" className={column.numeric && !column.alignStart ? 'numeric' : undefined} aria-sort={sort.key === column.key ? sort.direction : 'none'}><button type="button" className="saturn-sort" onClick={() => sortBy(column.key)}>{column.label}{column.unit && <small>{column.unit}</small>}<span aria-hidden="true">{sort.key === column.key ? (sort.direction === 'ascending' ? '▲' : '▼') : '↕'}</span></button></th>)}</tr></thead>
        <tbody>{rows.map(moon => <tr key={moon.id}>
          <th scope="row" className="saturn-cell-name">{moon.name}<small>{moonGroups[moon.group]}</small></th>
          <td className="numeric">{moon.radius ? formatPublished(moon.radius) : <span className="muted-cell" title={moon.note}>—<span className="sr-only">{moon.note}</span></span>}</td>
          <td className="numeric">{formatPublished(moon.a)}</td>
          <td className="numeric">{formatPublished(moon.period)}</td>
          <td className="numeric">{moon.density ? formatPublished(moon.density) : <span className="muted-cell">—<span className="sr-only">not listed</span></span>}</td>
          <td className="saturn-cell-text">{moon.year}<small>{moon.discoverers}</small></td>
        </tr>)}</tbody>
      </table>
    </div>
  </>
}

export default function Moons() {
  return <article className="research-story saturn-page">
    <PageMeta title="The moons — Saturn’s moons compared" path="/moons" description={`Saturn has ${moonCount.value} confirmed moons (NASA, ${moonCount.asOf}). Meet Titan, Enceladus and the moons inside the rings, and compare sixteen moons in a sortable, downloadable table.`} />
    <SectionHero eyebrow="The moons" title={`${moonCount.value} moons.`} emphasis="A few worth knowing." intro={`Saturn has more confirmed moons than any other planet — ${moonCount.value} as of ${moonCount.asOf}, according to NASA. Most are small and far away. A handful are worlds in their own right, and some live inside the rings.`} chapters={chapters} />

    <Chapter id="moons-worlds" number="01" eyebrow="Worlds to know" title="Oceans, haze," emphasis="and moons inside the rings.">
      <div className="moon-highlights">{moonHighlights.map(item => <article className="moon-highlight" key={item.id} id={`moon-${item.id}`}>
        {highlightPhotos[item.id] && <Photo photo={highlightPhotos[item.id]} variant="card" />}
        <p className="moon-names">{item.names.join(' & ')}</p>
        <h3>{item.headline}</h3>
        <p>{item.text}</p>
        <p className="moon-fact">{item.names.map(name => name.toLowerCase()).map(id => <MoonFact key={id} id={id} />).reduce((list, node, index) => index ? [...list, <br key={`br-${index}`} />, node] : [node], [])}</p>
        {item.ring && <Link className="research-text-link" to={item.ring.to}>{item.ring.label} <span aria-hidden="true">→</span></Link>}
        <SourceNote ids={item.sources} />
      </article>)}</div>
    </Chapter>

    <Chapter id="moons-compare" number="02" eyebrow="Compare" title="Sixteen moons," emphasis="side by side." intro="Sort by size, distance, orbital period or density. Values are published by NASA’s Jet Propulsion Laboratory; discovery records come from NASA’s moon list.">
      <MoonTable />
      <p className="saturn-figure-note">Distances and periods are JPL mean orbital elements (Laplace plane, epoch 2000-01-01.5 TDB). JPL notes they are not intended for computing positions; use JPL Horizons for that. Daphnis has no mean radius in the JPL table; the NSSDC gives its dimensions as 4.3 × 4.1 × 3.2 km.</p>
      <SourceNote ids={['jplPhysical', 'jplElements', 'nasaMoons', 'nssdcMoons']} />
    </Chapter>

    <Chapter id="moons-count" number="03" eyebrow="Counting moons" title="Why the number" emphasis="keeps changing.">
      <div className="saturn-prose">
        <p>Astronomers keep finding small, distant moons and confirming their orbits. An announcement of 128 new moons in March 2025 brought Saturn’s total to {moonCount.previous.value}; by {moonCount.asOf}, NASA’s list had reached {moonCount.value}.</p>
        <p>Expect the number to change again. If you cite it, give the date and the source.</p>
        <SourceNote ids={['nssdcMoons', 'nasaMoons']} />
      </div>
    </Chapter>

    <SourcesCard ids={collectSources(moonHighlights.flatMap(item => item.sources), ['jplPhysical', 'jplElements', 'nasaMoons', 'nssdcMoons'])}>
      <p>The downloadable table lists every source in its header. Radii and densities follow JPL’s Planetary Satellite Physical Parameters; orbits follow JPL’s Planetary Satellite Mean Elements.</p>
    </SourcesCard>
    <nav className="saturn-next" aria-label="Continue exploring"><Link className="research-return-link" to="/missions">Continue to the missions <span aria-hidden="true">→</span></Link><Link className="research-text-link" to="/rings">Back to the rings <span aria-hidden="true">→</span></Link></nav>
  </article>
}
