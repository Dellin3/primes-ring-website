import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import HeroVisual, {
  HeroFallbackGraphic,
  HeroSceneAnnotations,
  HeroAnnotationLeaders,
} from './HeroVisual.jsx'

const ringLayers = [
  { inner: 1.48, outer: 1.66, color: '#ceb47c', opacity: 0.42 },
  { inner: 1.71, outer: 2.12, color: '#8f7955', opacity: 0.26 },
  { inner: 2.18, outer: 2.7, color: '#e0cb98', opacity: 0.4 },
  { inner: 2.76, outer: 2.84, color: '#826c48', opacity: 0.3 },
  { inner: 2.9, outer: 3.32, color: '#b09867', opacity: 0.3 },
  { inner: 3.38, outer: 4.04, color: '#d6bd86', opacity: 0.36 },
  { inner: 4.1, outer: 4.28, color: '#927a52', opacity: 0.28 },
]

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(query).matches
  ))

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = (event) => setMatches(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

function supportsWebGL() {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch {
    return false
  }
}

function createSaturnTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 192
  const context = canvas.getContext('2d')

  for (let y = 0; y < canvas.height; y += 1) {
    const latitude = y / canvas.height
    const fineBands = Math.sin(latitude * Math.PI * 22) * 1.8
    const broadBands = Math.sin(latitude * Math.PI * 6) * 4.8
    const equatorialLift = Math.exp(-((latitude - 0.52) ** 2) / 0.035) * 5
    const polarShade = Math.abs(latitude - 0.5) * 7
    const lightness = 58 + fineBands + broadBands + equatorialLift - polarShade
    const saturation = 29 + Math.sin(latitude * Math.PI * 4) * 3
    context.fillStyle = `hsl(38 ${saturation}% ${lightness}%)`
    context.fillRect(0, y, canvas.width, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

function SaturnSystem({ reducedMotion, mobile, onAnchor }) {
  const systemRef = useRef(null)
  const planetTexture = useMemo(() => createSaturnTexture(), [])

  useEffect(() => () => planetTexture.dispose(), [planetTexture])

  useFrame(({ clock }) => {
    if (reducedMotion || !systemRef.current) return

    const phase = (clock.elapsedTime % 16) / 16 * Math.PI * 2
    systemRef.current.rotation.z = -0.2 + Math.sin(phase) * 0.035
  })

  return (
    <group ref={systemRef} position={[0.76, -0.18, -0.06]} rotation={[1.04, 0.06, -0.2]}>
      <object3D ref={(object) => { onAnchor('rings', object) }} position={[1.8, 3.6, 0.03]} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[1.3, mobile ? 48 : 72, mobile ? 32 : 48]} />
        <meshStandardMaterial
          map={planetTexture}
          color="#fff4dc"
          roughness={0.86}
          metalness={0.02}
        />
      </mesh>
      <mesh scale={1.035} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[1.3, 48, 32]} />
        <meshBasicMaterial color="#d8c18e" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {ringLayers.map((ring, index) => (
        <mesh
          key={`${ring.inner}-${ring.outer}`}
          position={[0, 0, (index - ringLayers.length / 2) * 0.004]}
          renderOrder={index + 1}
        >
          <ringGeometry args={[ring.inner, ring.outer, mobile ? 96 : 160]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function SceneRig({ reducedMotion, mobile, children }) {
  const rigRef = useRef(null)
  const { pointer } = useThree()

  useFrame((_, delta) => {
    if (reducedMotion || !rigRef.current) return
    const targetX = mobile ? 0 : pointer.x * 0.24
    const targetY = mobile ? 0 : pointer.y * 0.12
    rigRef.current.position.x = THREE.MathUtils.damp(
      rigRef.current.position.x,
      targetX,
      3,
      delta,
    )
    rigRef.current.position.y = THREE.MathUtils.damp(
      rigRef.current.position.y,
      targetY,
      3,
      delta,
    )
    rigRef.current.rotation.y = THREE.MathUtils.damp(
      rigRef.current.rotation.y,
      mobile ? 0 : pointer.x * 0.025,
      3,
      delta,
    )
  })

  return <group ref={rigRef} scale={mobile ? 0.92 : 1}>{children}</group>
}

function SpacecraftMarker({ onAnchor }) {
  return (
    <group position={[-3.65, 1.6, 0.62]} rotation={[0.16, -0.4, -0.15]} scale={0.72}>
      <object3D ref={(object) => { onAnchor('cassini', object) }} position={[0, 0.4, 0]} />
      <mesh>
        <boxGeometry args={[0.42, 0.22, 0.22]} />
        <meshStandardMaterial color="#c6b486" roughness={0.65} />
      </mesh>
      <mesh position={[-0.48, 0, 0]}>
        <boxGeometry args={[0.52, 0.03, 0.38]} />
        <meshStandardMaterial color="#36455b" roughness={0.72} />
      </mesh>
      <mesh position={[0.48, 0, 0]}>
        <boxGeometry args={[0.52, 0.03, 0.38]} />
        <meshStandardMaterial color="#36455b" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 0.08, 24, 1, true]} />
        <meshStandardMaterial color="#b99a61" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function ReceiverMarker({ onAnchor }) {
  return (
    <group position={[3.84, 1.08, -0.44]} rotation={[0.18, -0.82, -0.08]} scale={0.62}>
      <object3D ref={(object) => { onAnchor('earth', object) }} position={[0, 0.3, 0]} />
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.24, 0.025, 10, 40, Math.PI * 1.35]} />
        <meshStandardMaterial color="#d5c397" roughness={0.68} />
      </mesh>
      <mesh position={[-0.08, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.21, 0.08, 28, 1, true]} />
        <meshStandardMaterial color="#bca46f" side={THREE.DoubleSide} roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.36, 0]} rotation={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.025, 0.035, 0.55, 10]} />
        <meshStandardMaterial color="#536274" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.64, 0]}>
        <boxGeometry args={[0.48, 0.035, 0.22]} />
        <meshStandardMaterial color="#536274" roughness={0.8} />
      </mesh>
    </group>
  )
}

