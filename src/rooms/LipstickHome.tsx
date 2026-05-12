import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useSpaceStore } from '../store'
import { DoorSection } from '../components/DoorSection'

interface Post {
  id: string
  type: string
  body: string | null
  image_url: string | null
  link_url: string | null
  created_at: string
}

interface GuestbookEntry {
  id: string
  name: string | null
  message: string
  created_at: string
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

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

const doorLinkStyle: React.CSSProperties = {
  fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)',
  opacity: 0.55,
  borderBottom: '1px solid rgba(255,255,255,0.2)',
  paddingBottom: '2px',
  marginTop: '2rem',
  color: 'inherit',
}

type XYZ = { x: number; y: number; z: number }

const POSITION_RANGES = {
  x: { min: -800, max: 800, step: 1 },
  y: { min: -400, max: 400, step: 1 },
  z: { min: -800, max: 800, step: 1 },
}

const CAMERA_DEFAULTS: XYZ = { x: 660, y: 100, z: 0 }
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

  useEffect(() => {
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
          fontSize: '1.5rem', color: '#f0eaf5', animation: 'scrollHint 2s ease-in-out infinite',
        }}
      >
        ↓
      </div>
    </div>
  )
}

export function LipstickHome() {
  useSpaceStore()

  const navigate = useNavigate()
  const [latestPost, setLatestPost] = useState<Post | null>(null)
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([])
  const [hallwayProgress, setHallwayProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const exitedRef = useRef(false)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hallwayHeight = window.innerHeight * 3
    const scrollTop = el.scrollTop
    const progress = Math.max(0, Math.min(1, scrollTop / (hallwayHeight - window.innerHeight)))
    setHallwayProgress(progress)

    // End of scroll → fade and slide into /listening.
    if (!exitedRef.current) {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      if (distFromBottom < 4) {
        exitedRef.current = true
        setExiting(true)
        setTimeout(() => navigate('/listening'), 900)
      }
    }
  }, [navigate])

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setLatestPost(data[0])
      })

    supabase
      .from('guestbook_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setGuestbookEntries(data || [])
      })
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
      <AnimatePresence>
        {exiting && (
          <motion.div
            key="exit-fade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50, background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 4, opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, ease: 'easeIn' }}
              style={{
                color: 'rgb(136, 68, 255)', fontFamily: 'monospace', fontSize: 14,
                letterSpacing: '0.3em', textTransform: 'lowercase',
              }}
            >
              listening
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ height: '300vh', position: 'relative' }}>
        <LipstickTunnel scrollProgress={hallwayProgress} />
      </div>

      <div
        className="lipstick-feed"
        style={{
          background: `#000 url(${import.meta.env.BASE_URL}home/stars.webp) repeat`,
          backgroundSize: '10%',
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
        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>now</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>what's happening right now</h2>
          <Link to="/stories" style={doorLinkStyle}>see what's up</Link>
        </DoorSection>

        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>listening</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, marginBottom: '0.5rem' }}>this room changes with what's playing</h2>
          <p style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', opacity: 0.55, lineHeight: 1.6 }}>
            put a song, a podcast, a sound here.
            <br />
            the background shifts to match.
          </p>
          <Link to="/listening" style={doorLinkStyle}>walk through</Link>
        </DoorSection>

        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>what i'm thinking about</p>
          {latestPost ? (
            <div style={{ width: '100%', textAlign: 'left' }}>
              {latestPost.type === 'text' && latestPost.body && (
                <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', lineHeight: 1.6, opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                  {latestPost.body.length > 200 ? latestPost.body.slice(0, 200) + '...' : latestPost.body}
                </p>
              )}
              {latestPost.type === 'quote' && latestPost.body && (
                <blockquote style={{ borderLeft: '2px solid rgba(255,255,255,0.25)', paddingLeft: '1rem', fontStyle: 'italic', fontSize: 'clamp(1.3rem, 3.5vw, 1.65rem)', lineHeight: 1.5, opacity: 0.9 }}>
                  {latestPost.body}
                </blockquote>
              )}
              {latestPost.type === 'photo' && latestPost.image_url && (
                <img src={latestPost.image_url} alt="" style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
              )}
              {latestPost.type === 'link' && (
                <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', opacity: 0.7, wordBreak: 'break-all' }}>{latestPost.link_url}</p>
              )}
              {(latestPost.type === 'photo' || latestPost.type === 'link') && latestPost.body && (
                <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', opacity: 0.7, marginTop: '0.5rem' }}>{latestPost.body}</p>
              )}
              <p style={{ fontSize: '0.9rem', opacity: 0.5, marginTop: '0.75rem' }}>{timeAgo(latestPost.created_at)}</p>
            </div>
          ) : (
            <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>a quiet room for loose thoughts</h2>
          )}
          <Link to="/feed" style={doorLinkStyle}>see more</Link>
        </DoorSection>

        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>what i'm making</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>sketches and experiments</h2>
          <Link to="/making" style={doorLinkStyle}>walk through</Link>
        </DoorSection>

        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>guestbook</p>
          {guestbookEntries.length > 0 ? (
            <div style={{ width: '100%', textAlign: 'left' }}>
              {guestbookEntries.map(entry => (
                <div key={entry.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', lineHeight: 1.5, opacity: 0.9 }}>
                    {entry.message.length > 100 ? entry.message.slice(0, 100) + '...' : entry.message}
                  </p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.55, marginTop: '0.25rem' }}>— {entry.name || 'someone'}</p>
                </div>
              ))}
            </div>
          ) : (
            <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>leave a mark</h2>
          )}
          <Link to="/guestbook" style={doorLinkStyle}>sign the guestbook</Link>
        </DoorSection>

        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>ask me anything</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>questions welcome</h2>
          <Link to="/ask" style={doorLinkStyle}>ask something</Link>
        </DoorSection>

        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>message me</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>say something privately</h2>
          <Link to="/dm" style={doorLinkStyle}>send a message</Link>
        </DoorSection>

        <DoorSection light>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>links</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>things i recommend</h2>
          <Link to="/links" style={doorLinkStyle}>browse</Link>
        </DoorSection>

        <DoorSection light showThreshold={false}>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.5, marginBottom: '1rem' }}>instagram graveyard</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>archived from another life</h2>
          <Link to="/graveyard/instagram" style={doorLinkStyle}>walk through</Link>
        </DoorSection>
      </div>
    </motion.div>
  )
}
