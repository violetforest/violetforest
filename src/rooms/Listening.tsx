import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial, Cloud, Clouds, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

interface Track {
  title: string
  artist: string
  artwork_url: string | null
  permalink_url: string
  duration: number
}

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://qbmglbnxkchwekatkrlr.supabase.co'}/functions/v1/soundcloud-likes`
const BASE = import.meta.env.BASE_URL || '/violetforest/'

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ── Config ───────────────────────────────────────────────────
interface Config {
  depthSpacing: number
  xSpread: number
  ySpread: number
  parallax: number
  opacity: number
  roughness: number
  metalness: number
  clearcoat: number
  transmission: number
  envMapIntensity: number
  glowIntensity: number
  reflectionStrength: number
  reflectionBlur: number
  stackRotX: number
  stackRotY: number
  stackRotZ: number
  vanishX: number
  vanishY: number
  entranceSpeed: number
  entranceStagger: number
  hoverLift: number
  hoverSnap: number
  scrollLerp: number
  coverScale: number
  cloudOpacity: number
  cloudSpeed: number
  cloudScale: number
  showClouds: boolean
  showReflection: boolean
  showEnvMap: boolean
  showGlow: boolean
  dpr: number
}

const DEFAULT_CONFIG: Config = {
  depthSpacing: 20,
  xSpread: 0.3,
  ySpread: 0.4,
  parallax: 0.21,
  opacity: 1,
  roughness: 1,
  metalness: 0.04,
  clearcoat: 0,
  transmission: 0,
  envMapIntensity: 1.09,
  glowIntensity: 2.1,
  reflectionStrength: 1,
  reflectionBlur: 600,
  stackRotX: 0.018,
  stackRotY: -0.43,
  stackRotZ: -0.02,
  vanishX: -0.6,
  vanishY: -0.6,
  entranceSpeed: 1.8,
  entranceStagger: 0.06,
  hoverLift: 2.5,
  hoverSnap: 0.18,
  scrollLerp: 0.12,
  coverScale: 1,
  cloudOpacity: 0.4,
  cloudSpeed: 0.2,
  cloudScale: 0.2,
  showClouds: true,
  showReflection: true,
  showEnvMap: true,
  showGlow: true,
  dpr: 1.5,
}


