import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { collectSources } from '../content/saturn.js'
import { keyFacts, planetTable } from '../content/saturn.js'
import { Chapter, SectionHero, SourceNote, SourcesCard } from './SaturnPage.jsx'

const chapters = [
  { id: 'planet-glance', label: 'At a glance' },
  { id: 'planet-inside', label: 'Inside' },
  { id: 'planet-weather', label: 'Weather' },
  { id: 'planet-time', label: 'Seasons & day' },
  { id: 'planet-field', label: 'Magnetic field' },
]

export default function Planet() {
  return <article className="research-story saturn-page">
    <PageMeta title="The planet — Saturn at a glance" path="/planet" description="Saturn’s size, mass, interior, winds, polar hexagon, seasons, day length and magnetic field — each value linked to the NASA source it was checked against." />
    <SectionHero eyebrow="The planet" title="A giant made of gas." emphasis="Less dense than water." intro="Saturn is about 9.4 times as wide as Earth and 95 times as massive. Here is what spacecraft and telescopes have measured — with a source for every number." chapters={chapters} />

    <Chapter id="planet-glance" number="01" eyebrow="At a glance" title="Saturn in" emphasis="eight numbers." intro="Each value links to the source it was checked against.">
      <dl className="saturn-facts">{keyFacts.map(fact => <div key={fact.id}><dt>{fact.label}</dt><dd><span className="saturn-fact-value">{fact.value}</span><span className="saturn-fact-detail">{fact.detail}</span><SourceNote ids={fact.sources} /></dd></div>)}</dl>
    </Chapter>

    <Chapter id="planet-inside" number="02" eyebrow="Inside" title="No surface to stand on." emphasis="Only deeper, denser layers.">
      <div className="saturn-two-column">
        <div className="saturn-prose">
          <p>Saturn has no true surface. NASA describes a dense core of metals such as iron and nickel, surrounded by rocky material and enveloped by liquid metallic hydrogen inside a layer of liquid hydrogen. The core is similar to Jupiter’s, but considerably smaller.</p>
          <p>By volume, its atmosphere is about <strong>96% molecular hydrogen and 3% helium</strong>. Spread through its enormous volume, that mass gives Saturn an average density of <strong>0.687 g/cm³</strong> — the only planet in the solar system less dense than water.</p>
          <p>Saturn is also visibly flattened: its polar radius, 54,364 km, is about 10% smaller than its equatorial radius of 60,268 km.</p>
          <SourceNote ids={['nasaFacts', 'nssdc']} />
        </div>
        <div className="saturn-table-scroll" role="region" aria-labelledby="planet-table-caption" tabIndex={0}>
          <table className="saturn-table"><caption id="planet-table-caption">Measured values, as listed by the NSSDC</caption><tbody>{planetTable.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td className="numeric">{value}</td></tr>)}</tbody></table>
        </div>
      </div>
    </Chapter>

    <Chapter id="planet-weather" number="03" eyebrow="Weather" title="Winds more than four times" emphasis="faster than Earth’s strongest.">
      <div className="saturn-two-column">
        <div className="saturn-prose">
          <p>Saturn’s clouds appear as faint bands of yellow, brown and gray. Near the equator, winds in the upper atmosphere reach about <strong>500 m/s (1,800 km/h)</strong>. The strongest hurricane-force winds on Earth reach about 110 m/s.</p>
          <p>Around the north pole, a six-sided jet stream about <strong>30,000 km across</strong> carries winds of about 322 km/h. Voyager first noticed this hexagon in the early 1980s; Cassini observed it more closely.</p>
          <SourceNote ids={['nasaFacts']} />
        </div>
        <div className="saturn-panel">
          <p className="eyebrow">New in 2026</p>
          <h3>A ten-sided wave in the south.</h3>
          <p>For decades the hexagon had no southern counterpart. A study published in September 2026 reported Hubble observations of a giant, evolving, 10-sided wave encircling the south pole — the first large, regular-sided jet pattern seen in Saturn’s southern hemisphere.</p>
          <SourceNote ids={['nasaFacts']} />
        </div>
      </div>
    </Chapter>

    <Chapter id="planet-time" number="04" eyebrow="Seasons & day" title="Seven-year seasons." emphasis="A day measured by the rings.">
      <div className="saturn-two-column">
        <div className="saturn-prose">
          <p>Saturn’s axis is tilted <strong>26.73°</strong>, a little more than Earth’s 23.5°, so Saturn has seasons. One orbit takes 29.4 Earth years, so each season lasts about seven Earth years.</p>
          <p>Cassini watched the equinox in <strong>August 2009</strong>, when sunlight fell edge-on across the rings, and reached the northern summer solstice on <strong>May 24, 2017</strong>.</p>
          <SourceNote ids={['nssdc', 'nasaFacts', 'cassiniRings', 'cassiniTimeline']} />
        </div>
        <div className="saturn-panel">
          <p className="eyebrow">How long is a day?</p>
          <h3>10 h 33 min 38 s.</h3>
          <p>A planet without a surface has no landmark to time. Vibrations inside Saturn make waves in its rings; by modeling those waves, researchers measured the length of the day in 2019. As Cassini project scientist Linda Spilker put it, “The rings held the answer.” The NSSDC fact sheet still lists an earlier value, 10.656 hours.</p>
          <SourceNote ids={['dayLength', 'nssdc']} />
          <Link className="research-text-link" to="/rings">Explore the rings <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </Chapter>

    <Chapter id="planet-field" number="05" eyebrow="Magnetic field" title="A field lined up" emphasis="with its spin.">
      <div className="saturn-prose">
        <p>Saturn’s magnetic field is weaker than Jupiter’s but much stronger than Earth’s. Unusually, its magnetic axis is almost exactly aligned with its spin axis: the NSSDC lists the tilt between them as 0.0°.</p>
        <p>Saturn has aurorae near its poles. Some are driven by particles from its moons and by its rapid rotation rather than by the solar wind, and scientists do not yet fully understand them.</p>
        <SourceNote ids={['nasaFacts', 'nssdc']} />
      </div>
    </Chapter>

    <SourcesCard ids={collectSources(keyFacts.flatMap(fact => fact.sources), ['nasaFacts', 'nssdc', 'dayLength', 'cassiniTimeline'])}>
      <p>Values were checked against these pages in October 2026. Fact sheets are revised over time; if a value here disagrees with the current source, the source wins.</p>
    </SourcesCard>
    <nav className="saturn-next" aria-label="Continue exploring"><Link className="research-return-link" to="/rings">Continue to the rings <span aria-hidden="true">→</span></Link><Link className="research-text-link" to="/moons">Meet the moons <span aria-hidden="true">→</span></Link></nav>
  </article>
}
