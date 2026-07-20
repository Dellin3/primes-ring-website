import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

function createSaturnTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const base = ctx.createLinearGradient(0, 0, 0, canvas.height)
  base.addColorStop(0, '#c9b08a')
  base.addColorStop(0.18, '#d8c3a0')
  base.addColorStop(0.35, '#b9976d')
  base.addColorStop(0.5, '#e2d0ad')
  base.addColorStop(0.68, '#c4a47a')
  base.addColorStop(0.84, '#a9865c')
  base.addColorStop(1, '#8f7048')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const bands = [
    [0.08, '#b48a58', 0.18],
    [0.16, '#e8d7b6', 0.12],
    [0.24, '#9d7649', 0.16],
    [0.33, '#dcc7a1', 0.14],
    [0.42, '#b18a5c', 0.2],
    [0.52, '#f0e2c4', 0.1],
    [0.61, '#a57b4d', 0.18],
    [0.71, '#ddc8a4', 0.13],
    [0.8, '#946f45', 0.17],
    [0.9, '#e5d3b0', 0.11],
  ]

  bands.forEach(([yRatio, color, alpha]) => {
    const y = yRatio * canvas.height
    const height = 10 + Math.random() * 22
    ctx.fillStyle = color
    ctx.globalAlpha = alpha
    ctx.fillRect(0, y, canvas.width, height)
  })

  ctx.globalAlpha = 0.08
  for (let i = 0; i < 1800; i += 1) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    ctx.fillStyle = Math.random() > 0.5 ? '#fff6e4' : '#6d5334'
    ctx.fillRect(x, y, 1.5, 1.5)
  }

  ctx.globalAlpha = 1
  const poleGlow = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height * 0.12,
    20,
    canvas.width / 2,
    canvas.height * 0.12,
    160,
  )
  poleGlow.addColorStop(0, 'rgba(255, 246, 230, 0.25)')
  poleGlow.addColorStop(1, 'rgba(255, 246, 230, 0)')
  ctx.fillStyle = poleGlow
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function createRingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const bands = [
    [0.0, 0.08, 'rgba(210, 190, 150, 0.05)'],
    [0.08, 0.18, 'rgba(230, 210, 170, 0.35)'],
    [0.18, 0.22, 'rgba(120, 100, 70, 0.08)'],
    [0.22, 0.42, 'rgba(236, 216, 170, 0.55)'],
    [0.42, 0.48, 'rgba(90, 75, 50, 0.12)'],
    [0.48, 0.68, 'rgba(220, 198, 150, 0.42)'],
    [0.68, 0.74, 'rgba(70, 58, 40, 0.18)'],
    [0.74, 0.9, 'rgba(200, 178, 130, 0.28)'],
    [0.9, 1.0, 'rgba(180, 160, 120, 0.08)'],
  ]

  bands.forEach(([start, end, color]) => {
    ctx.fillStyle = color
    ctx.fillRect(start * canvas.width, 0, (end - start) * canvas.width, canvas.height)
  })

  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * canvas.width
    const width = 1 + Math.random() * 3
    ctx.fillStyle = `rgba(255, 240, 200, ${0.04 + Math.random() * 0.12})`
    ctx.fillRect(x, 0, width, canvas.height)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

function SaturnBody({ map }) {
  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1, 96, 96]} />
      <meshStandardMaterial
        map={map}
        roughness={0.72}
        metalness={0.08}
        emissive="#3a2b18"
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}

function Atmosphere() {
  return (
    <mesh scale={1.035}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial
        color="#f0dfb8"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function RingSystem({ map }) {
  const ringGroups = [
    { inner: 1.28, outer: 1.55, opacity: 0.55, tilt: 0 },
    { inner: 1.58, outer: 1.92, opacity: 0.42, tilt: 0.002 },
    { inner: 1.96, outer: 2.28, opacity: 0.28, tilt: -0.002 },
    { inner: 2.32, outer: 2.55, opacity: 0.14, tilt: 0.001 },
  ]

  return (
    <group rotation={[Math.PI / 2.15, 0.08, 0.18]}>
      {ringGroups.map((ring) => (
        <mesh key={`${ring.inner}-${ring.outer}`} rotation={[ring.tilt, 0, 0]} receiveShadow>
          <ringGeometry args={[ring.inner, ring.outer, 180]} />
          <meshStandardMaterial
            map={map}
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
            roughness={0.55}
            metalness={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function SaturnScene() {
  const groupRef = useRef(null)
  const saturnMap = useMemo(() => createSaturnTexture(), [])
  const ringMap = useMemo(() => createRingTexture(), [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <>
      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', 12, 28]} />

      <ambientLight intensity={0.28} color="#c9d4e8" />
      <directionalLight
        position={[6, 3.5, 4]}
        intensity={1.55}
        color="#fff2d8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, -1.5, -3]} intensity={0.35} color="#8ea4c8" />
      <pointLight position={[0, 2.5, -4]} intensity={0.45} color="#ffd9a0" />
      <hemisphereLight args={['#dfe8ff', '#1a140c', 0.35]} />

      <Stars radius={80} depth={40} count={2800} factor={3.2} saturation={0} fade speed={0.35} />

      <group ref={groupRef} position={[0, 0.05, 0]}>
        <SaturnBody map={saturnMap} />
        <Atmosphere />
        <RingSystem map={ringMap} />
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={9}
        autoRotate
        autoRotateSpeed={0.35}
        target={[0, 0.05, 0]}
      />
    </>
  )
}

export default function SaturnModel() {
  return (
    <div className="saturn-canvas-wrap">
      <Canvas
        camera={{ position: [0.8, 1.15, 4.6], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
      >
        <SaturnScene />
      </Canvas>
    </div>
  )
}
