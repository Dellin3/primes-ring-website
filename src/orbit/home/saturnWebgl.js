// The WebGL version of the "Follow the signal" scene. Loaded with a dynamic
// import only when the section approaches the viewport and WebGL is available.
// It renders on demand (camera moves, drags, crossing changes), never in a
// continuous loop, and stops entirely while inactive.
import {
  AdditiveBlending, AmbientLight, BufferGeometry, CanvasTexture, ClampToEdgeWrapping, ConeGeometry, CylinderGeometry,
  DataTexture, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, LinearFilter, Line, LineDashedMaterial, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Points, PointsMaterial, RGBAFormat, RingGeometry, Scene,
  ShaderMaterial, SphereGeometry, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'
import {
  FIELD_OF_VIEW_DEG, FLATTENING, RING_SPAN_KM, blockedFraction, earthDirection, featureAnchor, findFeature, hiddenByPlanet,
  kmToScene, profileAt, ringColorRgb, sceneFeatures, signalGeometry,
} from '../../lib/ringScene.js'

const MAX_PIXEL_RATIO = 1.75
const SUN = new Vector3(-0.78, 0.3, 0.55).normalize()
const UP = new Vector3(0, 1, 0)

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6D2B79F5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Planet bands are an illustration; only the planet's shape is to scale.
function planetTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
  const stops = [[0, '#8f99a3'], [0.07, '#a7a291'], [0.15, '#d2bf98'], [0.22, '#c2a274'], [0.29, '#e1cda4'], [0.35, '#caa875'], [0.41, '#e6d3aa'], [0.46, '#cfac78'], [0.5, '#ebd8b1'], [0.54, '#d4b07c'], [0.59, '#e2cca1'], [0.65, '#c3a070'], [0.73, '#d8bf93'], [0.83, '#b6a185'], [0.93, '#9c9a94'], [1, '#8b95a0']]
  for (const [offset, color] of stops) gradient.addColorStop(offset, color)
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  const random = seededRandom(11)
  for (let i = 0; i < 260; i++) {
    const y = random() * canvas.height
    context.fillStyle = random() > 0.5 ? `rgba(255,244,220,${random() * 0.07})` : `rgba(90,62,36,${random() * 0.06})`
    context.fillRect(0, y, canvas.width, 1 + random() * 3)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// One texel per ~72 km: color and opacity from the measured profile.
function ringTexture(profile) {
  const size = 1024
  const data = new Uint8Array(size * 4)
  for (let i = 0; i < size; i++) {
    const km = RING_SPAN_KM[0] + (i + 0.5) / size * (RING_SPAN_KM[1] - RING_SPAN_KM[0])
    const sample = profileAt(profile, km)
    const alpha = sample ? blockedFraction(sample[1]) : 0.03
    const [r, g, b] = ringColorRgb(alpha)
    data.set([r, g, b, Math.round(Math.min(0.94, 0.08 + alpha * 0.88) * 255)], i * 4)
  }
  const texture = new DataTexture(data, size, 1, RGBAFormat)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

const ringVertex = /* glsl */`
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

const ringFragment = /* glsl */`
uniform sampler2D profileMap;
uniform float innerR;
uniform float outerR;
uniform vec3 sunDir;
uniform float flattening;
uniform vec2 highlight;
uniform float highlightOn;
varying vec3 vWorld;
void main() {
  float r = length(vWorld.xz);
  float t = (r - innerR) / (outerR - innerR);
  if (t < 0.0 || t > 1.0) discard;
  vec4 texel = texture2D(profileMap, vec2(t, 0.5));
  vec3 q = vec3(vWorld.x, vWorld.y / flattening, vWorld.z);
  vec3 l = normalize(vec3(sunDir.x, sunDir.y / flattening, sunDir.z));
  float b = dot(q, l);
  float c = dot(q, q) - 1.0;
  float disc = b * b - c;
  float shadow = (disc > 0.0 && -b - sqrt(max(disc, 0.0)) > 0.0) ? smoothstep(0.0, 0.03, disc) : 0.0;
  float sameSide = step(0.0, sunDir.y * cameraPosition.y);
  float light = mix(0.6, 1.0, sameSide) * (1.0 - 0.85 * shadow);
  vec3 color = texel.rgb * light;
  // Narrow features (the Encke Gap is 322 km) stay at least ~3 px wide.
  float pad = 1.5 * fwidth(r);
  float h = highlightOn * step(highlight.x - pad, r) * step(r, highlight.y + pad);
  color = mix(color, vec3(1.0, 0.88, 0.66), h * 0.42);
  float alpha = max(texel.a, h * 0.34);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}`

const rimFragment = /* glsl */`
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.0);
  gl_FragColor = vec4(vec3(0.6, 0.76, 0.93) * rim * 0.55, rim * 0.55);
  #include <colorspace_fragment>
}`
const rimVertex = /* glsl */`
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = cameraPosition - world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

const fadeVertex = /* glsl */`
varying float vAlong;
void main() { vAlong = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const fadeFragment = /* glsl */`
uniform vec3 tint;
uniform float strength;
varying float vAlong;
void main() {
  gl_FragColor = vec4(tint, strength * (1.0 - 0.8 * vAlong));
  #include <colorspace_fragment>
}`

function beam(length, radius, material) {
  const geometry = new CylinderGeometry(radius, radius, length, 12, 1, true)
  geometry.translate(0, length / 2, 0)
  return new Mesh(geometry, material)
}

function placeBeam(mesh, from, direction) {
  mesh.position.set(...from)
  mesh.quaternion.setFromUnitVectors(UP, direction)
}

function spacecraft() {
  const group = new Group()
  const gold = new MeshStandardMaterial({ color: '#d2b67f', metalness: 0.45, roughness: 0.45 })
  const white = new MeshStandardMaterial({ color: '#eef1f4', metalness: 0.1, roughness: 0.5, side: DoubleSide })
  const body = new Mesh(new CylinderGeometry(0.024, 0.024, 0.07, 16), gold)
  const dish = new Mesh(new SphereGeometry(0.062, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.32), white)
  dish.position.y = 0.075
  dish.rotation.x = Math.PI
  const boom = new Mesh(new CylinderGeometry(0.004, 0.004, 0.12, 6), gold)
  boom.rotation.z = Math.PI / 2
  boom.position.y = -0.01
  group.add(body, dish, boom)
  group.scale.setScalar(1.5)
  return group
}

function glowSprite(color) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const mesh = new Mesh(new RingGeometry(0, 0.16, 32), new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, blending: AdditiveBlending }))
  return mesh
}

const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const wrapDegrees = value => ((value + 540) % 360) - 180

export function createSaturnScene({ container, profile, view, crossingKm, highlightId = null, reducedMotion = false, onFrame, onUserRotate, onError }) {
  // The buffer is kept between frames (renders are rare and on demand) so that
  // page captures and screenshots include the scene.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.className = 'scene-webgl'
  canvas.setAttribute('aria-hidden', 'true')
  container.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(FIELD_OF_VIEW_DEG, 1, 0.05, 400)
  const disposables = []
  const track = item => { disposables.push(item); return item }

  // Lights: a warm sun from the front left, a little cool ambient fill.
  const sun = new DirectionalLight('#fff4e2', 2.6)
  sun.position.copy(SUN).multiplyScalar(20)
  scene.add(sun, new AmbientLight('#8aa6c8', 0.16))

  // Quiet background stars (decoration).
  const random = seededRandom(7)
  const starPositions = []
  const starColors = []
  for (let i = 0; i < 900; i++) {
    const u = random() * 2 - 1
    const theta = random() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    starPositions.push(r * Math.cos(theta) * 120, u * 120, r * Math.sin(theta) * 120)
    const tone = random()
    const brightness = 0.35 + random() * 0.65
    starColors.push(...(tone > 0.85 ? [0.95, 0.85, 0.7] : tone > 0.6 ? [0.72, 0.82, 0.98] : [0.92, 0.94, 1]).map(v => v * brightness))
  }
  const starGeometry = track(new BufferGeometry())
  starGeometry.setAttribute('position', new Float32BufferAttribute(starPositions, 3))
  starGeometry.setAttribute('color', new Float32BufferAttribute(starColors, 3))
  scene.add(new Points(starGeometry, track(new PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }))))

  // Saturn, oblate to scale.
  const planetMap = track(planetTexture())
  const planet = new Mesh(track(new SphereGeometry(1, 96, 64)), track(new MeshStandardMaterial({ map: planetMap, roughness: 0.92, metalness: 0 })))
  planet.scale.set(1, FLATTENING, 1)
  scene.add(planet)
  const rim = new Mesh(track(new SphereGeometry(1.012, 64, 48)), track(new ShaderMaterial({ vertexShader: rimVertex, fragmentShader: rimFragment, transparent: true, depthWrite: false, blending: AdditiveBlending })))
  rim.scale.set(1, FLATTENING, 1)
  scene.add(rim)

  // Rings: radii to scale, brightness from the measured profile.
  const innerR = kmToScene(RING_SPAN_KM[0])
  const outerR = kmToScene(RING_SPAN_KM[1])
  const ringMap = track(ringTexture(profile))
  const ringMaterial = track(new ShaderMaterial({
    vertexShader: ringVertex, fragmentShader: ringFragment, transparent: true, depthWrite: false, side: DoubleSide,
    uniforms: { profileMap: { value: ringMap }, innerR: { value: innerR }, outerR: { value: outerR }, sunDir: { value: SUN.clone() }, flattening: { value: FLATTENING }, highlight: { value: [0, 0] }, highlightOn: { value: 0 } },
  }))
  const rings = new Mesh(track(new RingGeometry(innerR, outerR, 384, 1)), ringMaterial)
  rings.rotation.x = -Math.PI / 2
  scene.add(rings)

  // Signal path, Cassini, the crossing marker and the radius guide.
  const direction = new Vector3(...earthDirection)
  const incomingMaterial = track(new MeshBasicMaterial({ color: '#f3dcae', transparent: true, opacity: 0.95, depthWrite: false }))
  const outgoingMaterial = track(new ShaderMaterial({ vertexShader: fadeVertex, fragmentShader: fadeFragment, transparent: true, depthWrite: false, uniforms: { tint: { value: [0.96, 0.87, 0.69] }, strength: { value: 0.95 } } }))
  const incoming = beam(1.75, 0.009, incomingMaterial)
  const outgoing = beam(2.1, 0.009, outgoingMaterial)
  disposables.push(incoming.geometry, outgoing.geometry)
  const arrow = new Mesh(track(new ConeGeometry(0.03, 0.09, 14)), incomingMaterial)
  const craft = spacecraft()
  const craftGlow = glowSprite('rgba(240,217,180,0.55)')
  const marker = new Mesh(track(new RingGeometry(0.03, 0.045, 40)), track(new MeshBasicMaterial({ color: '#fff3dc', side: DoubleSide, transparent: true, depthWrite: false })))
  marker.rotation.x = -Math.PI / 2
  const markerDot = new Mesh(track(new SphereGeometry(0.014, 16, 12)), track(new MeshBasicMaterial({ color: '#fff8ea' })))
  const markerGlow = glowSprite('rgba(255,236,200,0.8)')
  const radiusGeometry = track(new BufferGeometry())
  radiusGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3))
  const radiusLine = new Line(radiusGeometry, track(new LineDashedMaterial({ color: '#a8c9ed', dashSize: 0.06, gapSize: 0.045, transparent: true, opacity: 0.8 })))
  scene.add(incoming, outgoing, arrow, craft, craftGlow, marker, markerDot, markerGlow, radiusLine)

  let crossing = crossingKm
  function placeSignal() {
    const geometry = signalGeometry(crossing)
    placeBeam(incoming, geometry.spacecraft, direction)
    placeBeam(outgoing, geometry.crossing, direction)
    arrow.position.set(...geometry.earthward)
    arrow.quaternion.setFromUnitVectors(UP, direction)
    craft.position.set(...geometry.spacecraft)
    craft.quaternion.setFromUnitVectors(UP, direction)
    craftGlow.position.set(...geometry.spacecraft)
    marker.position.set(geometry.crossing[0], 0.002, geometry.crossing[2])
    markerDot.position.set(...geometry.crossing)
    markerGlow.position.set(...geometry.crossing)
    const position = radiusGeometry.getAttribute('position')
    position.setXYZ(1, geometry.crossing[0], 0.001, geometry.crossing[2])
    position.needsUpdate = true
    radiusLine.computeLineDistances()
  }
  placeSignal()

  // Camera: orbit parameters, eased between views.
  const state = { azimuth: view.azimuth, elevation: view.elevation, distance: view.distance, target: new Vector3(...view.target) }
  let tween = null
  let frame = 0
  let active = true
  let disposed = false
  let width = 1
  let height = 1
  let frames = 0
  let highlight = highlightId
  const cameraOffset = new Vector3()

  function applyCamera() {
    const az = state.azimuth * Math.PI / 180
    const el = state.elevation * Math.PI / 180
    cameraOffset.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(state.distance)
    camera.position.copy(state.target).add(cameraOffset)
    camera.up.set(0, 1, 0)
    if (Math.abs(state.elevation) > 88.5) camera.up.set(-Math.sin(az), 0, -Math.cos(az))
    camera.lookAt(state.target)
    // Sprites face the camera.
    craftGlow.quaternion.copy(camera.quaternion)
    markerGlow.quaternion.copy(camera.quaternion)
  }

  const anchorVector = new Vector3()
  function emitLabels() {
    if (!onFrame) return
    const positions = {}
    for (const feature of sceneFeatures) {
      const anchor = featureAnchor(feature.id, crossing)
      anchorVector.set(...anchor).project(camera)
      const toCamera = [camera.position.x - anchor[0], camera.position.y - anchor[1], camera.position.z - anchor[2]]
      const onScreen = anchorVector.z < 1 && anchorVector.x > -1.05 && anchorVector.x < 1.05 && anchorVector.y > -1.05 && anchorVector.y < 1.05
      positions[feature.id] = { x: (anchorVector.x + 1) / 2 * width, y: (1 - anchorVector.y) / 2 * height, visible: onScreen && (feature.id === 'saturn' || !hiddenByPlanet(anchor, toCamera)) }
    }
    const geometry = signalGeometry(crossing)
    anchorVector.set(...geometry.crossing).project(camera)
    positions.crossing = { x: (anchorVector.x + 1) / 2 * width, y: (1 - anchorVector.y) / 2 * height, visible: anchorVector.z < 1 }
    onFrame({ positions, azimuth: state.azimuth, elevation: state.elevation, frames })
  }

  function render(now) {
    frame = 0
    if (disposed) return
    if (tween) {
      const t = tween.duration ? Math.min(1, (now - tween.start) / tween.duration) : 1
      const k = easeInOut(t)
      state.azimuth = tween.from.azimuth + wrapDegrees(tween.to.azimuth - tween.from.azimuth) * k
      state.elevation = tween.from.elevation + (tween.to.elevation - tween.from.elevation) * k
      state.distance = tween.from.distance + (tween.to.distance - tween.from.distance) * k
      state.target.lerpVectors(tween.from.target, tween.to.target, k)
      if (t >= 1) tween = null
    }
    applyCamera()
    renderer.render(scene, camera)
    frames += 1
    emitLabels()
    if (tween) request()
  }
  function request() {
    if (!frame && active && !disposed) frame = requestAnimationFrame(render)
  }

  function resize() {
    const bounds = container.getBoundingClientRect()
    width = Math.max(1, Math.round(bounds.width))
    height = Math.max(1, Math.round(bounds.height))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    request()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  resize()

  // Drag to turn the scene. Touch keeps vertical page scrolling (pan-y), so a
  // finger turns the scene sideways and the preset buttons cover elevation.
  let drag = null
  function pointerDown(event) {
    if (event.button !== 0) return
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, azimuth: state.azimuth, elevation: state.elevation, moved: false, touch: event.pointerType === 'touch' }
    if (!drag.touch) canvas.setPointerCapture?.(event.pointerId)
  }
  function pointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) < 3) return
    if (!drag.moved) { drag.moved = true; tween = null; onUserRotate?.() }
    state.azimuth = drag.azimuth - dx * 0.32
    state.elevation = drag.touch ? drag.elevation : Math.max(-12, Math.min(89, drag.elevation + dy * 0.28))
    request()
  }
  function pointerUp(event) {
    if (drag && event.pointerId === drag.id) drag = null
  }
  canvas.addEventListener('pointerdown', pointerDown)
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerup', pointerUp)
  canvas.addEventListener('pointercancel', pointerUp)
  function contextLost(event) { event.preventDefault(); onError?.(new Error('WebGL context lost')) }
  canvas.addEventListener('webglcontextlost', contextLost)

  function setHighlightUniform() {
    const feature = findFeature(highlight)
    const uniforms = ringMaterial.uniforms
    if (feature?.kind === 'ring') {
      uniforms.highlight.value = [kmToScene(feature.region.inner), kmToScene(feature.region.outer)]
      uniforms.highlightOn.value = 1
    } else uniforms.highlightOn.value = 0
    incomingMaterial.color.set(highlight === 'signal' ? '#fff1d1' : '#f3dcae')
    outgoingMaterial.uniforms.strength.value = highlight === 'signal' ? 1 : 0.95
  }
  setHighlightUniform()
  applyCamera()
  request()

  return {
    setView(next, { animate = true } = {}) {
      const to = { azimuth: next.azimuth, elevation: next.elevation, distance: next.distance, target: new Vector3(...next.target) }
      const duration = animate && !reducedMotion ? 900 : 0
      if (!duration) {
        tween = null
        Object.assign(state, { azimuth: to.azimuth, elevation: to.elevation, distance: to.distance })
        state.target.copy(to.target)
      } else {
        tween = { from: { azimuth: state.azimuth, elevation: state.elevation, distance: state.distance, target: state.target.clone() }, to, start: performance.now(), duration }
      }
      request()
    },
    rotateBy(dAzimuth, dElevation) {
      tween = null
      state.azimuth += dAzimuth
      state.elevation = Math.max(-12, Math.min(89, state.elevation + dElevation))
      onUserRotate?.()
      request()
    },
    setCrossing(km) { crossing = km; placeSignal(); request() },
    setProfile(next) {
      const previous = ringMaterial.uniforms.profileMap.value
      ringMaterial.uniforms.profileMap.value = ringTexture(next)
      previous.dispose()
      request()
    },
    setHighlight(id) { highlight = id; setHighlightUniform(); request() },
    setActive(value) {
      active = value
      if (!value && frame) { cancelAnimationFrame(frame); frame = 0 }
      if (value) {
        // Finish any interrupted camera move at once instead of replaying it.
        if (tween) tween.duration = 0
        request()
      }
    },
    stats: () => ({ frames, pixelRatio: renderer.getPixelRatio(), width, height }),
    dispose() {
      disposed = true
      if (frame) cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', pointerUp)
      canvas.removeEventListener('webglcontextlost', contextLost)
      ringMaterial.uniforms.profileMap.value.dispose()
      for (const item of disposables) item.dispose?.()
      scene.traverse(object => { if (object.isMesh) { object.geometry?.dispose?.(); object.material?.map?.dispose?.(); object.material?.dispose?.() } })
      renderer.dispose()
      canvas.remove()
    },
  }
}