// ── Slider Panel ─────────────────────────────────────────────
function SliderPanel({
  config,
  onChange,
  visible,
  onToggle,
}: {
  config: Config
  onChange: (key: keyof Config, value: number | boolean) => void
  visible: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)

  const sliders: { key: keyof Config; label: string; min: number; max: number; step: number }[] = [
    { key: 'depthSpacing', label: 'Depth Spacing', min: 0.5, max: 20, step: 0.1 },
    { key: 'xSpread', label: 'X Spread', min: 0, max: 6, step: 0.1 },
    { key: 'ySpread', label: 'Y Spread', min: 0, max: 4, step: 0.1 },
    { key: 'parallax', label: 'Parallax', min: 0, max: 1, step: 0.01 },
    { key: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.01 },
    { key: 'roughness', label: 'Roughness', min: 0, max: 1, step: 0.01 },
    { key: 'metalness', label: 'Metalness', min: 0, max: 1, step: 0.01 },
    { key: 'clearcoat', label: 'Clearcoat', min: 0, max: 1, step: 0.01 },
    { key: 'transmission', label: 'Transmission', min: 0, max: 1, step: 0.01 },
    { key: 'envMapIntensity', label: 'Env Map Intensity', min: 0, max: 2, step: 0.01 },
    { key: 'glowIntensity', label: 'Glow Intensity', min: 0, max: 8, step: 0.1 },
    { key: 'reflectionStrength', label: 'Reflection Strength', min: 0, max: 1, step: 0.01 },
    { key: 'reflectionBlur', label: 'Reflection Blur', min: 0, max: 1000, step: 10 },
    { key: 'stackRotX', label: 'Stack Rotate X', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'stackRotY', label: 'Stack Rotate Y', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'stackRotZ', label: 'Stack Rotate Z', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'vanishX', label: 'Vanish Point X', min: -5, max: 5, step: 0.1 },
    { key: 'vanishY', label: 'Vanish Point Y', min: -5, max: 5, step: 0.1 },
    { key: 'entranceSpeed', label: 'Entrance Speed', min: 0.2, max: 5, step: 0.1 },
    { key: 'entranceStagger', label: 'Entrance Stagger', min: 0, max: 0.3, step: 0.01 },
    { key: 'hoverLift', label: 'Hover Lift', min: 0, max: 6, step: 0.1 },
    { key: 'hoverSnap', label: 'Hover Snap Speed', min: 0.02, max: 0.5, step: 0.01 },
    { key: 'scrollLerp', label: 'Scroll Smoothness', min: 0.02, max: 0.5, step: 0.01 },
    { key: 'coverScale', label: 'Cover Scale', min: 0.3, max: 3, step: 0.1 },
    { key: 'cloudOpacity', label: 'Cloud Opacity', min: 0, max: 1, step: 0.01 },
    { key: 'cloudSpeed', label: 'Cloud Speed', min: 0, max: 1, step: 0.01 },
    { key: 'cloudScale', label: 'Cloud Scale', min: 0.1, max: 3, step: 0.1 },
    { key: 'dpr', label: 'Pixel Ratio', min: 0.5, max: 2, step: 0.1 },
  ]

  const toggles: { key: keyof Config; label: string }[] = [
    { key: 'showClouds', label: 'Clouds' },
    { key: 'showReflection', label: 'Reflection Floor' },
    { key: 'showEnvMap', label: 'Environment Map' },
    { key: 'showGlow', label: 'Active Glow' },
  ]

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const btnStyle: React.CSSProperties = {
    marginTop: '0.4rem',
    width: '100%',
    padding: '0.4rem',
    background: 'rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '0.65rem',
  }

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
          background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '4px', padding: '0.4rem 0.7rem', fontSize: '0.7rem',
          cursor: 'pointer', fontFamily: 'monospace', opacity: 0.6,
        }}
      >
        {visible ? 'close' : 'controls'}
      </button>

      {visible && (
        <div
          data-settings-panel
          style={{
            position: 'absolute', top: '3rem', right: '1rem', zIndex: 10,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px',
            padding: '1rem', width: '260px', maxHeight: '70vh', overflowY: 'auto',
            fontFamily: 'monospace', fontSize: '0.65rem',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.7rem' }}>Scene Controls</p>

          {toggles.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={config[key] as boolean} onChange={(e) => onChange(key, e.target.checked)} />
              {label}
            </label>
          ))}

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', margin: '0.5rem 0' }} />

          {sliders.map(({ key, label, min, max, step }) => (
            <div key={key} style={{ marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{label}</span>
                <span style={{ opacity: 0.5 }}>{(config[key] as number).toFixed(2)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={config[key] as number}
                onChange={(e) => onChange(key, parseFloat(e.target.value))} style={{ width: '100%', height: '4px' }} />
            </div>
          ))}

          <button onClick={copyJson} style={{ ...btnStyle, background: copied ? 'rgba(180,160,230,0.2)' : 'rgba(0,0,0,0.05)' }}>
            {copied ? 'copied!' : 'copy json'}
          </button>

          <button onClick={() => { for (const k of Object.keys(DEFAULT_CONFIG) as (keyof Config)[]) onChange(k, DEFAULT_CONFIG[k]) }} style={btnStyle}>
            reset defaults
          </button>
        </div>
      )}
    </>
  )
}

// ── Album Cover (square artwork) ─────────────────────────────
function AlbumCover({
  track,
  index,
  scrollOffset,
  targetOffset,
  totalTracks,
  loaded,
  config,
  onSelect,
}: {
  track: Track
  index: number
  scrollOffset: React.MutableRefObject<number>
  targetOffset: React.MutableRefObject<number>
  totalTracks: number
  loaded: boolean
  config: React.MutableRefObject<Config>
  onSelect: (i: number) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const entranceProgress = useRef(0)
  const hoverTarget = useRef(0)
  const hoverValue = useRef(0)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>()
  const isMobile = useRef(typeof window !== 'undefined' && 'ontouchstart' in window)
  const tappedOpen = useRef(false)
  const prevRelIndex = useRef(0)
  const wrapFade = useRef(1) // 1 = visible, 0 = hidden

  const rand = useMemo(() => ({
    xNorm: seededRandom(index * 3) - 0.5,
    yNorm: seededRandom(index * 7) - 0.5,
    startX: (seededRandom(index * 31) - 0.5) * 16,
    startY: (seededRandom(index * 37) - 0.5) * 10,
    startZ: -15 - seededRandom(index * 41) * 20,
    entranceDelay: index,
  }), [index])

  const texture = useMemo(() => {
    if (!track.artwork_url) return null
    const loader = new THREE.TextureLoader()
    const tex = loader.load(track.artwork_url)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [track.artwork_url])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const c = config.current

    if (loaded && entranceProgress.current < 1) {
      const spd = c.entranceSpeed
      const delayedStart = Math.max(0, entranceProgress.current + delta * spd - rand.entranceDelay * c.entranceStagger * spd * delta)
      entranceProgress.current = Math.min(1, delayedStart + delta * spd)
    }
    const t = entranceProgress.current
    const ease = 1 - Math.pow(1 - t, 3)

    // Infinite cycling stack — wraps around
    const stackSpacing = c.depthSpacing * 0.1
    const offset = scrollOffset.current
    // Wrap index so covers cycle infinitely
    let relIndex = ((index - offset) % totalTracks + totalTracks) % totalTracks
    // Center the range so covers sit behind camera too
    if (relIndex > totalTracks / 2) relIndex -= totalTracks

    // Detect wrap — if relIndex jumped more than half the stack, fade out and teleport
    const jumped = Math.abs(relIndex - prevRelIndex.current) > totalTracks * 0.4
    if (jumped && ease >= 1) {
      wrapFade.current = 0 // instantly hide
    }
    prevRelIndex.current = relIndex

    // Fade back in
    wrapFade.current = THREE.MathUtils.lerp(wrapFade.current, 1, 0.15)

    const targetX = 0
    const targetY = 0
    const targetZ = -relIndex * stackSpacing

    // Hover lifts the cover up — smooth interpolation
    hoverValue.current = THREE.MathUtils.lerp(hoverValue.current, hoverTarget.current, 0.1)
    const lift = hoverValue.current * c.hoverLift

    const x = THREE.MathUtils.lerp(rand.startX, targetX, ease)
    const y = THREE.MathUtils.lerp(rand.startY, targetY + lift, ease)
    const z = THREE.MathUtils.lerp(rand.startZ, targetZ, ease)

    // When wrapping, teleport instantly instead of sliding
    if (wrapFade.current < 0.1) {
      meshRef.current.position.x = x
      meshRef.current.position.y = y
      meshRef.current.position.z = z
    } else {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, x, 0.07)
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, y, 0.07)
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, z, 0.07)
    }

    // Face camera — no rotation
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.06)
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.06)
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.06)

    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, c.coverScale, 0.07))

    if (materialRef.current) {
      // Front cover gets slight transparency, wrapFade for cycling
      const frontFade = relIndex === 0 ? 0.7 : 1
      const targetOpacity = c.opacity * frontFade * wrapFade.current * ease
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.08)
      materialRef.current.roughness = c.roughness
      materialRef.current.metalness = c.metalness
      materialRef.current.clearcoat = c.clearcoat
      materialRef.current.transmission = c.transmission
      materialRef.current.envMapIntensity = c.envMapIntensity
    }
  })

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation()
        if (isMobile.current) {
          // Mobile: first tap lifts, second tap selects
          if (tappedOpen.current) {
            tappedOpen.current = false
            hoverTarget.current = 0
            targetOffset.current = index - 1
            scrollOffset.current = index - 1
            const wrapped = ((index % totalTracks) + totalTracks) % totalTracks
            onSelect(wrapped)
          } else {
            tappedOpen.current = true
            hoverTarget.current = 1
            // Auto-close after 3s
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
            hoverTimeout.current = setTimeout(() => { tappedOpen.current = false; hoverTarget.current = 0 }, 3000)
          }
        } else {
          // Desktop: click to skip
          targetOffset.current = index - 1
          scrollOffset.current = index - 1
          const wrapped = ((index % totalTracks) + totalTracks) % totalTracks
          onSelect(wrapped)
        }
      }}
      onPointerOver={(e) => {
        if (isMobile.current) return
        e.stopPropagation()
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
        hoverTarget.current = 1
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        if (isMobile.current) return
        hoverTimeout.current = setTimeout(() => { hoverTarget.current = 0 }, 50)
        document.body.style.cursor = 'default'
      }}
    >
      <planeGeometry args={[2.2, 2.2]} />
      <meshPhysicalMaterial
        ref={materialRef}
        map={texture}
        color={texture ? '#ffffff' : '#1a1520'}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        roughness={1}
        metalness={0}
        clearcoat={0}
        clearcoatRoughness={0.05}
        reflectivity={0}
        transmission={0}
        thickness={0}
        ior={1.5}
        envMapIntensity={0}
      />
    </mesh>
  )
}

