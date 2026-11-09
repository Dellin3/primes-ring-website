import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EvidenceTag from '../../components/common/EvidenceTag.jsx'
import SaturnIllustration from './SaturnIllustration.jsx'
import ProfileStrip from './ProfileStrip.jsx'
import { findObservation, formatObservationDate, glossary, mapObservation, observations } from '../../content/rings.js'
import { loadObservationSummary, overviewSamples } from '../../lib/webObservation.js'
import {
  CROSSING_RANGE_KM, DEFAULT_CROSSING_KM, SATURN_EQUATORIAL_KM, SATURN_POLAR_KM, cameraBasis, clampCrossing, featureAnchor,
  featureLinks, findFeature, hiddenByPlanet, opacityProfile, pixelsPerUnit, presetViews, projectOrthographic, regionAtRadius,
  sceneFeatures, signalGeometry, typicalProfile, viewFor,
} from '../../lib/ringScene.js'
import { useInView, useMediaQuery, usePageVisible, useReducedMotion } from '../../lib/motion.js'

const km = value => Math.round(value).toLocaleString('en-US')
const source = findObservation(mapObservation)
const maxRecords = Math.max(...observations.map(observation => observation.record_count))
const ENCKE_CENTER_KM = 133584
const SWEEP_MS = 8000
const define = term => glossary.find(entry => entry.term === term)?.definition

// Bands of the stage that the overlay controls occupy on wide screens; on
// narrow screens the controls sit below the scene.
const labelInsets = { wide: { top: 62, bottom: 62 }, narrow: { top: 6, bottom: 6 } }

const steps = [
  { id: 1, title: 'The geometry', view: 'overview', crossing: DEFAULT_CROSSING_KM, select: null },
  { id: 2, title: 'A crossing becomes a profile', view: 'sweep', crossing: DEFAULT_CROSSING_KM, select: null },
  { id: 3, title: 'Your turn', view: 'close', crossing: ENCKE_CENTER_KM, select: 'encke-gap' },
]

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch { return false }
}

// Labels: positioned over the scene, kept apart by priority. They are pointer
// shortcuts; the feature buttons under the scene are the keyboard route.
function SceneLabels({ positions, selectedId, crossingKm, onSelect, width, height, insets, blocked }) {
  const placed = useMemo(() => {
    if (!positions) return []
    const boxes = [...blocked]
    const order = [...sceneFeatures].sort((a, b) => (b.id === selectedId) - (a.id === selectedId) || b.priority - a.priority)
    const crossing = positions.crossing
    if (crossing?.visible) boxes.push({ x: crossing.x + 12, y: crossing.y + 8, w: 112, h: 22 })
    const out = []
    for (const feature of order) {
      const point = positions[feature.id]
      if (!point?.visible) continue
      const w = feature.label.length * 6.9 + 26
      const flip = point.x + 10 + w > width - 8
      const box = { x: flip ? point.x - 10 - w : point.x + 10, y: point.y - 13, w, h: 26 }
      if (box.x < 4 || box.x + box.w > width - 4 || box.y < insets.top || box.y + box.h > height - insets.bottom) continue
      if (boxes.some(other => box.x < other.x + other.w && box.x + box.w > other.x && box.y < other.y + other.h && box.y + box.h > other.y)) continue
      boxes.push(box)
      out.push({ feature, point, flip })
    }
    return out
  }, [positions, selectedId, width, height, insets, blocked])
  const crossing = positions?.crossing
  return <div className="scene-labels" aria-hidden="true">
    {placed.map(({ feature, point, flip }) => <button key={feature.id} type="button" tabIndex={-1} className={`scene-label${flip ? ' is-flipped' : ''}${feature.id === selectedId ? ' is-selected' : ''} is-${feature.kind}`} style={{ transform: `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px)${flip ? ' translateX(-100%)' : ''}` }} onClick={() => onSelect(feature.id)}><i /><span>{feature.label}</span></button>)}
    {crossing?.visible && <span className="scene-crossing-tag" style={{ transform: `translate(${crossing.x.toFixed(1)}px, ${crossing.y.toFixed(1)}px)` }}><span className="mono">r = {km(crossingKm)} km</span></span>}
  </div>
}