function RadioSignal() {
  const signalCurve = useMemo(
    () => new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.45, 1.54, 0.55),
      new THREE.Vector3(-2.1, 1.48, 0.31),
      new THREE.Vector3(-0.95, 1.4, 0.04),
      new THREE.Vector3(1.8, 1.28, -0.2),
      new THREE.Vector3(3.8, 1.08, -0.44),
    ]),
    [],
  )
  const waveCurve = useMemo(() => {
    const points = Array.from({ length: 52 }, (_, index) => {
      const progress = index / 51
      const x = -0.72 + progress * 4.52
      const baselineY = 1.39 - progress * 0.3
      const oscillation = Math.sin(progress * Math.PI * 9) * 0.085 * progress
      return new THREE.Vector3(x, baselineY + oscillation, -0.04 - progress * 0.44)
    })
    return new THREE.CatmullRomCurve3(points)
  }, [])

  return (
    <group>
      <mesh>
        <tubeGeometry args={[signalCurve, 72, 0.035, 6, false]} />
        <meshBasicMaterial color="#c7a660" transparent opacity={0.09} depthWrite={false} />
      </mesh>
      <mesh>
        <tubeGeometry args={[signalCurve, 72, 0.012, 6, false]} />
        <meshBasicMaterial color="#c7a660" transparent opacity={0.78} />
      </mesh>
      <mesh>
        <tubeGeometry args={[waveCurve, 96, 0.016, 6, false]} />
        <meshBasicMaterial color="#e1c98f" transparent opacity={0.68} />
      </mesh>
      <mesh position={[-0.68, 1.43, -0.02]} rotation={[Math.PI / 2, 0.2, 0]}>
        <torusGeometry args={[0.09, 0.012, 8, 32]} />
        <meshBasicMaterial color="#ead6a3" transparent opacity={0.72} />
      </mesh>
    </group>
  )
}