// ── Active glow ──────────────────────────────────────────────
function ActiveGlow({
  tracks,
  activeIndex,
  scrollOffset,
  config,
}: {
  tracks: Track[]
  activeIndex: number
  scrollOffset: React.MutableRefObject<number>
  config: React.MutableRefObject<Config>
}) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (!lightRef.current || tracks.length === 0) return
    const c = config.current
    const offset = scrollOffset.current
    const relIndex = activeIndex - offset

    // Glow hovers above the active CD in the stack
    const targetY = relIndex * 0.15 + 2.5
    lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, 0, 0.06)
    lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, targetY, 0.06)
    lightRef.current.position.z = THREE.MathUtils.lerp(lightRef.current.position.z, 0, 0.06)
    lightRef.current.intensity = c.glowIntensity
  })

  return <pointLight ref={lightRef} color="#e0d0f8" intensity={2.5} distance={10} decay={2} />
}

// ── Environment map ──────────────────────────────────────────
function EnvironmentMap({ enabled }: { enabled: boolean }) {
  const { scene } = useThree()

  useEffect(() => {
    if (!enabled) { scene.environment = null; return }
    const loader = new THREE.TextureLoader()
    loader.load(`${BASE}envmap.webp`, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      texture.colorSpace = THREE.SRGBColorSpace
      scene.environment = texture
    })
    return () => { scene.environment = null }
  }, [scene, enabled])

  return null
}

