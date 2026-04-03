import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
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
  showReflection: boolean
  showEnvMap: boolean
  showGlow: boolean
  dpr: number
}

const DEFAULT_CONFIG: Config = {
  depthSpacing: 6.0,
  xSpread: 0,
  ySpread: 0,
  parallax: 1.0,
  opacity: 1.0,
  roughness: 0,
  metalness: 1.0,
  clearcoat: 1.0,
  transmission: 0.01,
  envMapIntensity: 1.37,
  glowIntensity: 5.9,
  reflectionStrength: 1.0,
  reflectionBlur: 600,
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
    { key: 'depthSpacing', label: 'Depth Spacing', min: 0.5, max: 6, step: 0.1 },
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
    { key: 'dpr', label: 'Pixel Ratio', min: 0.5, max: 2, step: 0.1 },
  ]

  const toggles: { key: keyof Config; label: string }[] = [
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
  activeIndex,
  onClick,
  mousePos,
  loaded,
  config,
}: {
  track: Track
  index: number
  scrollOffset: React.MutableRefObject<number>
  activeIndex: number
  onClick: () => void
  mousePos: React.MutableRefObject<{ x: number; y: number }>
  loaded: boolean
  config: React.MutableRefObject<Config>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const entranceProgress = useRef(0)

  const rand = useMemo(() => ({
    xNorm: seededRandom(index * 3) - 0.5,
    yNorm: seededRandom(index * 7) - 0.5,
    startX: (seededRandom(index * 31) - 0.5) * 16,
    startY: (seededRandom(index * 37) - 0.5) * 10,
    startZ: -15 - seededRandom(index * 41) * 20,
    entranceDelay: index * 0.06,
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
      const delayedStart = Math.max(0, entranceProgress.current + delta * 1.8 - rand.entranceDelay * 1.8 * delta)
      entranceProgress.current = Math.min(1, delayedStart + delta * 1.8)
    }
    const t = entranceProgress.current
    const ease = 1 - Math.pow(1 - t, 3)

    const offset = scrollOffset.current
    const relIndex = index - offset

    const targetZ = -relIndex * c.depthSpacing
    const targetX = rand.xNorm * c.xSpread + relIndex * 0.35
    const targetY = rand.yNorm * c.ySpread + relIndex * 0.2

    const pStr = Math.max(0.05, c.parallax - Math.abs(relIndex) * 0.03)
    const mx = mousePos.current.x * pStr
    const my = mousePos.current.y * pStr

    const x = THREE.MathUtils.lerp(rand.startX, targetX + mx, ease)
    const y = THREE.MathUtils.lerp(rand.startY, targetY + my, ease)
    const z = THREE.MathUtils.lerp(rand.startZ, targetZ, ease)

    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, x, 0.07)
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, y, 0.07)
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, z, 0.07)

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.06)
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.06)
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.06)

    const isActive = index === activeIndex
    const targetScale = isActive ? 1.1 : 1
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.07))

    if (materialRef.current) {
      const distFromCenter = Math.abs(relIndex)
      const targetOpacity = Math.max(0.4, c.opacity - distFromCenter * 0.03) * ease
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.08)
      materialRef.current.roughness = c.roughness
      materialRef.current.metalness = c.metalness
      materialRef.current.clearcoat = c.clearcoat
      materialRef.current.transmission = c.transmission
      materialRef.current.envMapIntensity = c.envMapIntensity
    }
  })

  return (
    <mesh ref={meshRef} onClick={onClick}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshPhysicalMaterial
        ref={materialRef}
        map={texture}
        color={texture ? '#ffffff' : '#1a1520'}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        roughness={0}
        metalness={1}
        clearcoat={1}
        clearcoatRoughness={0.05}
        reflectivity={0.9}
        transmission={0.01}
        thickness={0.5}
        ior={1.5}
        envMapIntensity={1.37}
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

    const rx = (seededRandom(activeIndex * 3) - 0.5) * c.xSpread
    const ry = (seededRandom(activeIndex * 7) - 0.5) * c.ySpread

    lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, rx + relIndex * 0.35, 0.06)
    lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, ry + relIndex * 0.2, 0.06)
    lightRef.current.position.z = THREE.MathUtils.lerp(lightRef.current.position.z, -relIndex * c.depthSpacing + 2, 0.06)
    lightRef.current.intensity = c.glowIntensity
  })

  return <pointLight ref={lightRef} color="#e0d0f8" intensity={2.5} distance={8} decay={2} />
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, -5]}>
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

