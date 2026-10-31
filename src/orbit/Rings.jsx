import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { explorerHref, findObservation, formatObservationDate, glossary, guidedObservations, mapObservation, mapWindow, observations, ringRegions, shortName } from '../content/rings.js'
import { photos } from '../content/photos.js'
import { Chapter, Outbound, Photo, PhotoGallery, PhotoStrip, SectionHero, SourceNote, SourcesCard } from './SaturnPage.jsx'
import RingMap from './RingMap.jsx'

const chapters = [
  { id: 'rings-map', label: 'To scale' },
  { id: 'rings-moons', label: 'Moons & gaps' },
  { id: 'rings-reading', label: 'Reading a signal' },
  { id: 'guided', label: 'Try it yourself' },
  { id: 'rings-age', label: 'An open question' },
]
const km = value => Math.round(value).toLocaleString('en-US')

function GuidedObservation({ item, index }) {
  const observation = findObservation(item.slug)
  const compare = item.compareSlug && findObservation(item.compareSlug)
  return <li className="guided-item" id={`guided-${item.id}`}>
    <span className="guided-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
    <div>
      <h3>{item.title}</h3>
      <p className="guided-question">{item.question}</p>
      <dl>
        <div><dt>Where to look</dt><dd>{shortName(item.slug)} ({formatObservationDate(observation)}), {km(item.range[0])}–{km(item.range[1])} km{compare ? `; then ${shortName(item.compareSlug)} (${formatObservationDate(compare)})` : ''}.</dd></div>
        <div><dt>What to do</dt><dd>{item.look}</dd></div>
        <div><dt>What the data show</dt><dd>{item.notice}</dd></div>
        <div><dt>Keep in mind</dt><dd>{item.caution}</dd></div>
      </dl>
      <div className="guided-actions">
        <Link className="research-text-link" to={explorerHref(item.slug, item.range)}>Open {shortName(item.slug)} at this window <span aria-hidden="true">→</span></Link>
        {compare && <Link className="research-text-link" to={explorerHref(item.compareSlug, item.range)}>Open {shortName(item.compareSlug)} at the same window <span aria-hidden="true">→</span></Link>}
      </div>
    </div>
  </li>
}

