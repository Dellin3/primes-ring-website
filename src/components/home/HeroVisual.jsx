import { useId } from 'react'

export function HeroSceneAnnotations() {
  return (
    <div className="hero-figure-labels" aria-hidden="true">
      <span data-annotation="cassini">Cassini</span>
      <span data-annotation="rings">Ring plane</span>
      <span data-annotation="earth">Earth<br />receiver</span>
    </div>
  )
}

export function HeroAnnotationLeaders({ pathsRef }) {
  return (
    <svg className="hero-annotation-leaders" viewBox="0 40 800 460" aria-hidden="true">
      <path ref={pathsRef ? (element) => { pathsRef.current.cassini = element } : undefined} data-leader="cassini" d="M133.333 40 L133.333 92 L70 136" />
      <path ref={pathsRef ? (element) => { pathsRef.current.rings = element } : undefined} data-leader="rings" d="M400 40 L400 110 L503.36 177.93" />
      <path ref={pathsRef ? (element) => { pathsRef.current.earth = element } : undefined} data-leader="earth" d="M666.667 40 L666.667 100 L708 195" />
    </svg>
  )
}

export function HeroFallbackGraphic() {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <svg className="hero-fallback-graphic" viewBox="0 40 800 460" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>Conceptual Cassini radio-occultation geometry</title>
      <desc id={descriptionId}>
        A large tilted Saturn ring plane is crossed by a coherent signal traveling from Cassini
        toward an Earth receiver.
      </desc>
      <defs>
        <radialGradient id="fallback-planet-light" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ddc99d" />
          <stop offset="58%" stopColor="#a88752" />
          <stop offset="100%" stopColor="#51452f" />
        </radialGradient>
        <linearGradient id="fallback-ring-light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8c7146" stopOpacity="0.18" />
          <stop offset="48%" stopColor="#e2cea2" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#876a3c" stopOpacity="0.12" />
        </linearGradient>
        <clipPath id="fallback-planet-clip">
          <circle cx="442" cy="304" r="102" />
        </clipPath>
        <marker id="fallback-signal-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>

      <g className="fallback-orbit fallback-orbit-back" transform="translate(442 304) rotate(-14)">
        <ellipse rx="320" ry="112" />
        <ellipse rx="282" ry="96" />
        <ellipse rx="242" ry="81" />
        <ellipse rx="205" ry="66" />
        <ellipse rx="170" ry="53" />
        <path className="fallback-ring-wash" d="M-313 2 C-183 -77 178 -93 313 -8 C184 80 -184 92 -313 2Z" />
      </g>

      <circle className="fallback-planet" cx="442" cy="304" r="102" />
      <g className="fallback-planet-bands" clipPath="url(#fallback-planet-clip)">
        <path d="M352 270 C398 282 487 281 532 265" />
        <path d="M342 302 C402 316 490 315 542 297" />
        <path d="M351 337 C404 349 486 346 531 330" />
      </g>
      <g className="fallback-front-rings" transform="translate(442 304) rotate(-14)">
        <path d="M-320 0 A320 112 0 0 0 320 0" />
        <path d="M-282 0 A282 96 0 0 0 282 0" />
        <path d="M-242 0 A242 81 0 0 0 242 0" />
        <path d="M-205 0 A205 66 0 0 0 205 0" />
      </g>

      <path className="fallback-signal-path" d="M70 160 C219 168 320 174 390 180 C510 190 616 200 708 215" markerEnd="url(#fallback-signal-arrow)" />
      <path className="fallback-wave" d="M407 182 C432 160 450 216 474 191 S518 231 542 204 S590 242 616 215 S656 245 681 220" />

      <g className="fallback-spacecraft" transform="translate(70 158)">
        <circle r="17" />
        <path d="M-12 -5 H12 V5 H-12 Z M-37 -11 H-15 V11 H-37 Z M15 -11 H37 V11 H15 Z" />
      </g>
      <g className="fallback-receiver" transform="translate(708 215)">
        <circle r="13" />
        <path d="M-9 -4 Q3 10 13 -5 M3 7 L-4 24 M-13 24 H8" />
      </g>
    </svg>
  )
}

export default function HeroVisual() {
  return (
    <figure className="scientific-hero-scene is-fallback">
      <HeroSceneAnnotations />
      <div
        className="hero-scene-viewport"
        role="img"
        aria-label="Conceptual Cassini radio-occultation geometry. Cassini transmits a coherent signal through Saturn's tilted ring plane toward a receiver on Earth."
      >
        <HeroFallbackGraphic />
        <HeroAnnotationLeaders />
      </div>
      <figcaption>
        Conceptual occultation geometry · not to scale
      </figcaption>
    </figure>
  )
}