function OccultationScene({ reducedMotion, mobile, onAnchor }) {
  return (
    <>
      <ambientLight intensity={0.48} color="#8c9aab" />
      <directionalLight position={[-4, 5, 6]} intensity={3.1} color="#f1d59c" />
      <directionalLight position={[4, -2, 2]} intensity={0.62} color="#6d85a0" />
      <SceneRig reducedMotion={reducedMotion} mobile={mobile}>
        <SaturnSystem reducedMotion={reducedMotion} mobile={mobile} onAnchor={onAnchor} />
        <SpacecraftMarker onAnchor={onAnchor} />
        <RadioSignal />
        <ReceiverMarker onAnchor={onAnchor} />
      </SceneRig>
    </>
  )
}

function SceneAnnotationsProjection({ anchors, pathsRef }) {
  const { camera, size, invalidate } = useThree()
  const point = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- Three.js cameras are imperative renderer objects.
    camera.zoom = Math.min(size.width / 10.7, size.height / 6.5)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size.width, size.height, invalidate])

  useFrame(() => {
    const starts = { cassini: 800 / 6, rings: 400, earth: 800 * 5 / 6 }
    for (const [name, startX] of Object.entries(starts)) {
      const anchor = anchors.current[name]
      const line = pathsRef.current[name]
      if (!anchor || !line) continue
      anchor.updateWorldMatrix(true, false)
      anchor.getWorldPosition(point).project(camera)
      const endX = (point.x + 1) / 2 * 800
      const endY = (1 - point.y) / 2 * 460 + 40
      const elbowY = 40 + Math.min(45, Math.max(12, (endY - 40) * 0.4))
      line.setAttribute('d', `M${startX} 40 L${startX} ${elbowY} L${endX} ${endY}`)
    }
  })

  return null
}

function SceneReady({ onReady }) {
  const reported = useRef(false)

  useFrame(() => {
    if (reported.current) return
    reported.current = true
    onReady()
  })

  return null
}

class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export default function ScientificHeroScene() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const mobile = useMediaQuery('(max-width: 768px)')
  const [webGLAvailable] = useState(supportsWebGL)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const anchors = useRef({})
  const pathsRef = useRef({})
  const onAnchor = useCallback((name, object) => { anchors.current[name] = object }, [])

  if (!webGLAvailable || failed) return <HeroVisual />

  return (
    <figure className={`scientific-hero-scene${ready ? ' is-webgl-ready' : ''}`}>
      <HeroSceneAnnotations />
      <div
        className="hero-scene-viewport"
        role="img"
        aria-label="Conceptual three-dimensional Cassini radio-occultation geometry. A signal travels from Cassini through Saturn's tilted ring plane toward an Earth receiver."
      >
        <div className="hero-scene-fallback-layer" aria-hidden="true">
          <HeroFallbackGraphic />
        </div>
        <SceneErrorBoundary onError={() => setFailed(true)}>
          <Canvas
            aria-hidden="true"
            orthographic
            camera={{ position: [0.4, 0.3, 15], zoom: 55 }}
            dpr={[1, 1.5]}
            frameloop={reducedMotion ? 'demand' : 'always'}
            gl={{
              alpha: true,
              antialias: !mobile,
              powerPreference: 'high-performance',
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace
            }}
          >
            <SceneReady onReady={() => setReady(true)} />
            <OccultationScene reducedMotion={reducedMotion} mobile={mobile} onAnchor={onAnchor} />
            <SceneAnnotationsProjection anchors={anchors} pathsRef={pathsRef} />
          </Canvas>
        </SceneErrorBoundary>
        <HeroAnnotationLeaders pathsRef={pathsRef} />
      </div>
      <figcaption>Conceptual occultation geometry · not to scale</figcaption>
    </figure>
  )
}