export default function Rings() {
  return <article className="research-story saturn-page">
    <PageMeta title="The rings — mapped to scale, read through real Cassini data" path="/rings" description="Saturn’s rings and gaps to scale, the moons that shape them, how Cassini’s radio signals measured them, and five guided observations in real Cassini data." />
    <SectionHero eyebrow="The rings" title="Billions of pieces of ice." emphasis="One thin, bright plane." intro="Saturn’s main rings are almost entirely water ice, in pieces from smaller than a grain of sand to the size of a mountain — and generally only about 10 meters thick. See them to scale, then read six real Cassini radio observations yourself." sources={['cassiniRings']} chapters={chapters} />
    <Photo photo={photos.ringsFromAbove} variant="hero" />

    <Chapter id="rings-map" number="01" eyebrow="To scale" title="From the D ring" emphasis="to the F ring." intro="Ring radii are measured from Saturn’s center. Brighter bands block more light; dark notches are gaps. Select any ring or gap to open that region in the data explorer.">
      <RingMap />
      <PhotoStrip photo={photos.ringSweep} />
      <div className="saturn-table-scroll ring-table" id="ring-table" role="region" aria-labelledby="ring-table-caption" tabIndex={0}>
        <table className="saturn-table saturn-table-wide">
          <caption id="ring-table-caption">Saturn’s rings and gaps, from the NASA PDS Ring-Moon Systems Node</caption>
          <thead><tr><th scope="col">Feature</th><th scope="col" className="numeric">Inner radius (km)</th><th scope="col" className="numeric">Outer radius (km)</th><th scope="col">Typical optical depth</th><th scope="col">Notes</th><th scope="col">Explore</th></tr></thead>
          <tbody>{ringRegions.map(region => {
            const range = region.kind === 'faint' ? null : mapWindow(region)
            return <tr key={region.id}>
              <th scope="row">{region.name}</th>
              <td className="numeric">{km(region.inner)}</td>
              <td className="numeric">{km(region.outer)}</td>
              <td>{region.opticalDepth}</td>
              <td className="saturn-cell-text">{region.note}{region.siteNote && <small>{region.siteNote}</small>}</td>
              <td className="saturn-cell-action">{range ? <Link to={explorerHref(mapObservation, range)}>Open in {shortName(mapObservation)}<span className="sr-only"> the {region.name}</span></Link> : <span className="muted-cell">Beyond these profiles</span>}</td>
            </tr>
          })}</tbody>
        </table>
      </div>
      <SourceNote ids={['ringTable']} />
    </Chapter>

    <Chapter id="rings-moons" number="02" eyebrow="Moons & gaps" title="Moons carve the gaps." emphasis="Some hide inside the rings.">
      <div className="saturn-two-column">
        <div className="saturn-prose">
          <p><strong>Pan</strong> orbits inside the Encke Gap and <strong>Daphnis</strong> inside the Keeler Gap; each keeps its gap open. The PDS ring table associates the Huygens Gap, at the inner edge of the Cassini Division, with <strong>Mimas</strong>.</p>
          <p>The narrow F ring is herded by the shepherd moons <strong>Prometheus</strong> and <strong>Pandora</strong>. Far beyond the main rings, ice from the jets of <strong>Enceladus</strong> supplies the faint E ring.</p>
          <p>Cassini watched some moons take particles from the rings and others add to them.</p>
          <SourceNote ids={['ringTable', 'voyager2', 'enceladus', 'cassiniRings']} />
          <Link className="research-text-link" to="/moons">Meet the moons <span aria-hidden="true">→</span></Link>
        </div>
        <div className="saturn-panel">
          <p className="eyebrow">Not everything is a moon</p>
          <h3>Spokes and propellers.</h3>
          <p><strong>Spokes</strong> are fleeting streaks across the rings, thought to be made of tiny ice particles lifted above the ring surface. They can be longer than 16,000 km — wider than Earth — and can form in about the time it takes to eat breakfast.</p>
          <p><strong>Propellers</strong> are disturbances made by moonlets about 1 km across, which launch the surrounding ring particles tens to hundreds of meters above and below the ring plane.</p>
          <SourceNote ids={['cassiniRings']} />
        </div>
      </div>
      <PhotoGallery items={[photos.panInGap, photos.daphnisWaves, photos.prometheusStreamer, photos.spokes, photos.propeller, photos.equinoxPeaks]} label="Moons, gaps, spokes, propellers and ring peaks in Cassini images" />
    </Chapter>

    <Chapter id="rings-reading" number="03" eyebrow="Reading a signal" title="A radio signal" emphasis="through the rings." intro="Cassini repeatedly sent radio signals through the rings toward Earth. Where the rings held more material, less signal came through. Six of those recordings, made between 2005 and 2010, are on this site, from the NASA Planetary Data System.">
      <dl className="saturn-glossary">{glossary.map(entry => <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.definition}</dd></div>)}</dl>
      <Photo photo={photos.radioOccultation} />
      <div className="saturn-next is-inline">
        <Link className="research-text-link" to="/data">Open the data explorer <span aria-hidden="true">→</span></Link>
        <Link className="research-text-link" to="/datasets">All six observations and how to cite them <span aria-hidden="true">→</span></Link>
        <Link className="research-text-link" to="/research/2026">How the PRIMES team studies these signals <span aria-hidden="true">→</span></Link>
      </div>
    </Chapter>

    <Chapter id="guided" number="04" eyebrow="Try it yourself" title="Five guided observations" emphasis="in real Cassini data." intro={`Each link opens the data explorer at a chosen window. The numbers below were measured from the same exact samples you will see. The six profiles were recorded between ${formatObservationDate(observations[0])} and ${formatObservationDate(observations.at(-1))}.`}>
      <ol className="guided-list">{guidedObservations.map((item, index) => <GuidedObservation key={item.id} item={item} index={index} />)}</ol>
      <Photo photo={photos.bRingCloseUp} />
      <p className="saturn-figure-note">Save what you notice in your notebook from the explorer. Your notes stay in this browser.</p>
    </Chapter>

    <Chapter id="rings-age" number="05" eyebrow="An open question" title="How old" emphasis="are the rings?">
      <div className="saturn-two-column">
        <div className="saturn-prose">
          <p>Cassini found the rings remarkably clean: more than 99% water ice. Dust falling in from space should slowly darken them, so studies in the 2010s and 2020s estimated that the rings are no more than a few hundred million years old — far younger than Saturn.</p>
          <p>A 2024 study in <em>Nature Geoscience</em> argued that incoming micrometeoroids hit the rings so fast that they vaporize, and the vapor is swept away instead of darkening the rings. If so, the rings could have stayed clean for billions of years, possibly as long as the solar system has existed. Both ideas are still being tested.</p>
          <SourceNote ids={['ringAge', 'ringAgePaper']} />
        </div>
        <Photo photo={photos.ringGrains} variant="side" />
      </div>
    </Chapter>

    <SourcesCard ids={['ringTable', 'cassiniRings', 'voyager2', 'enceladus', 'ringAge', 'ringAgePaper', 'pdsRss']}>
      <p>Measurements in the guided observations come from the archived Cassini RSS profiles on this site and are checked automatically against those files. Ring radii and typical optical depths come from the PDS ring table.</p>
    </SourcesCard>
    <nav className="saturn-next" aria-label="Continue exploring"><Link className="research-return-link" to="/data">Open the data explorer <span aria-hidden="true">→</span></Link><Link className="research-text-link" to="/moons">Meet the moons <span aria-hidden="true">→</span></Link><Outbound href="https://pds-rings.seti.org/cassini/rss/">Original Cassini RSS archive</Outbound></nav>
  </article>
}
