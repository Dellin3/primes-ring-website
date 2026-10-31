# Project Research story — 2026-09-22

This revision replaces the previous summary-card page with four connected
chapters: question, method, evidence, and team. Data, Notebook, their persistence
and exports, and the three homepage destinations retain their existing behavior.

## Narrative and author attribution

Source: owner-supplied 23-page `Saturn_s_Rings___PRIMES_2026___Master_Doc (40).pdf`.
See TEAM_RESEARCH_EVIDENCE.md for its SHA-256 and numerical audit.

The manuscript's p. 3 acknowledgment attributes Padé and adaptive least-squares
work to Yutong Zhao; least-squares, PAC, introduction/background and report
compilation/editing to Maiya Qiu; primary writing of §§4–6 (branch bookkeeping,
fold verification, SPA reliability) to Dell Li. Dr. Ryan Maguire proposed and
mentored the project. Public prose preserves that distinction and does not assign
sole implementation ownership.

The archive viewer and numerical experiments are distinct. Six DLP products
are available for inspection; synthetic branch tests and the stated Rev 133
scalar geometry inform the research results. No end-to-end optical-depth
reconstruction, 20 m/50 m achieved resolution, full-six-product benchmark, or
runtime speedup is claimed. Table 3's whole-grid worst switched discrepancy
remains 2.2872%, including the retained-SPA point at 0.3 km.

## Real camera imagery

- `public/images/research/cassini-saturn-shadow.webp`: PIA17172, The Day the Earth
  Smiled. NASA/JPL-Caltech/SSI. https://www.jpl.nasa.gov/images/pia17172-the-day-the-earth-smiled/
  July 19, 2013 camera mosaic; original image brightens faint objects and outer
  rings. Resized and encoded as WebP without changing color interpretation.
- `public/images/research/cassini-ring-waves.webp`: PIA21060, Moon Waves and Moon
  Wakes. NASA/JPL-Caltech/Space Science Institute.
  https://www.jpl.nasa.gov/images/pia21060-moon-waves-and-moon-wakes/
  December 18, 2016 A-ring camera view, approximately 340 m per image pixel.
  This is contextual photography, not a radio reconstruction or project output.
- Educational image-use guidance: https://www.jpl.nasa.gov/jpl-image-use-policy/
- Radio-occultation explanation:
  https://www.jpl.nasa.gov/news/cassini-radio-signals-decipher-saturn-ring-structure/
- Calibrated profile/reconstruction distinction: https://pds-rings.seti.org/cassini/rss/

## Selected manuscript figures

Only these bounded scientific figures are reproduced; the full PDF remains
outside the repository. Axes, legends, annotations, and original colors are
preserved. Page images used for inspection are scratch intermediates.

- Figure 14, p. 16: synthetic PAC continuation and PCHIP interpolation. Source
  equation is `(y³ + xy + 1)(y² + 2xy + 2) = 0`; figure axes are not Cassini
  radii. Blue PAC, red interpolated grid points, pale comparison curve.
- Figure 16, p. 17: independent nearest versus one-to-one synthetic matching.
  Five samples are visible; the nine incorrect links refer to the full ten-sample
  case. Matching changes histories, not the candidate roots.
- Figure 17, p. 19: local stationary pair and derivative-predicted squared
  separation in the stated scalar geometry. The plot rounds the reported
  0.001345% slope difference to 0.00135%.

## Mathematics and interaction

KaTeX 0.18.7 is bundled locally with its fonts, not loaded from a third-party
runtime CDN. Expressions are author-owned TeX strings; HTML and MathML output
are produced together, with trust disabled and parse errors treated as errors.
The root behavior illustration uses the existing tested teaching equation only.
The eight-point local-integral chart displays transcribed evidence, not a rerun
of the scientific solver. Anchor navigation and details keep the reading path
inside Project Research; external image/source links open the verified sources.