// ── Reflection floor ─────────────────────────────────────────
function ReflectionFloor({ config }: { config: React.MutableRefObject<Config> }) {
  const c = config.current
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[40, 40]} />
      <MeshReflectorMaterial
        blur={[c.reflectionBlur, c.reflectionBlur * 0.33]}
        resolution={512}
        mixBlur={1}
        mixStrength={c.reflectionStrength}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#e8e0f0"
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  )
}

// ── DPR controller ───────────────────────────────────────────
function DprController({ config }: { config: React.MutableRefObject<Config> }) {
  const { gl } = useThree()
  useFrame(() => {
    const target = config.current.dpr
    if (Math.abs(gl.getPixelRatio() - target) > 0.05) gl.setPixelRatio(target)
  })
  return null
}

// ── Camera controller ────────────────────────────────────────
function CameraRig({ config }: { config: React.MutableRefObject<Config> }) {
  const { camera } = useThree()
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useFrame(() => {
    const c = config.current
    target.x = THREE.MathUtils.lerp(target.x, c.vanishX, 0.08)
    target.y = THREE.MathUtils.lerp(target.y, c.vanishY, 0.08)
    camera.lookAt(target)
  })

  return null
}

// ── 4-pointed twinkling star ─────────────────────────────────
function createStarShape(outerRadius: number, innerRadius: number) {
  const shape = new THREE.Shape()
  const points = 4
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

const starShape = createStarShape(0.15, 0.04)
const starGeometry = new THREE.ShapeGeometry(starShape)

function TwinklingStar({ position, speed = 1, color = '#fff0f8' }: { position: [number, number, number]; speed?: number; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime() * speed + offset
    const scale = 0.5 + Math.pow(Math.sin(t), 2) * 0.5
    meshRef.current.scale.setScalar(scale)
    meshRef.current.rotation.z = t * 0.3
    if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
      meshRef.current.material.opacity = 0.3 + Math.pow(Math.sin(t), 2) * 0.7
    }
  })

  return (
    <mesh ref={meshRef} position={position} geometry={starGeometry}>
      <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
    </mesh>
  )
}