// ── Scene ────────────────────────────────────────────────────
function Scene({
  tracks, scrollOffset, activeIndex, onSelect, mousePos, loaded, config,
}: {
  tracks: Track[]
  scrollOffset: React.MutableRefObject<number>
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

      {tracks.map((track, i) => (
        <AlbumCover
          key={track.permalink_url}
          track={track}
          index={i}
          scrollOffset={scrollOffset}
          activeIndex={activeIndex}
          onClick={() => onSelect(i)}
          mousePos={mousePos}
          loaded={loaded}
          config={config}
        />
      ))}

      {c.showGlow && <ActiveGlow tracks={tracks} activeIndex={activeIndex} scrollOffset={scrollOffset} config={config} />}
      {c.showReflection && <ReflectionFloor config={config} />}
    </>
  )
}

// ── Main ─────────────────────────────────────────────────────
export function Listening() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
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
    const tick = () => { scrollOffset.current += (targetOffset.current - scrollOffset.current) * 0.06; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mousePos.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  const scheduleSnap = useCallback(() => {
    if (snapTimeout.current) clearTimeout(snapTimeout.current)
    snapTimeout.current = setTimeout(() => {
      const snapped = Math.round(targetOffset.current)
      targetOffset.current = Math.max(0, Math.min(tracks.length - 1, snapped))
      if (snapped >= 0 && snapped < tracks.length) setActiveIndex(snapped)
    }, 150)
  }, [tracks.length])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      targetOffset.current = Math.max(0, Math.min(tracks.length - 1, targetOffset.current + e.deltaY * 0.004))
      const newIndex = Math.round(targetOffset.current)
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tracks.length) setActiveIndex(newIndex)
      scheduleSnap()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [tracks.length, activeIndex, scheduleSnap])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let touchStartY = 0, touchStartOffset = 0
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; touchStartOffset = targetOffset.current }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      targetOffset.current = Math.max(0, Math.min(tracks.length - 1, touchStartOffset + (touchStartY - e.touches[0].clientY) * 0.01))
      const newIndex = Math.round(targetOffset.current)
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tracks.length) setActiveIndex(newIndex)
    }
    const onTouchEnd = () => scheduleSnap()
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchmove', onTouchMove); el.removeEventListener('touchend', onTouchEnd) }
  }, [tracks.length, activeIndex, scheduleSnap])

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
      {tracks.length > 0 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Canvas
            camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 6] }}
            dpr={[1, configState.dpr]}
            style={{ background: 'transparent' }}
            gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
          >
            <Scene tracks={tracks} scrollOffset={scrollOffset} activeIndex={activeIndex} onSelect={selectTrack} mousePos={mousePos} loaded={loaded} config={configRef} />
          </Canvas>
        </div>
      )}

      <SliderPanel config={configState} onChange={updateConfig} visible={panelVisible} onToggle={() => setPanelVisible((v) => !v)} />

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
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: '0 1rem 1.5rem', background: 'linear-gradient(transparent, rgba(240, 234, 245, 0.92) 35%)', pointerEvents: 'none' }}>

          <div style={{ textAlign: 'center', marginBottom: '0.75rem', pointerEvents: 'auto', cursor: 'pointer' }} onClick={playActive}>
            <p style={{ fontSize: 'clamp(1rem, 3vw, 1.3rem)', fontWeight: 400, opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px', margin: '0 auto 0.2rem' }}>
              {activeTrack.title}
            </p>
            <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', opacity: 0.5 }}>
              {activeTrack.artist} &middot; {formatDuration(activeTrack.duration)}
            </p>
          </div>

          {nowPlaying && (
            <div style={{ maxWidth: '500px', margin: '0 auto 0.5rem', pointerEvents: 'auto' }}>
              <iframe
                width="100%" height="80" scrolling="no" frameBorder="no" allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(nowPlaying)}&color=%23b8a8e0&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
                style={{ borderRadius: '8px', opacity: 0.9 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '0.5rem', pointerEvents: 'auto' }}>
            {tracks.slice(0, 20).map((_, i) => (
              <button key={i} onClick={() => selectTrack(i)} style={{
                width: i === activeIndex ? '18px' : '6px', height: '6px', borderRadius: '3px',
                background: i === activeIndex ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)',
                border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.6rem', pointerEvents: 'auto' }}>
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

      {tracks.length > 1 && !loading && (
        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2, opacity: 0.2, fontSize: '0.7rem', letterSpacing: '0.1em', writingMode: 'vertical-rl' as const, pointerEvents: 'none' }}>
          scroll to browse
        </div>
      )}
    </motion.div>
  )
}