function FeatureCard({ id, onClose }) {
  const feature = findFeature(id)
  if (!feature) return null
  const links = featureLinks(id)
  const region = feature.region
  return <div className="scene-card" role="group" aria-labelledby="scene-card-title">
    <div className="scene-card-head"><p className="scene-card-kind">{feature.kind === 'ring' ? region.kind === 'gap' ? 'Gap' : region.kind === 'division' ? 'Division' : 'Ring' : feature.kind === 'planet' ? 'Planet' : feature.kind === 'spacecraft' ? 'Spacecraft' : 'Signal'}</p><button type="button" className="scene-card-close" onClick={onClose} aria-label={`Close ${feature.label}`}>×</button></div>
    <h3 id="scene-card-title">{feature.label}</h3>
    {feature.kind === 'ring' && <>
      <dl className="scene-card-facts"><div><dt>Radius</dt><dd className="mono">{km(region.inner)}–{km(region.outer)} km</dd></div><div><dt>Typical optical depth</dt><dd className="mono">{region.opticalDepth}</dd></div></dl>
      <p>{region.note}{feature.hint ? ` ${feature.hint}` : ''}</p>
      <p className="scene-card-source">Radii and typical values: NASA PDS ring table.</p>
    </>}
    {feature.kind === 'planet' && <>
      <dl className="scene-card-facts"><div><dt>Equatorial radius</dt><dd className="mono">{km(SATURN_EQUATORIAL_KM)} km</dd></div><div><dt>Polar radius</dt><dd className="mono">{km(SATURN_POLAR_KM)} km</dd></div></dl>
      <p>Drawn to scale with the rings, including its flattening. The cloud bands are an illustration.</p>
      <p className="scene-card-source">Radii: NASA NSSDC Saturn fact sheet.</p>
    </>}
    {feature.kind === 'spacecraft' && <>
      <p>{define('Radio occultation')}</p>
      <p className="scene-card-source">Shown much larger and closer than it was; its path here is schematic.</p>
    </>}
    {feature.kind === 'signal' && <>
      <p>Cassini’s X-band signal, 3.6 cm long, travelling to the antennas of NASA’s Deep Space Network. {define('Normal optical depth')}</p>
      <p className="scene-card-source">The direction to Earth is schematic and not to scale.</p>
    </>}
    {links.length > 0 && <ul className="scene-card-links">{links.map(link => <li key={link.to}><Link to={link.to} className={link.kind === 'data' ? 'is-data' : undefined}>{link.label} <span aria-hidden="true">→</span></Link></li>)}</ul>}
  </div>
}