function StarField() {
  const stars = useMemo(() => {
    const cloudCenters: [number, number, number][] = [
      [-6, 3, -8], [5, 4, -10], [-3, 5, -12],
      [7, 2, -6], [0, 6, -15], [-8, 4, -14],
    ]
    const result: { pos: [number, number, number]; speed: number; color: string }[] = []
    const colors = ['#fff8fc', '#ffe0f0', '#ffd0e8', '#ffffff', '#fff0f8']
    for (const center of cloudCenters) {
      const count = 3 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        result.push({
          pos: [
            center[0] + (Math.random() - 0.5) * 4,
            center[1] + (Math.random() - 0.5) * 3,
            center[2] + (Math.random() - 0.5) * 3,
          ] as [number, number, number],
          speed: 0.5 + Math.random() * 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }
    return result
  }, [])

  return (
    <>
      {stars.map((s, i) => (
        <TwinklingStar key={i} position={s.pos} speed={s.speed} color={s.color} />
      ))}
    </>
  )
}

// ── Pastel clouds ───────────────────────────────────────────
function PastelClouds({ config }: { config: React.MutableRefObject<Config> }) {
  const c = config.current
  const s = c.cloudScale
  return (
    <>
      <Clouds material={THREE.MeshLambertMaterial}>
        <Cloud position={[-6, 3, -8]} speed={c.cloudSpeed} opacity={c.cloudOpacity} color="#f8c8d8" segments={20} volume={4 * s} />
        <Cloud position={[5, 4, -10]} speed={c.cloudSpeed * 0.75} opacity={c.cloudOpacity * 0.9} color="#f0b0c8" segments={15} volume={3.5 * s} />
        <Cloud position={[-3, 5, -12]} speed={c.cloudSpeed * 1.2} opacity={c.cloudOpacity * 0.85} color="#fad0e0" segments={18} volume={3 * s} />
        <Cloud position={[7, 2, -6]} speed={c.cloudSpeed * 0.5} opacity={c.cloudOpacity} color="#f5c0d5" segments={12} volume={2.5 * s} />
        <Cloud position={[0, 6, -15]} speed={c.cloudSpeed * 0.9} opacity={c.cloudOpacity * 0.75} color="#fce0ec" segments={22} volume={5 * s} />
        <Cloud position={[-8, 4, -14]} speed={c.cloudSpeed * 0.6} opacity={c.cloudOpacity * 0.9} color="#f8d0e0" segments={16} volume={3.5 * s} />
      </Clouds>
      <Sparkles position={[-6, 3, -8]} count={30} scale={5 * s} size={3} speed={0.4} color="#ffe0f0" opacity={0.7} />
      <Sparkles position={[5, 4, -10]} count={25} scale={4.5 * s} size={2.5} speed={0.3} color="#ffd0e8" opacity={0.6} />
      <Sparkles position={[-3, 5, -12]} count={20} scale={4 * s} size={2} speed={0.5} color="#ffe8f4" opacity={0.65} />
      <Sparkles position={[7, 2, -6]} count={15} scale={3.5 * s} size={3} speed={0.35} color="#ffc8e0" opacity={0.7} />
      <Sparkles position={[0, 6, -15]} count={35} scale={6 * s} size={2.5} speed={0.25} color="#fff0f8" opacity={0.5} />
      <Sparkles position={[-8, 4, -14]} count={20} scale={4.5 * s} size={2} speed={0.45} color="#ffd8ec" opacity={0.6} />
      <StarField />
    </>
  )
}

// ── Stack group (applies rotation to whole stack) ───────────
function StackGroup({ config, children }: { config: React.MutableRefObject<Config>; children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    const c = config.current
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, c.stackRotX, 0.08)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, c.stackRotY, 0.08)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, c.stackRotZ, 0.08)
  })

  return <group ref={groupRef}>{children}</group>
}

