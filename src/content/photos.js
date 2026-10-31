// Photographs on the section pages, from NASA and its mission partners.
// Every entry names the NASA page its title, date, credit and caption were
// checked against (October 2026). Images on NASA's own image service are
// loaded from NASA at a suitable size; `local` marks the three copies kept in
// this repository, each identified against its NASA page.
// `kind` says how the colors were made whenever they are not simply what a
// camera saw in one filter; illustrations are always labeled as such.

const NASA_FILES = 'https://assets.science.nasa.gov/content/dam/'
const NASA_RESIZED = 'https://assets.science.nasa.gov/dynamicimage/assets/'
const PIA = id => `${NASA_FILES}science/psd/photojournal/pia/${id.slice(0, 5).toLowerCase()}/${id.toLowerCase()}/${id}.jpg`

// NASA's image service resizes its own files with the same parameters its
// pages use; anything else (and renditions) is loaded as published.
export function photoSrc(photo, width = 1600) {
  if (photo.local) return photo.local
  const onNasaService = photo.file.startsWith(NASA_FILES) || photo.file.startsWith(NASA_RESIZED)
  if (!onNasaService || photo.file.includes('/jcr:content/')) return photo.file
  return `${photo.file.replace(NASA_FILES, NASA_RESIZED)}?w=${width}&h=${width}&fit=clip`
}

