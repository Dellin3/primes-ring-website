import { formatObservationDate, observations } from './rings.js'

// Dates and descriptions follow the cited NASA and mission pages.
export const missionEras = [
  {
    id: 'telescopes', number: '01', title: 'Through the telescope',
    entries: [
      { date: 'July 1610', title: 'Galileo sees something strange', text: 'Galileo saw Saturn’s rings through his telescope but could not make out their shape; he took them for a “triple planet”.', sources: ['exploration'] },
      { date: '1655', title: 'Huygens finds the rings and Titan', text: 'Christiaan Huygens recognized the rings and discovered Saturn’s largest moon, Titan.', sources: ['exploration'] },
      { date: '1675', title: 'A division in the rings', text: 'Giovanni Domenico Cassini identified a division between the A and B rings — the Cassini Division.', sources: ['exploration'], link: { to: '/rings#guided-cassini-division', label: 'Find it in Cassini radio data' } },
    ],
  },
  {
    id: 'flybys', number: '02', title: 'The first spacecraft',
    entries: [
      { date: 'September 1, 1979', title: 'Pioneer 11', photo: 'pioneer11', text: 'The first spacecraft to reach Saturn. It discovered the F ring and a new moon.', sources: ['exploration'] },
      { date: 'November 1980', title: 'Voyager 1', photo: 'voyager1', text: 'Showed that the broad rings are made of thousands of narrow ringlets, tied the braided F ring to two shepherd moons, and passed within about 6,500 km of Titan to measure its thick nitrogen atmosphere.', sources: ['voyager1'] },
      { date: '1981', title: 'Voyager 2', photo: 'voyager2', text: 'Flew within about 42,000 km of Saturn’s cloud tops and returned 16,000 images of the planet, its rings and moons, including the shepherd moons Prometheus and Pandora.', sources: ['voyager2'] },
    ],
  },
  {
    id: 'cassini', number: '03', title: 'Cassini–Huygens',
    entries: [
      { date: 'October 15, 1997', title: 'Launch', photo: 'cassiniLaunch', text: 'Cassini–Huygens left Cape Canaveral on a Titan IVB/Centaur rocket for a journey of nearly seven years, flying past Venus twice, then Earth and Jupiter, on the way.', sources: ['cassiniTimeline'] },
      { date: 'July 1, 2004', title: 'The first Saturn orbiter', text: 'Cassini entered orbit around Saturn (June 30 in California, where the mission was operated).', sources: ['cassiniTimeline', 'exploration'] },
      { date: 'January 14, 2005', title: 'Huygens lands on Titan', photo: 'huygensSurface', text: 'The Huygens probe made the first soft landing on a moon of another planet.', sources: ['exploration', 'cassiniTimeline'] },
      { date: `${formatObservationDate(observations[0])} – ${formatObservationDate(observations.at(-1))}`, title: 'The six radio profiles on this site', text: `Cassini’s Radio Science Subsystem recorded the ring occultations in this website’s data explorer on ${observations.map(observation => formatObservationDate(observation)).join('; ')}.`, sources: ['pdsRss'], link: { to: '/datasets', label: 'All six observations' } },
      { date: 'September 17, 2006', title: 'A new faint ring', text: 'A ring sharing the orbits of the moons Janus and Epimetheus was discovered.', sources: ['exploration'] },
      { date: 'August 10–11, 2009', title: 'Equinox', photo: 'equinoxPeaks', text: 'Sunlight hit the rings exactly edge-on. Countless icy clumps cast long shadows across them; some were as tall as the Rocky Mountains.', sources: ['cassiniRings', 'cassiniTimeline'] },
      { date: 'April 26 – September 15, 2017', title: 'The Grand Finale', photo: 'farewell', text: 'Cassini made 22 dives through the gap between Saturn and its rings, then ended its mission with a planned plunge into Saturn’s atmosphere.', sources: ['cassiniTimeline', 'exploration'] },
    ],
  },
  {
    id: 'after', number: '04', title: 'Since Cassini',
    entries: [
      { date: 'January 2019', title: 'A day measured by the rings', text: 'By modeling waves that vibrations inside Saturn create in its rings, researchers found that a day on Saturn lasts 10 hours, 33 minutes and 38 seconds.', sources: ['dayLength'] },
      { date: 'September 2026', title: 'A ten-sided wave in the south', photo: 'decagon', text: 'A study published in September 2026, using Hubble observations dating back to 2023, reported a 10-sided wave around Saturn’s south pole — the first large, regular-sided jet pattern seen in the southern hemisphere.', sources: ['nasaFacts'] },
      { date: 'No earlier than July 2028', title: 'Dragonfly', photo: 'dragonfly', text: 'NASA’s Dragonfly, a car-sized lander with eight rotors, is planned to launch no earlier than July 2028. After a cruise of roughly six to seven years it will fly between dozens of landing sites on Titan.', sources: ['dragonfly', 'dragonflyReview'], upcoming: true },
    ],
  },
]