// ── Scene ────────────────────────────────────────────────────
function Scene({
  tracks, scrollOffset, targetOffset, activeIndex, onSelect, mousePos, loaded, config,
}: {
  tracks: Track[]
  scrollOffset: React.MutableRefObject<number>
  targetOffset: React.MutableRefObject<number>
  activeIndex: number
  onSelect: (i: number) => void
  mousePos: React.MutableRefObject<{ x: number; y: number }>
  loaded: boolean
  config: React.MutableRefObject<Config>
}) {
  const c = config.current
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 6, 8]} intensity={1} />
      <directionalLight position={[-4, -2, 4]} intensity={0.3} color="#c8b8e8" />

      <EnvironmentMap enabled={c.showEnvMap} />
      <DprController config={config} />
      <CameraRig config={config} />
      {c.showClouds && <PastelClouds config={config} />}

      <StackGroup config={config}>
        {tracks.map((track, i) => (
          <AlbumCover
            key={track.permalink_url}
            track={track}
            index={i}
            scrollOffset={scrollOffset}
            targetOffset={targetOffset}
            totalTracks={tracks.length}
            loaded={loaded}
            config={config}
            onSelect={onSelect}
          />
        ))}

        {c.showGlow && <ActiveGlow tracks={tracks} activeIndex={activeIndex} scrollOffset={scrollOffset} config={config} />}
      </StackGroup>
      {c.showReflection && <ReflectionFloor config={config} />}
    </>
  )
}

