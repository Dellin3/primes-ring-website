import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { photoSrc, photos } from '../../content/photos.js'
import { moonCount, sections } from '../../content/saturn.js'
import { usePointerDepth } from '../../lib/motion.js'

const summary = id => sections.find(section => section.id === id)?.summary

// Credits stay with every photograph; the tiles are navigation, not evidence.
function TilePhoto({ photo, width, src, credit = true }) {
  return <span className="explore-photo"><img src={src || photoSrc(photo, width)} alt="" loading="lazy" decoding="async" />{credit && <span className="explore-credit" aria-hidden="true">{photo.credit} · {photo.ref}</span>}</span>
}
const Credit = ({ photo }) => <span className="explore-credit" aria-hidden="true">{photo.credit} · {photo.ref}</span>

const research = { credit: 'NASA/JPL-Caltech/SSI', ref: 'The Day the Earth Smiled' }

export default function ContinueExploring() {
  const featureRef = useRef(null)
  usePointerDepth(featureRef, 8)
  return <section className="home-band home-explore" aria-labelledby="explore-title">
    <div className="home-band-inner">
      <header className="explore-head" data-reveal>
        <p className="home-kicker"><span className="mono">04</span> Continue exploring</p>
        <h2 id="explore-title">Start with the rings. <em>Then the rest of Saturn.</em></h2>
      </header>
      <nav className="explore-grid" aria-label="Sections of the site" data-reveal>
        <Link className="explore-tile is-feature" to="/rings" ref={featureRef}>
          <TilePhoto photo={photos.ringsFromAbove} width={1400} />
          <span className="explore-copy">
            <span className="explore-label">The rings</span>
            <span className="explore-title">Mapped to scale, and read in six real Cassini observations.</span>
            <span className="explore-text">{summary('rings')} Start with the to-scale map, then try the five guided observations.</span>
            <span className="explore-cta">Explore the rings <span aria-hidden="true">→</span></span>
          </span>
        </Link>
        <Link className="explore-tile is-medium" to="/planet">
          <TilePhoto photo={photos.saturnFromAbove} width={900} />
          <span className="explore-copy"><span className="explore-label">The planet</span><span className="explore-text">{summary('planet')}</span></span>
        </Link>
        <Link className="explore-tile is-medium" to="/research">
          <TilePhoto photo={research} src="/images/research/cassini-saturn-shadow.webp" />
          <span className="explore-copy"><span className="explore-label">Research</span><span className="explore-text">{summary('research')}</span></span>
        </Link>
        <Link className="explore-tile is-small" to="/moons">
          <TilePhoto photo={photos.enceladusPlume} width={600} credit={false} />
          <span className="explore-copy"><span className="explore-label">The moons</span><span className="explore-text">{moonCount.value} confirmed, from ocean worlds to gap-carving moonlets.</span><Credit photo={photos.enceladusPlume} /></span>
        </Link>
        <Link className="explore-tile is-small" to="/missions">
          <TilePhoto photo={photos.farewell} width={600} credit={false} />
          <span className="explore-copy"><span className="explore-label">Missions</span><span className="explore-text">{summary('missions')}</span><Credit photo={photos.farewell} /></span>
        </Link>
      </nav>
    </div>
  </section>
}
