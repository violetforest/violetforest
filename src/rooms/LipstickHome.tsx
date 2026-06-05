import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useSpaceStore } from '../store'
import { DoorSection } from '../components/DoorSection'

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

type XYZ = { x: number; y: number; z: number }

const POSITION_RANGES = {
  x: { min: -800, max: 800, step: 1 },
  y: { min: -400, max: 400, step: 1 },
  z: { min: -800, max: 800, step: 1 },
}

const CAMERA_DEFAULTS_DESKTOP: XYZ = { x: 660, y: 100, z: 0 }
const CAMERA_DEFAULTS_MOBILE: XYZ = { x: 350, y: 100, z: 0 }
const CAMERA_DEFAULTS: XYZ =
  typeof window !== 'undefined' && window.innerWidth < 768
    ? CAMERA_DEFAULTS_MOBILE
    : CAMERA_DEFAULTS_DESKTOP
const PURPLE_LIGHT_DEFAULTS: XYZ = { x: 175, y: 120, z: 0 }

type PropId =
  | 'lipstick1'
  | 'clutch1'
  | 'plant1' | 'plant3'
  | 'rose1' | 'rose2'
  | 'cellphone1'

const PROP_X_DEFAULTS: Record<PropId, number> = {
  lipstick1: 0,
  clutch1: 0,
  plant1: 346,     plant3: -251,
  rose1: -340,     rose2: 489,
  cellphone1: 0,
}
const PROP_IDS = Object.keys(PROP_X_DEFAULTS) as PropId[]

// z spreads the props across the hallway width (walls at z=±100).
// Plants stay at z=-300 (behind the back wall, as the user placed them).
const PROP_Z_DEFAULTS: Record<PropId, number> = {
  lipstick1: -40,
  clutch1: -20,
  plant1: -300,    plant3: -300,
  rose1: 0,        rose2: 20,
  cellphone1: 40,
}

function AxisSlider({
  axis, value, onChange,
}: { axis: 'x' | 'y' | 'z'; value: number; onChange: (v: number) => void }) {
  const range = POSITION_RANGES[axis]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
      <label style={{ width: '1.2rem', opacity: 0.7 }}>{axis}</label>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ flex: 1, accentColor: '#ff79c0', cursor: 'pointer' }}
      />
      <span style={{ width: '3rem', textAlign: 'right', opacity: 0.85 }}>{value}</span>
    </div>
  )
}

function PropXSlider({
  label, value, onChange, min = -800, max = 800,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
      <label style={{ width: '5rem', opacity: 0.7, fontSize: 10 }}>{label}</label>
      <input
        type="range"
        min={min} max={max} step={1}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ flex: 1, accentColor: '#ff79c0', cursor: 'pointer' }}
      />
      <span style={{ width: '3rem', textAlign: 'right', opacity: 0.85 }}>{value}</span>
    </div>
  )
}

function XYZGroup({
  label, value, defaults, onChange,
}: { label: string; value: XYZ; defaults: XYZ; onChange: (v: XYZ) => void }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, opacity: 0.85 }}>
        <strong>{label}</strong>
        <button
          onClick={() => onChange(defaults)}
          style={{
            padding: '2px 6px', fontSize: 9, fontFamily: 'monospace',
            background: 'transparent', color: '#f0eaf5', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 3, cursor: 'pointer',
          }}
        >
          reset
        </button>
      </div>
      {(['x', 'y', 'z'] as const).map((axis) => (
        <AxisSlider key={axis} axis={axis} value={value[axis]} onChange={(v) => onChange({ ...value, [axis]: v })} />
      ))}
    </div>
  )
}