// ── Main ─────────────────────────────────────────────────────
export function Listening() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(1)
  const [nowPlaying, setNowPlaying] = useState<string | null>(null)
  const [configState, setConfigState] = useState<Config>({ ...DEFAULT_CONFIG })
  const [panelVisible, setPanelVisible] = useState(false)
  const scrollOffset = useRef(0)
  const targetOffset = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const snapTimeout = useRef<ReturnType<typeof setTimeout>>()
  const configRef = useRef<Config>({ ...DEFAULT_CONFIG })

  useEffect(() => { configRef.current = configState }, [configState])

  // Sync player with active cover on scroll
  useEffect(() => {
    if (tracks[activeIndex]) setNowPlaying(tracks[activeIndex].permalink_url)
  }, [activeIndex, tracks])

  const updateConfig = useCallback((key: keyof Config, value: number | boolean) => {
    setConfigState((prev) => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    fetch(EDGE_FN_URL, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wdc8NjEgJqfmH52FCRnWsw_qBVYTpbC',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wdc8NjEgJqfmH52FCRnWsw_qBVYTpbC'}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTracks(data)
          if (data.length > 0) setNowPlaying(data[0].permalink_url)
        }
        setLoading(false)
        setTimeout(() => setLoaded(true), 100)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    let raf: number
    const tick = () => { scrollOffset.current += (targetOffset.current - scrollOffset.current) * configRef.current.scrollLerp; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Scroll to cycle through the stack
  useEffect(() => {
    const el = containerRef.current
    if (!el || tracks.length === 0) return
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.closest?.('[data-settings-panel]')) return
      e.preventDefault()
      const dir = e.deltaY > 0 ? 1 : -1
      targetOffset.current += dir
      // Active = one behind the front (the prominent fully-opaque cover)
      const wrapped = (((Math.round(targetOffset.current) + 1) % tracks.length) + tracks.length) % tracks.length
      setActiveIndex(wrapped)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [tracks.length])

  // Touch to cycle
  useEffect(() => {
    if (tracks.length === 0) return
    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const delta = touchStartY - e.touches[0].clientY
      if (Math.abs(delta) > 30) {
        const dir = delta > 0 ? 1 : -1
        targetOffset.current += dir
        const wrapped = (((Math.round(targetOffset.current) + 1) % tracks.length) + tracks.length) % tracks.length
        setActiveIndex(wrapped)
        touchStartY = e.touches[0].clientY
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => { window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchmove', onTouchMove) }
  }, [tracks.length])

  const selectTrack = useCallback((i: number) => {
    setActiveIndex(i)
    targetOffset.current = i
    setNowPlaying(tracks[i]?.permalink_url || null)
  }, [tracks])

  const playActive = useCallback(() => {
    if (tracks[activeIndex]) setNowPlaying(tracks[activeIndex].permalink_url)
  }, [tracks, activeIndex])

  const activeTrack = tracks[activeIndex]

  return (
    <motion.div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
    >
      <style>{`
        @media (max-width: 768px) {
          .listening-controls-wrapper { display: none !important; }
        }
      `}</style>
      {tracks.length > 0 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Canvas
            camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 6] }}
            dpr={[1, configState.dpr]}
            style={{ background: 'transparent' }}
            gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
          >
            <Scene tracks={tracks} scrollOffset={scrollOffset} targetOffset={targetOffset} activeIndex={activeIndex} onSelect={selectTrack} mousePos={mousePos} loaded={loaded} config={configRef} />
          </Canvas>
        </div>
      )}

      <div className="listening-controls-wrapper">
        <SliderPanel config={configState} onChange={updateConfig} visible={panelVisible} onToggle={() => setPanelVisible((v) => !v)} />
      </div>

      {/* Top overlay */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem 1rem 0', pointerEvents: 'none' }}>
        <p style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', letterSpacing: '0.15em', textTransform: 'lowercase', opacity: 0.35, marginBottom: '0.5rem' }}>
          listening
        </p>
        <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, opacity: 0.7 }}>
          what i'm listening to
        </h2>
      </div>

      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
          <p style={{ opacity: 0.4, fontStyle: 'italic' }}>loading...</p>
        </div>
      )}

      {/* Bottom overlay */}
      {activeTrack && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: '0 1rem clamp(0.75rem, 2vw, 1.5rem)', background: 'linear-gradient(transparent, rgba(240, 234, 245, 0.92) 35%)', pointerEvents: 'none' }}>

          <div style={{ textAlign: 'center', marginBottom: 'clamp(0.35rem, 1vw, 0.75rem)', pointerEvents: 'auto', cursor: 'pointer' }} onClick={playActive}>
            <p style={{ fontSize: 'clamp(0.85rem, 3vw, 1.3rem)', fontWeight: 400, opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px', margin: '0 auto 0.2rem', padding: '0 0.5rem' }}>
              {activeTrack.title}
            </p>
            <p style={{ fontSize: 'clamp(0.7rem, 2vw, 0.9rem)', opacity: 0.5 }}>
              {activeTrack.artist} &middot; {formatDuration(activeTrack.duration)}
            </p>
          </div>

          {nowPlaying && (
            <div style={{ maxWidth: '500px', margin: '0 auto clamp(0.25rem, 1vw, 0.5rem)', pointerEvents: 'auto' }}>
              <iframe
                width="100%" height="80" scrolling="no" frameBorder="no" allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(nowPlaying)}&color=%23b8a8e0&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
                style={{ borderRadius: '8px', opacity: 0.9 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: 'clamp(0.25rem, 1vw, 0.5rem)', pointerEvents: 'auto' }}>
            <a href="https://soundcloud.com/hypermiami" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', opacity: 0.35, borderBottom: '1px solid rgba(0,0,0,0.15)', paddingBottom: '2px' }}>
              soundcloud
            </a>
            <Link to="/" style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', opacity: 0.35, borderBottom: '1px solid rgba(0,0,0,0.15)', paddingBottom: '2px' }}>
              back
            </Link>
          </div>
        </div>
      )}

    </motion.div>
  )
}
