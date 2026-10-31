import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { collectSources } from '../content/saturn.js'
import { missionEras } from '../content/missions.js'
import { photos } from '../content/photos.js'
import { Photo, SectionHero, SourceNote, SourcesCard } from './SaturnPage.jsx'

const chapters = missionEras.map(era => ({ id: `missions-${era.id}`, label: era.title }))

export default function Missions() {
  return <article className="research-story saturn-page">
    <PageMeta title="Missions — four centuries of looking closer" path="/missions" description="From Galileo’s telescope to Pioneer 11, Voyager, Cassini–Huygens and NASA’s Dragonfly: a sourced timeline of how we came to know Saturn." />
    <SectionHero eyebrow="Missions" title="Four centuries" emphasis="of looking closer." intro="From a puzzling shape in Galileo’s telescope to Cassini’s final plunge — and a rotorcraft headed for Titan. Every entry links to the page it was checked against." chapters={chapters} />
    {missionEras.map(era => <section className="mission-era" id={`missions-${era.id}`} key={era.id} aria-labelledby={`missions-${era.id}-title`}>
      <header><span>{era.number}</span><h2 id={`missions-${era.id}-title`}>{era.title}</h2></header>
      <ol className="mission-timeline">{era.entries.map(entry => <li key={`${entry.date}-${entry.title}`} className={`mission-entry${entry.upcoming ? ' is-upcoming' : ''}`}>
        <p className="mission-date">{entry.date}{entry.upcoming && <><br />Planned</>}</p>
        <div>
          <h3>{entry.title}</h3>
          <p>{entry.text}</p>
          {entry.link && <Link className="research-text-link" to={entry.link.to}>{entry.link.label} <span aria-hidden="true">→</span></Link>}
          {entry.photo && <Photo photo={photos[entry.photo]} variant="inline" />}
          <SourceNote ids={entry.sources} />
        </div>
      </li>)}</ol>
    </section>)}
    <SourcesCard ids={collectSources(missionEras.flatMap(era => era.entries.flatMap(entry => entry.sources)))}>
      <p>Mission dates are given as NASA reports them; times near midnight can fall on different calendar days in different time zones. Plans for future missions can change.</p>
    </SourcesCard>
    <nav className="saturn-next" aria-label="Continue exploring"><Link className="research-return-link" to="/research">See the research <span aria-hidden="true">→</span></Link><Link className="research-text-link" to="/rings">Explore the rings <span aria-hidden="true">→</span></Link></nav>
  </article>
}