export default function SignalScene() {
  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const stepRefs = useRef([])
  const controllerRef = useRef(null)
  const autoplayedRef = useRef(false)
  const scrollLockRef = useRef(0)
  const reducedMotion = useReducedMotion()
  // The scene's code and data load once the section enters the viewport.
  const onScreen = useInView(sectionRef, '0px')
  const near = onScreen
  const pageVisible = usePageVisible()
  const wide = useMediaQuery('(min-width: 1000px)')
  const [step, setStep] = useState(1)
  const [viewName, setViewName] = useState('overview')
  const [camera, setCamera] = useState(() => viewFor('overview'))
  const [request, setRequest] = useState({ id: 0, view: viewFor('overview') })
  const [crossingKm, setCrossingKm] = useState(DEFAULT_CROSSING_KM)
  const [selectedId, setSelectedId] = useState(null)
  const [cardOpen, setCardOpen] = useState(false)
  const select = useCallback(id => { setSelectedId(id); setCardOpen(Boolean(id)) }, [])
  const [playing, setPlaying] = useState(false)
  const [size, setSize] = useState({ width: 880, height: 560 })
  const [data, setData] = useState({ status: 'idle' })
  const [renderer, setRenderer] = useState('svg')
  const [webglFrame, setWebglFrame] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const typical = useMemo(() => typicalProfile(), [])
  const profile = data.profile || typical
  const active = onScreen && pageVisible

  // The measured profile: Rev 007's display overview, loaded near the section.
  const requestedRef = useRef(false)
  useEffect(() => {
    if (!near || requestedRef.current) return undefined
    requestedRef.current = true
    let cancelled = false
    let settled = false
    loadObservationSummary(source.base_path).then(({ overview }) => {
      if (overview.dataset_id !== source.dataset_id) throw new Error('Observation identity mismatch')
      const rows = overviewSamples(overview).filter(row => Number.isFinite(row.ring_radius_km)).sort((a, b) => a.ring_radius_km - b.ring_radius_km)
      settled = true
      if (!cancelled) setData({ status: 'ready', rows, profile: opacityProfile(overview) })
    }).catch(() => { settled = true; if (!cancelled) setData({ status: 'error' }) })
    // An unfinished request is retried the next time the section comes near.
    return () => { cancelled = true; if (!settled) requestedRef.current = false }
  }, [near])

  // Stage size for the SVG drawing and label placement.
  useEffect(() => {
    const element = viewportRef.current
    if (!element) return undefined
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize(previous => previous.width === Math.round(width) && previous.height === Math.round(height) ? previous : { width: Math.round(width), height: Math.round(height) })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Load the WebGL scene once the section is near and WebGL works.
  useEffect(() => {
    if (!near || renderer !== 'svg' || controllerRef.current) return undefined
    let cancelled = false
    if (!webglAvailable()) { Promise.resolve().then(() => { if (!cancelled) setRenderer('static') }); return () => { cancelled = true } }
    import('./saturnWebgl.js').then(({ createSaturnScene }) => {
      if (cancelled || !viewportRef.current) return
      controllerRef.current = createSaturnScene({
        container: viewportRef.current, profile, view: camera, crossingKm, highlightId: selectedId, reducedMotion,
        onFrame: frameState => setWebglFrame(frameState),
        onUserRotate: () => setViewName('custom'),
        onError: () => { controllerRef.current?.dispose(); controllerRef.current = null; setRenderer('static') },
      })
      window.__saturnScene = controllerRef.current
      setRenderer('webgl')
    }).catch(() => { if (!cancelled) setRenderer('static') })
    return () => { cancelled = true }
    // Created once; later changes reach the scene through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, renderer])
  useEffect(() => () => { controllerRef.current?.dispose(); controllerRef.current = null }, [])

  // Views requested after the scene was created animate there; the scene
  // itself starts from whatever the drawing showed at that moment.
  const appliedRequestRef = useRef(null)
  useEffect(() => {
    if (renderer !== 'webgl') return
    if (appliedRequestRef.current === null) { appliedRequestRef.current = request.id; return }
    if (appliedRequestRef.current === request.id) return
    appliedRequestRef.current = request.id
    controllerRef.current?.setView(request.view, { animate: true })
  }, [request, renderer])
  useEffect(() => { if (renderer === 'webgl') controllerRef.current?.setCrossing(crossingKm) }, [crossingKm, renderer])
  useEffect(() => { if (renderer === 'webgl') controllerRef.current?.setHighlight(selectedId) }, [selectedId, renderer])
  useEffect(() => { if (renderer === 'webgl' && data.profile) controllerRef.current?.setProfile(data.profile) }, [data.profile, renderer])
  useEffect(() => { if (renderer === 'webgl') controllerRef.current?.setActive(active) }, [active, renderer])

  const setView = useCallback((name, crossing = crossingKm, { announce = true } = {}) => {
    const next = viewFor(name, crossing)
    setViewName(name)
    setCamera(next)
    setRequest(previous => ({ id: previous.id + 1, view: next }))
    if (announce) setAnnouncement(`View: ${presetViews.find(item => item.name === name)?.label || steps.find(item => item.view === name)?.title || name}`)
  }, [crossingKm])

  const stepRef = useRef(1)
  const goToStep = useCallback((id, { scroll = false } = {}) => {
    const target = steps.find(item => item.id === id)
    stepRef.current = id
    setStep(id)
    setPlaying(false)
    setSelectedId(target.select)
    setCardOpen(false)
    setCrossingKm(target.crossing)
    setView(target.view, target.crossing, { announce: false })
    setAnnouncement(`Step ${id} of 3: ${target.title}`)
    if (id === 2 && !autoplayedRef.current && !reducedMotion) {
      autoplayedRef.current = true
      setCrossingKm(CROSSING_RANGE_KM[0])
      setPlaying(true)
    }
    if (scroll && window.matchMedia('(min-width: 1000px)').matches) {
      scrollLockRef.current = performance.now() + 1200
      stepRefs.current[id - 1]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
    }
  }, [reducedMotion, setView])

  // Desktop: scrolling the step text advances the scene.
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1000px)').matches || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(entries => {
      if (performance.now() < scrollLockRef.current) return
      const visible = entries.filter(entry => entry.isIntersecting)
      if (!visible.length) return
      const id = Number(visible[0].target.dataset.step)
      if (stepRef.current !== id) goToStep(id)
    }, { rootMargin: '-46% 0px -46% 0px' })
    stepRefs.current.forEach(element => element && observer.observe(element))
    return () => observer.disconnect()
  }, [goToStep])

  // The illustrative sweep: moves the crossing outward, only while visible.
  useEffect(() => {
    if (!playing || !active) return undefined
    let frame = 0
    let last = performance.now()
    const speed = (CROSSING_RANGE_KM[1] - CROSSING_RANGE_KM[0]) / SWEEP_MS
    function tick(now) {
      const elapsed = Math.min(64, now - last)
      last = now
      let done = false
      setCrossingKm(current => {
        const next = current + elapsed * speed
        if (next >= CROSSING_RANGE_KM[1]) { done = true; return CROSSING_RANGE_KM[1] }
        return next
      })
      if (done) setPlaying(false); else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, active])

  function reset() {
    const target = steps.find(item => item.id === step)
    setPlaying(false)
    setSelectedId(target.select)
    setCardOpen(false)
    setCrossingKm(target.crossing)
    setView(target.view, target.crossing, { announce: false })
    setAnnouncement('Scene reset')
  }

  function rotate(dAzimuth, dElevation) {
    setViewName('custom')
    if (renderer === 'webgl') return controllerRef.current?.rotateBy(dAzimuth, dElevation)
    setCamera(current => ({ ...current, azimuth: current.azimuth + dAzimuth, elevation: Math.max(-12, Math.min(89, current.elevation + dElevation)) }))
  }

  function onKeyDown(event) {
    const moves = { ArrowLeft: [8, 0], ArrowRight: [-8, 0], ArrowUp: [0, 6], ArrowDown: [0, -6] }
    if (!moves[event.key]) return
    event.preventDefault()
    rotate(...moves[event.key])
  }

  // Dragging the SVG drawing (the WebGL scene handles its own pointer input).
  const dragRef = useRef(null)
  function pointerDown(event) {
    if (renderer === 'webgl' || event.button !== 0 || event.target.closest('button, a, input')) return
    dragRef.current = { x: event.clientX, y: event.clientY, camera, touch: event.pointerType === 'touch' }
  }
  function pointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (Math.hypot(dx, dy) < 3) return
    setViewName('custom')
    setCamera({ ...drag.camera, azimuth: drag.camera.azimuth - dx * 0.32, elevation: drag.touch ? drag.camera.elevation : Math.max(-12, Math.min(89, drag.camera.elevation + dy * 0.28)) })
  }
  function pointerUp() { dragRef.current = null }

  // Label positions: from the WebGL camera, or projected for the SVG drawing.
  const svgPositions = useMemo(() => {
    if (renderer === 'webgl') return null
    const ppu = pixelsPerUnit(camera, size.height)
    const center = [size.width / 2, size.height / 2]
    const toward = cameraBasis(camera).toward
    const positions = {}
    for (const feature of sceneFeatures) {
      const anchor = featureAnchor(feature.id, crossingKm)
      const point = projectOrthographic(anchor, camera, ppu, center)
      positions[feature.id] = { x: point.x, y: point.y, visible: feature.id === 'saturn' || !hiddenByPlanet(anchor, toward) }
    }
    const crossing = projectOrthographic(signalGeometry(crossingKm).crossing, camera, ppu, center)
    positions.crossing = { x: crossing.x, y: crossing.y, visible: true }
    return positions
  }, [renderer, camera, size, crossingKm])
  const positions = renderer === 'webgl' ? webglFrame?.positions : svgPositions

  const region = regionAtRadius(crossingKm)
  const viewLabel = presetViews.find(item => item.name === viewName)?.label || (viewName === 'custom' ? 'your own angle' : steps.find(item => item.view === viewName)?.title || 'Overview')
  const description = `Saturn and its rings, drawn to scale, with Cassini below the ring plane and its radio signal crossing the rings at ${km(crossingKm)} km${region ? `, in the ${region.name}` : ''}. View: ${viewLabel}. Use the arrow keys to turn the view.`
  const stepButtons = className => <div className={className} role="group" aria-label="Steps in this explanation">{steps.map(item => <button key={item.id} type="button" aria-pressed={step === item.id} onClick={() => goToStep(item.id, { scroll: true })}><span className="mono">{item.id}</span>{item.title}</button>)}</div>
  const selectLinks = featureLinks(selectedId || 'encke-gap').filter(link => link.kind === 'data')

  return <section ref={sectionRef} className="home-band home-signal" id="follow-the-signal" aria-labelledby="signal-title">
    <div className="home-band-inner">
      <header className="home-chapter-head" data-reveal>
        <p className="home-kicker"><span className="mono">01</span> Follow the signal</p>
        <h2 id="signal-title">One radio signal, <em>one line through the rings.</em></h2>
        <p className="home-chapter-intro">Cassini repeatedly sent radio signals through Saturn’s rings toward Earth. Follow one of them to see how six recordings, made between {formatObservationDate(observations[0]).split(', ')[1]} and {formatObservationDate(observations.at(-1)).split(', ')[1]}, became the profiles in our explorer.</p>
      </header>
      <div className={`signal-layout is-step-${step}`}>
        <div className="signal-stage-column">
          <div className="signal-sticky">
            <div className={`signal-stage is-${renderer}`}>
              <div className="signal-canvas-area">
                <div ref={viewportRef} className="signal-viewport" role="img" aria-roledescription="3D scene" aria-label={description} tabIndex={0} onKeyDown={onKeyDown} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onPointerLeave={pointerUp}>
                  {renderer !== 'webgl' && <SaturnIllustration view={camera} width={size.width} height={size.height} profile={profile} crossingKm={crossingKm} highlightId={selectedId} />}
                </div>
                <SceneLabels positions={positions} selectedId={selectedId} crossingKm={crossingKm} onSelect={select} width={size.width} height={size.height} insets={wide ? labelInsets.wide : labelInsets.narrow} blocked={wide && cardOpen ? [{ x: size.width - 330, y: 54, w: 330, h: size.height - 54 }] : []} />
              </div>
              {stepButtons('signal-steps-nav is-desktop')}
              <div className="signal-views" role="group" aria-label="Preset views">
                {presetViews.map(item => <button key={item.name} type="button" aria-pressed={viewName === item.name} title={item.description} onClick={() => setView(item.name)}>{item.label}</button>)}
                <button type="button" className="signal-reset" onClick={reset}>Reset</button>
              </div>
              {selectedId && cardOpen && <FeatureCard id={selectedId} onClose={() => setCardOpen(false)} />}
              <p className="signal-scale-note"><span>To scale: Saturn, ring radii</span><span>Not to scale: Cassini, its path, Earth’s direction</span></p>
            </div>
            <div className="signal-under">
              {step === 1 ? <div className="signal-hints">
                <p><strong>Drag</strong> the scene to turn it. <strong>Select</strong> a label or a name below to read about it.</p>
                <p className="signal-legend"><EvidenceTag kind="illustration">Illustration · drawn from real radii</EvidenceTag> Ring brightness follows {source ? `Rev 007’s` : 'a'} measured optical depth{data.status === 'ready' ? ', averaged in 256 km steps' : ' once it loads; until then, typical values from the PDS ring table'}.</p>
              </div> : <ProfileStrip rows={data.rows} status={data.status} crossingKm={crossingKm} onCrossingChange={value => { setPlaying(false); setCrossingKm(clampCrossing(value)) }} playing={playing} canPlay={!reducedMotion} onPlayToggle={() => { if (!playing && crossingKm >= CROSSING_RANGE_KM[1] - 1) setCrossingKm(CROSSING_RANGE_KM[0]); setPlaying(value => !value) }} observation={source} />}
              <div className="signal-features" role="group" aria-label="Select a feature in the scene">
                {sceneFeatures.map(feature => <button key={feature.id} type="button" aria-pressed={selectedId === feature.id} onClick={() => select(selectedId === feature.id && cardOpen ? null : feature.id)}>{feature.label}</button>)}
              </div>
            </div>
            <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
          </div>
        </div>
        <div className="signal-steps-column">
          {stepButtons('signal-steps-nav is-mobile')}
          <ol className="signal-steps">
            <li className={`signal-step${step === 1 ? ' is-active' : ''}`} data-step="1" ref={element => { stepRefs.current[0] = element }}>
              <p className="signal-step-kicker"><span className="mono">1</span> The geometry</p>
              <h3>Cassini, the rings and Earth on one line.</h3>
              <p>For a ring occultation, Cassini flew behind the rings as seen from Earth and sent a steady radio signal home: the X-band signal, 3.6 cm long. Antennas of NASA’s Deep Space Network received whatever came through.</p>
              <p className="signal-invite">Drag the scene to look from another side, or try <button type="button" className="text-button" onClick={() => setView('earth')}>Earth’s view</button>: Cassini sits right behind the rings.</p>
              <p className="signal-step-note">Schematic: Cassini’s distance, its path and the direction to Earth are not to scale. Saturn and every ring radius are.</p>
            </li>
            <li className={`signal-step${step === 2 ? ' is-active' : ''}`} data-step="2" ref={element => { stepRefs.current[1] = element }}>
              <p className="signal-step-kicker"><span className="mono">2</span> One crossing, one measurement</p>
              <h3>Where the line crosses the rings, the signal records what is in the way.</h3>
              <p>The signal pierces the ring plane at a single spot. Its distance from Saturn’s center is the ring radius. As Cassini moved, that spot swept across the rings, and the received signal weakened wherever ring material stood in its path.</p>
              <p className="signal-invite">Drag the crossing along the real profile. What happens to the signal in the Cassini Division?</p>
              <p className="signal-step-note">The sweep is illustrative timing, not Cassini’s actual motion. The profile is real: Rev 007’s normal optical depth, as a display overview.</p>
            </li>
            <li className={`signal-step${step === 3 ? ' is-active' : ''}`} data-step="3" ref={element => { stepRefs.current[2] = element }}>
              <p className="signal-step-kicker"><span className="mono">3</span> Your turn</p>
              <h3>Open the same crossing in the real data.</h3>
              <p>Every profile on this site records the signal every 0.25 km of ring radius — up to {maxRecords.toLocaleString('en-US')} measurements in one observation. Choose any ring in the scene, then open it sample by sample.</p>
              <div className="signal-step-actions">
                {selectLinks.map(link => <Link key={link.to} className="button button-primary" to={link.to}>{link.label} <span aria-hidden="true">→</span></Link>)}
                <a className="research-text-link" href="#try-observation">Try one real observation below <span aria-hidden="true">↓</span></a>
                <Link className="research-text-link" to="/rings#rings-reading">How a signal is read <span aria-hidden="true">→</span></Link>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
}