function LipstickTunnel({ scrollProgress }: { scrollProgress: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const [camera, setCamera] = useState<XYZ>(CAMERA_DEFAULTS)
  const [purpleLight, setPurpleLight] = useState<XYZ>(PURPLE_LIGHT_DEFAULTS)
  const [propX, setPropX] = useState<Record<PropId, number>>(PROP_X_DEFAULTS)
  const [propZ, setPropZ] = useState<Record<PropId, number>>(PROP_Z_DEFAULTS)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'home-ready') readyRef.current = true
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    const post = () => {
      const w = iframeRef.current?.contentWindow
      if (!w) return
      w.postMessage({ type: 'home-progress', value: scrollProgress }, '*')
    }
    post()
    // also retry shortly in case the iframe loads after first scroll
    const id = setTimeout(post, 200)
    return () => clearTimeout(id)
  }, [scrollProgress])

  // Skip the very first run so the iframe keeps its own baked-in prop
  // positions on load (e.g. plant1 at x=-150). Posting our defaults during
  // mount would teleport the props mid-init — combined with the dolly lerp
  // it reads as a ping-pong. Only forward changes once the user touches
  // the sliders.
  const camConfigPostedRef = useRef(false)
  useEffect(() => {
    if (!camConfigPostedRef.current) {
      camConfigPostedRef.current = true
      return
    }
    const post = () => {
      const w = iframeRef.current?.contentWindow
      if (!w) return
      w.postMessage({ type: 'home-camera', ...camera }, '*')
      w.postMessage({ type: 'home-light', id: 'purple2', ...purpleLight }, '*')
      PROP_IDS.forEach((id) => {
        w.postMessage({ type: 'home-prop', id, x: propX[id], z: propZ[id] }, '*')
      })
    }
    post()
    const id = setTimeout(post, 200)
    return () => clearTimeout(id)
  }, [camera, purpleLight, propX, propZ])

  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', zIndex: 2, background: '#000' }}>
      <iframe
        ref={iframeRef}
        src={`${import.meta.env.BASE_URL}home/index.html`}
        title="home"
        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
      />
      <style>{`
        @keyframes scrollHint {
          0%, 100% { transform: translateY(0); opacity: 0.25; }
          50% { transform: translateY(6px); opacity: 0.45; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 3,
          background: 'rgba(0,0,0,0.7)', color: '#f0eaf5', padding: '10px 12px',
          borderRadius: 6, fontFamily: 'monospace', fontSize: 11,
          width: panelOpen ? 260 : 'auto',
          maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto',
          display: 'none',
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}
          onClick={() => setPanelOpen((o) => !o)}
        >
          <strong>controls</strong>
          <span style={{ opacity: 0.6 }}>{panelOpen ? '×' : '⇅'}</span>
        </div>
        {panelOpen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={() => {
                  const payload = { camera, purpleLight, propX, propZ }
                  navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {})
                }}
                style={{
                  width: '100%', padding: '4px 8px', fontSize: 10, fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.08)', color: '#f0eaf5',
                  border: '1px solid rgba(255,255,255,0.25)', borderRadius: 3, cursor: 'pointer',
                }}
              >
                copy json
              </button>
            </div>
            <XYZGroup label="camera" value={camera} defaults={CAMERA_DEFAULTS} onChange={setCamera} />
            <XYZGroup label="purple light" value={purpleLight} defaults={PURPLE_LIGHT_DEFAULTS} onChange={setPurpleLight} />
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, opacity: 0.85 }}>
                <strong>props (x)</strong>
                <button
                  onClick={() => { setPropX(PROP_X_DEFAULTS); setPropZ(PROP_Z_DEFAULTS) }}
                  style={{
                    padding: '2px 6px', fontSize: 9, fontFamily: 'monospace',
                    background: 'transparent', color: '#f0eaf5', border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 3, cursor: 'pointer',
                  }}
                >
                  reset
                </button>
              </div>
              {PROP_IDS.map((id) => [
                <PropXSlider
                  key={`${id}-x`}
                  label={id}
                  value={propX[id]}
                  onChange={(v) => setPropX((s) => ({ ...s, [id]: v }))}
                />,
                <PropXSlider
                  key={`${id}-z`}
                  label={`${id} z`}
                  value={propZ[id]}
                  onChange={(v) => setPropZ((s) => ({ ...s, [id]: v }))}
                />,
              ])}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', opacity: Math.max(0, 0.5 - scrollProgress * 2),
          fontSize: '3rem', color: '#f0eaf5', animation: 'scrollHint 2s ease-in-out infinite',
        }}
      >
        ↓
      </div>
    </div>
  )
}

export function LipstickHome() {
  useSpaceStore()

  const [hallwayProgress, setHallwayProgress] = useState(0)
  const [feedMounted, setFeedMounted] = useState(false)
  const [listeningMounted, setListeningMounted] = useState(false)
  const feedMountedRef = useRef(false)
  const listeningMountedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hallwayHeight = window.innerHeight * 3
    const scrollTop = el.scrollTop
    const progress = Math.max(0, Math.min(1, scrollTop / (hallwayHeight - window.innerHeight)))
    setHallwayProgress(progress)

    // Lazy-mount the Instagram iframe once the user is within ~1 viewport
    // of it, so it doesn't load (or run its nested React app + Supabase
    // requests) on page load.
    if (!feedMountedRef.current && scrollTop > window.innerHeight * 1.8) {
      feedMountedRef.current = true
      setFeedMounted(true)
    }

    // Lazy-mount the listening iframe once the user is approaching it
    // (past the hallway + feed) so its 3D canvas + audio + Supabase
    // request don't run on page load.
    if (!listeningMountedRef.current && scrollTop > window.innerHeight * 3.2) {
      listeningMountedRef.current = true
      setListeningMounted(true)
    }
  }, [])

  return (
    <motion.div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ position: 'fixed', inset: 0, zIndex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div style={{ height: '300vh', position: 'relative' }}>
        <LipstickTunnel scrollProgress={hallwayProgress} />
      </div>

      <div
        className="lipstick-feed"
        style={{
          backgroundColor: '#000',
          backgroundImage: `url(${import.meta.env.BASE_URL}home/stars.webp)`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          color: 'rgb(136, 68, 255)',
          fontFamily: 'monospace',
        }}
      >
        <style>{`
          .lipstick-feed, .lipstick-feed * {
            color: rgb(136, 68, 255) !important;
            font-family: monospace !important;
            font-size: 14px !important;
            opacity: 1 !important;
          }
        `}</style>
        <DoorSection light showThreshold={false}>
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              height: 'min(720px, 85vh)',
              border: '1px solid rgb(136, 68, 255)',
              boxShadow: '0 0 24px rgba(136, 68, 255, 0.55)',
              background: '#000',
              overflow: 'hidden',
            }}
          >
            {feedMounted ? (
              <iframe
                src={`${import.meta.env.BASE_URL}instagram`}
                title="instagram"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: '100%', height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'rgb(136, 68, 255)', fontSize: 12, opacity: 0.55,
                }}
              >
                loading…
              </div>
            )}
          </div>
        </DoorSection>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '0 0 2rem',
            fontSize: '3rem',
            color: 'rgb(136, 68, 255)',
            opacity: 0.55,
            animation: 'scrollHint 2s ease-in-out infinite',
          }}
        >
          ↓
        </div>
      </div>

      {/* Sticky listening section — mirrors the hallway pattern at top:
          300vh scroll space with a 100dvh sticky iframe of /listening.
          dvh (dynamic viewport height) accounts for the mobile browser
          toolbar so the SoundCloud player at the bottom of the
          listening page isn't clipped behind it. Lazy-mounted via
          handleScroll. */}
      <div style={{ height: '300vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', zIndex: 2, background: '#000' }}>
          {listeningMounted ? (
            <iframe
              src={`${import.meta.env.BASE_URL}listening`}
              title="listening"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#f0eaf5', opacity: 0.45, fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              loading…
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