export const photos = {
  // The planet
  saturnFromAbove: {
    ref: 'PIA17474', title: 'Jewel of the Solar System', mission: 'Cassini', kind: 'Natural color', date: 'October 10, 2013',
    credit: 'NASA/JPL-Caltech/SSI/Cornell', page: 'https://science.nasa.gov/photojournal/jewel-of-the-solar-system', file: PIA('PIA17474'),
    caption: 'Saturn seen from high above its north pole, in a natural-color mosaic of 36 Cassini images. The six-sided jet stream circles the pole.',
    alt: 'Saturn seen from high above its north pole, its banded globe and polar hexagon circled by the main rings.',
  },
  hexagon: {
    ref: 'PIA21611', title: 'Saturn’s Hexagon as Summer Solstice Approaches', mission: 'Cassini', kind: 'Natural color', date: 'June 25, 2013 and April 25, 2017',
    credit: 'NASA/JPL-Caltech/Space Science Institute/Hampton University', page: 'https://science.nasa.gov/photojournal/saturns-hexagon-as-summer-solstice-approaches/', file: PIA('PIA21611'), fit: 'contain',
    caption: 'The north-polar hexagon in 2013 (left) and 2017 (right). Its interior turned from blue to mostly yellowish haze as northern summer approached.',
    alt: 'Two top-down views of Saturn’s six-sided polar jet stream: blue inside in 2013, mostly yellow with a blue center in 2017.',
  },
  greatStorm: {
    ref: 'PIA12826', title: 'Catching its Tail', mission: 'Cassini', kind: 'Natural color', date: 'February 25, 2011',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/catching-its-tail/', file: PIA('PIA12826'), fit: 'contain',
    caption: 'The great northern storm about 12 weeks after it began. It wrapped all the way around Saturn and overtook its own tail.',
    alt: 'Saturn with a band of bright, turbulent storm clouds circling its northern hemisphere.',
  },
  decagon: {
    ref: 'NASA page', title: 'Decagon on Saturn’s South Pole (Color)', mission: 'Hubble', kind: 'Color composite', date: 'August 29, 2025',
    credit: 'NASA, ESA, STScI, Agustin Sánchez-Lavega (UPV), Amy Simon (NASA-GSFC), Michael Wong (UC Berkeley); image processing: Alyssa Pagan',
    page: 'https://science.nasa.gov/asset/hubble/decagon-on-saturns-south-pole-color/',
    file: 'https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2026/09/STScI-01M0T8BARTCFQW684XQ932TNNM.png/jcr:content/renditions/2494x1247.jpg',
    caption: 'The whole planet (left) and the south pole (right), where a ten-sided wave circles the pole. A dashed circle marks missing data at the pole.',
    alt: 'Two Hubble views of Saturn: the whole banded planet, and its south pole ringed by a ten-sided pattern around a dark center.',
  },
  equinox: {
    ref: 'PIA11667', title: 'The Rite of Spring', mission: 'Cassini', kind: 'Natural color, rings and moons brightened', date: 'August 12, 2009',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/resource/the-rite-of-spring',
    file: 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/p/i/a/1/PIA11667-1.jpg',
    caption: 'Saturn about a day after the 2009 equinox, when sunlight fell edge-on across the rings. NASA brightened the dim rings and the moons so they show up beside the planet.',
    alt: 'Saturn at equinox seen from just above the rings, with the dim rings brightened and a few small moons.',
  },
  aurora: {
    ref: 'NASA page', title: 'Saturn and Its Aurora (Hubble)', mission: 'Hubble', kind: 'Ultraviolet aurora on a visible-light image', date: '2004',
    credit: 'NASA, ESA, John Clarke (Boston University), Zoltan Levay (STScI)', page: 'https://science.nasa.gov/asset/webb/saturn-and-its-aurora-hubble/',
    file: 'https://assets.science.nasa.gov/content/dam/science/missions/webb/science/2019/06/STScI-01EVSVE3VNSYF8J7J7AZ4P6NB8.jpg',
    caption: 'Hubble’s ultraviolet observations of the aurora, laid over a visible-light picture of the planet taken two months later.',
    alt: 'Saturn and its rings with a glowing ring of ultraviolet aurora at the pole.',
  },

  // The rings
  ringsFromAbove: {
    ref: 'PIA08388', title: 'On the Final Frontier', mission: 'Cassini', kind: 'Natural color', date: 'May 9, 2007',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/photojournal/on-the-final-frontier/', file: PIA('PIA08388'),
    caption: 'Saturn nested in its rings, seen from 39° above their unlit side in a natural-color mosaic of 45 Cassini images. From here the rings look darker than the planet, and their shadows fall across it.',
    alt: 'Saturn seen from above inside its broad rings, which look darker than the planet, with ring shadows crossing the planet.',
  },
  ringSweep: {
    ref: 'PIA11142', title: 'A Full Sweep of Saturn’s Rings (annotated)', mission: 'Cassini', kind: 'Natural color', date: 'November 26, 2008',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/photojournal/a-full-sweep-of-saturns-rings/',
    local: '/images/saturn/pia11142-ring-sweep-labeled.webp', width: 5689, height: 720,
    caption: 'One sweep across the rings, from the D and C rings to the F ring, built from 45 Cassini images and labeled by NASA. NASA’s labels round the boundaries; the table below uses the PDS values.',
    alt: 'A long natural-color strip of Saturn’s rings, labeled from left to right: D ring, Colombo Gap, C ring, Maxwell Gap, B ring, Cassini Division, A ring, Encke Gap, Keeler Gap and F ring.',
  },
  radioOccultation: {
    ref: 'PIA07873', title: 'Radio Occultation: Unraveling Saturn’s Rings', mission: 'Cassini radio science', kind: 'Simulated image, false color', date: 'May 3, 2005',
    credit: 'NASA/JPL', page: 'https://science.nasa.gov/photojournal/radio-occultation-unraveling-saturns-rings/',
    local: '/images/saturn/pia07873-radio-occultation.webp', width: 1600, height: 1200,
    caption: 'Built from Cassini’s first radio occultation of the rings — the same May 3, 2005 occultation as the Rev 007 profile in the explorer. Purple marks regions with few particles smaller than 5 cm; green and blue mark particles smaller than 5 cm and 1 cm. The white band, the densest part of the B ring, blocked two of the three radio signals.',
    alt: 'Simulated false-color view of Saturn’s rings in purple, green and blue bands, with a white band in the B ring.',
  },
  panInGap: {
    ref: 'PIA07587', title: 'Pan’s Corridor', mission: 'Cassini', date: 'August 1, 2005',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/photojournal/pans-corridor', file: PIA('PIA07587'),
    caption: 'Pan, 26 km across, in the Encke Gap. Two banded spiral density waves spread through the A ring at left.',
    alt: 'The small moon Pan in a dark gap between bright ring bands, with striped waves at left.',
  },
  daphnisWaves: {
    ref: 'PIA21056', title: 'Daphnis Up Close', mission: 'Cassini', date: 'January 16, 2017',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/daphnis-up-close/', file: PIA('PIA21056'),
    caption: 'Daphnis, about 8 km across, raises waves on the edges of the 42 km wide Keeler Gap.',
    alt: 'The tiny ridged moon Daphnis in a narrow ring gap, with ripples along the gap edges.',
  },
  prometheusStreamer: {
    ref: 'PIA10461', title: 'Opening a Channel', mission: 'Cassini', date: 'August 6, 2008',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/photojournal/opening-a-channel/', file: PIA('PIA10461'), fit: 'contain',
    caption: 'Prometheus pulls a faint streamer from the F ring. The channel from its previous pass has sheared into a dark diagonal.',
    alt: 'The moon Prometheus beside the thin, bright F ring, with a faint streamer and a dark diagonal channel.',
  },
  spokes: {
    ref: 'PIA10581', title: 'Spectacular Spokes', mission: 'Cassini', date: 'January 14, 2009',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/photojournal/spectacular-spokes', file: PIA('PIA10581'),
    caption: 'Three large bright spokes stretch across the B ring.',
    alt: 'Saturn’s rings with three bright streaks across the B ring.',
  },
  propeller: {
    ref: 'PIA21433', title: 'Cassini Targets a Propeller in Saturn’s A Ring', mission: 'Cassini', date: 'February 21, 2017',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/cassini-targets-a-propeller-in-saturns-a-ring', file: PIA('PIA21433'), fit: 'contain',
    caption: 'The propeller “Santos-Dumont” in the A ring, seen from the sunlit side (top) and the unlit side (bottom).',
    alt: 'Two stacked views of a propeller-shaped disturbance in the A ring, from the sunlit and unlit sides.',
  },
  bRingCloseUp: {
    ref: 'PIA21628', title: 'Colorful Structure at Fine Scales', mission: 'Cassini', kind: 'Natural color', date: 'July 6, 2017',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/colorful-structure-at-fine-scales/', file: PIA('PIA21628'),
    caption: 'The B ring from 98,600 to 105,500 km from Saturn’s center — the stretch in guided observation 05 — in one of the highest-resolution color images of the rings.',
    alt: 'A natural-color close-up of the B ring showing many narrow ringlets and broader bands.',
  },
  ringGrains: {
    ref: 'PIA06349', title: 'The Stuff of Rings', mission: 'Cassini VIMS', kind: 'False color', date: 'Released July 2, 2004',
    credit: 'NASA/JPL/University of Arizona', page: 'https://science.nasa.gov/photojournal/the-stuff-of-rings/',
    local: '/images/saturn/pia06349-ring-grain-sizes.webp', width: 720, height: 540, fit: 'contain',
    caption: 'A grain-size map from Cassini’s infrared spectrometer (right), beside a camera image of the rings. The ice grains on ring particles grow larger, and the ice purer, farther from Saturn.',
    alt: 'A camera image of Saturn’s rings beside a color-coded spectrometer map of the same rings, with a key from small to large grains.',
  },

  // The moons
  titan: {
    ref: 'PIA20016', title: 'Peering Through Titan’s Haze', mission: 'Cassini', kind: 'Infrared, false color', date: 'November 13, 2015',
    credit: 'NASA/JPL/University of Arizona/University of Idaho', page: 'https://science.nasa.gov/photojournal/peering-through-titans-haze', file: PIA('PIA20016'),
    caption: 'In infrared light Cassini could see through the haze; the dark, dune-filled regions form an “H”.',
    alt: 'An infrared false-color globe of Titan, where dark dune-filled regions form an H shape.',
  },
  enceladusPlume: {
    ref: 'PIA14599', title: 'Dark Moon, Dramatic Plume', mission: 'Cassini', date: 'February 20, 2012',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/dark-moon-dramatic-plume', file: PIA('PIA14599'),
    caption: 'A backlit plume of water ice sprays from below a darkened Enceladus.',
    alt: 'A darkened Enceladus with a backlit plume of water ice spraying out below it.',
  },
  mimas: {
    ref: 'PIA12570', title: 'Flying by the “Death Star” Moon', mission: 'Cassini', date: 'February 13, 2010',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/flying-by-the-death-star-moon/', file: PIA('PIA12570'),
    caption: 'The 130 km Herschel Crater dominates Mimas in this mosaic from Cassini’s closest flyby.',
    alt: 'Mimas, with the huge Herschel Crater dominating its face.',
  },
  pan: {
    ref: 'PIA21436', title: 'Pan Revealed', mission: 'Cassini', date: 'March 7, 2017',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/pan-revealed/', file: PIA('PIA21436'),
    caption: 'Pan’s northern and southern hemispheres, with its thin equatorial ridge.',
    alt: 'Two close-up views of the small moon Pan, showing its northern and southern hemispheres and thin equatorial ridge.',
  },
  prometheus: {
    ref: 'PIA17207', title: 'Prometheus Up Close', mission: 'Cassini', date: 'December 6, 2015',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/prometheus-up-close/', file: PIA('PIA17207'),
    caption: 'Prometheus’s pockmarked surface, with part of the F ring at the top.',
    alt: 'A close-up of Prometheus’s pockmarked surface, with part of the F ring at top.',
  },
  epimetheus: {
    ref: 'PIA17208', title: 'Examining Epimetheus', mission: 'Cassini', date: 'December 6, 2015',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/resource/examining-epimetheus',
    file: 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/i/IMG005281.jpg',
    caption: 'Epimetheus, about 116 km across, from the side that faces Saturn.',
    alt: 'A close-up of the small, irregular, cratered moon Epimetheus.',
  },
  iapetus: {
    ref: 'PIA11690', title: 'Global View of Iapetus’ Dichotomy', mission: 'Cassini', kind: 'Left globe in false color', date: '2004 and 2007',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://www.jpl.nasa.gov/images/pia11690-global-view-of-iapetus-dichotomy/',
    file: 'https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA11690.jpg',
    caption: 'The dark leading side (left) and the bright trailing side (right).',
    alt: 'Two globes of Iapetus side by side: the left dominated by very dark terrain, the right mostly bright.',
  },
  hyperion: {
    ref: 'PIA07740', title: 'Odd World', mission: 'Cassini', kind: 'False color', date: 'September 26, 2005',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/resource/odd-world/',
    file: 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/p/i/a/0/PIA07740-2.jpg',
    caption: 'Hyperion’s low density and high porosity preserve crisp crater shapes.',
    alt: 'A false-color view of Hyperion’s strange surface, covered in crisp craters.',
  },
  phoebe: {
    ref: 'PIA06064', title: 'The Face of Phoebe', mission: 'Cassini', date: 'June 11, 2004',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/photojournal/the-face-of-phoebe/', file: PIA('PIA06064'),
    caption: 'Phoebe from about 32,500 km, without enhancement; some bright areas are overexposed.',
    alt: 'A close-up mosaic of Phoebe’s dark, cratered surface, with a few overexposed bright areas.',
  },

  // Missions
  pioneer11: {
    ref: 'NASA page', title: 'Pioneer 11 at Saturn', mission: 'Pioneer 11', date: '1979',
    credit: 'NASA Ames', page: 'https://science.nasa.gov/resource/pioneer-11-at-saturn',
    file: 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/7/739460main_ac79-9107.3-1.jpg',
    caption: 'Saturn and its moon Titan from 2,846,000 km. Irregularities in the ring outline and shadow come from technical problems in the preliminary data.',
    alt: 'Saturn and its rings with the moon Titan nearby, seen by Pioneer 11.',
  },
  voyager1: {
    ref: 'PIA02225', title: 'Saturn Approach – Full Disk', mission: 'Voyager 1', date: 'October 18, 1980',
    credit: 'NASA/JPL-Caltech', page: 'https://science.nasa.gov/photojournal/saturn-approach-full-disk/',
    file: 'https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia02/pia02225/jpeg/PIA02225.jpg',
    caption: 'Taken from about 34 million km, on the last day Saturn and its rings fit in one narrow-angle frame. The moon Dione is just below the south pole.',
    alt: 'Saturn and its tilted rings, with ring shadows on the planet and the moon Dione as a bright spot below.',
  },
  voyager2: {
    ref: 'PIA00030', title: 'Saturn With Rhea and Dione (True Color)', mission: 'Voyager 2', kind: 'Natural color', date: 'July 21, 1981',
    credit: 'NASA/JPL', page: 'https://science.nasa.gov/photojournal/saturn-with-rhea-and-dione-true-color/', file: PIA('PIA00030'),
    caption: 'Rhea and Dione appear as small blue dots south and southeast of Saturn; dark spoke-like features cross the B ring.',
    alt: 'Saturn and its rings, with the moons Rhea and Dione as two small blue dots to the south and southeast.',
  },
  cassiniLaunch: {
    ref: 'NASA page', title: 'Cassini Processing and Launch Gallery', mission: 'Cape Canaveral', date: 'October 15, 1997',
    credit: 'NASA', page: 'https://www.nasa.gov/image-article/cassini-processing-launch-gallery-15',
    file: 'https://www.nasa.gov/wp-content/uploads/2023/03/97pc1547.jpg',
    caption: 'Liftoff of the Titan IVB/Centaur rocket carrying Cassini and its attached Huygens probe, at 4:43 a.m. EDT.',
    alt: 'A Titan IVB/Centaur rocket lifting off before dawn, carrying the Cassini spacecraft.',
  },
  huygensSurface: {
    ref: 'PIA07232', title: 'First Color View of Titan’s Surface', mission: 'Huygens probe', kind: 'Approximate natural color', date: 'January 14, 2005',
    credit: 'NASA/JPL/ESA/University of Arizona', page: 'https://science.nasa.gov/photojournal/first-color-view-of-titans-surface/', file: PIA('PIA07232'),
    caption: 'Pebble-sized objects on a dark surface of water and hydrocarbon ice. The two largest, below center, are about 15 cm and 4 cm across.',
    alt: 'Titan’s surface up close: dark ground scattered with pebble-sized objects, the two largest just below center.',
  },
  equinoxPeaks: {
    ref: 'PIA11668', title: 'The Tallest Peaks', mission: 'Cassini', date: 'July 26, 2009',
    credit: 'NASA/JPL/Space Science Institute', page: 'https://science.nasa.gov/photojournal/the-tallest-peaks/', file: PIA('PIA11668'),
    caption: 'Two weeks before equinox, structures up to 2.5 km high along the outer edge of the B ring cast long shadows.',
    alt: 'The curved edge of the B ring with spiky peaks casting long dark shadows across the ring.',
  },
  farewell: {
    ref: 'PIA17218', title: 'A Farewell to Saturn', mission: 'Cassini', kind: 'Natural color', date: 'September 13, 2017',
    credit: 'NASA/JPL-Caltech/Space Science Institute', page: 'https://science.nasa.gov/photojournal/a-farewell-to-saturn/', file: PIA('PIA17218'),
    caption: 'Saturn from about 1.1 million km, two days before Cassini’s final plunge, in a natural-color mosaic of 42 frames.',
    alt: 'Saturn and its rings seen from slightly above the ring plane, with tiny moons nearby.',
  },
  dragonfly: {
    ref: 'NASA page', title: 'Dragonfly Rotors', mission: 'Dragonfly', kind: 'Illustration', date: 'Mission planned',
    credit: 'NASA/Johns Hopkins APL', page: 'https://science.nasa.gov/image-detail/amf-c81040f4-4cee-4248-baf0-aba2222d90aa/',
    file: 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/planetary-science-division/2025/Dragonfly_InForLanding.jpg',
    caption: 'An artist’s concept of Dragonfly’s rotors in action over Titan.',
    alt: 'Illustration of NASA’s Dragonfly rotorcraft flying over Titan.',
  },
}
