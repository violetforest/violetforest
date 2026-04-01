import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { RoomLayout } from '../components/RoomLayout'
import { supabase } from '../lib/supabase'

interface MediaItem {
  name: string
  type: 'image' | 'video'
  url: string
}

interface GraveyardData {
  logins: any[]
  media: MediaItem[]
  stats: {
    totalLogins: number
    totalMedia: number
    totalImages: number
    totalVideos: number
    uniqueIPs: number
    uniqueUserAgents: number
  }
}

interface Ghost {
  text: string
  type: string
}

const base = import.meta.env.BASE_URL

const TYPE_COLORS: Record<string, string> = {
  ip: '#0ff',
  'user-agent': '#0ff',
  cookie: '#0ff',
  search: '#ff6b9d',
  advertiser: '#a78bfa',
  ad: '#a78bfa',
  contact: '#a78bfa',
  following: '#a78bfa',
  comment: '#fff',
  link: '#88cc88',
}

function seededRandom(seed: number) {
  let h = seed
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    h = h ^ (h >>> 16)
    return (h >>> 0) / 0xffffffff
  }
}

function GhostText({ ghost, index, total }: { ghost: Ghost; index: number; total: number }) {
  const rand = useMemo(() => seededRandom(index * 7919 + 13), [index])

  const cols = Math.ceil(Math.sqrt(total))
  const row = Math.floor(index / cols)
  const col = index % cols

  const baseX = (col / cols) * 100
  const baseY = (row / cols) * 100
  const startX = useMemo(() => (baseX + (rand() - 0.5) * 30 + 100) % 100, [baseX, rand])
  const startY = useMemo(() => (baseY + (rand() - 0.5) * 30 + 100) % 100, [baseY, rand])

  // depth: 0 = far away, 1 = very close
  const depth = useMemo(() => rand(), [rand])

  // depth affects everything
  const duration = useMemo(() => 50 - depth * 35, [depth]) // close = faster (15-50s)
  const delay = useMemo(() => rand() * -60, [rand])
  const driftX = useMemo(() => (rand() - 0.5) * (20 + depth * 30), [rand, depth])
  const driftY = useMemo(() => (rand() - 0.5) * (15 + depth * 20), [rand, depth])
  const animName = useMemo(() => `ghost-${index}`, [index])
  const rotation = useMemo(() => (rand() - 0.5) * 4, [rand])

  // close = bigger, brighter, sharper. far = smaller, dimmer, blurred
  const baseSize = ghost.type === 'comment' ? 1.1 : ghost.type === 'user-agent' || ghost.type === 'link' ? 0.75 : 0.9
  const size = baseSize * (0.4 + depth * 1.2) // 0.4x to 1.6x
  const peakOpacity = 0.15 + depth * 0.65 // 0.15 to 0.8
  const blur = Math.max(0, (1 - depth) * 2) // 0 to 2px
  const glowSize = 5 + depth * 20 // 5 to 25px

  const color = TYPE_COLORS[ghost.type] || '#fff'

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0% { opacity: 0; transform: translate(0, 0) rotate(${rotation}deg) scale(${0.95 + depth * 0.1}); }
          8% { opacity: ${peakOpacity}; }
          50% { opacity: ${peakOpacity * 0.5}; transform: translate(${driftX * 0.5}vw, ${driftY * 0.5}vh) rotate(${rotation * 0.5}deg) scale(1); }
          92% { opacity: ${peakOpacity}; }
          100% { opacity: 0; transform: translate(${driftX}vw, ${driftY}vh) rotate(0deg) scale(${1.05 - depth * 0.1}); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          left: `${startX}%`,
          top: `${startY}%`,
          fontSize: `${size}rem`,
          fontFamily: 'monospace',
          color,
          opacity: 0,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          maxWidth: '70vw',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          animation: `${animName} ${duration}s linear ${delay}s infinite`,
          textShadow: `0 0 ${glowSize}px ${color}`,
          filter: blur > 0.1 ? `blur(${blur}px)` : 'none',
        }}
      >
        {ghost.text}
      </div>
    </>
  )
}

interface Post {
  folder: string
  date: string
  media: MediaItem[]
}

const T = 0 // transparent
const G1 = 1, G2 = 2, G3 = 3, G4 = 4, B1 = 5, B2 = 6, B3 = 7
const TOMBSTONE_COLORS: Record<number, string> = {
  [G1]: '#a6a4a2', [G2]: '#999794', [G3]: '#8a8987', [G4]: '#6e6d6b',
  [B1]: '#8a511c', [B2]: '#7a481a', [B3]: '#5c3612', [W]: '#d4d0cc',
}
const W = 8 // white for skull
const TOMBSTONE_GRID = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,G1,G1,G1,G1,G1,G1,G1],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,G1,G1,G1,G1,G1,G1,G2,G2,G2],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,G1,G1,G4,G4,G4,G4,G4,G4,G4,G2,G2],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G1,G1,G4,G2,G2,G2,G2,G2,G4,G3,G2,G2],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G1,G4,G2,G2,W,W,W,G2,G2,G4,G2,G2],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G4,G2,G2,W,W,W,W,W,G2,G2,G4,G1],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G4,G2,G2,W,G4,W,G4,W,G2,G2,G4,G1],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G4,G2,G2,G2,W,G4,W,G2,G2,G2,G4,G1],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G4,G2,G2,W,G4,W,G4,W,G2,G2,G4,G1],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G4,G2,G2,G2,W,W,W,G2,G2,G2,G4,G1],
  [T,T,T,T,T,T,T,T,T,T,T,T,G1,G4,G2,G2,G2,G2,G2,G2,G2,G2,G2,G4,G1],
  [T,T,T,T,T,T,T,T,T,T,T,T,G3,G4,G2,G4,G4,G4,G4,G4,G4,G4,G2,G4,G3],
  [T,T,T,T,T,T,T,T,T,T,T,T,G3,G4,G3,G2,G2,G2,G2,G3,G3,G3,G3,G4,G3],
  [T,T,T,T,T,T,T,T,T,T,T,T,G3,G4,G3,G4,G4,G4,G4,G4,G4,G4,G3,G4,G3],
  [T,T,T,T,T,T,T,T,T,T,T,T,G3,B1,G3,G3,G3,G3,G3,G3,G3,G3,G3,G4,G3],
  [T,T,T,T,T,T,T,T,T,T,T,T,B1,B1,B1,G3,G3,G3,B2,G3,B2,B2,B2,B2,G3],
  [T,T,T,T,T,T,T,T,T,T,B1,B1,B1,B1,B1,B1,B1,B1,B2,B1,B2,B2,B2,B1,B2,B2,B1,B1],
  [T,T,T,T,T,T,T,B1,B1,B1,B2,B2,B2,B2,B2,B1,B2,B2,B3,B1,B2,B3,B3,B1,B1,B2,B2,B2,B1,B1],
  [T,T,T,T,T,T,B1,B3,B1,B2,B2,B2,B3,B3,B2,B2,B1,B2,B2,B1,B2,B3,B3,B3,B3,B1,B3,B1,B3,B3,B1],
  [T,T,T,T,T,B3,B1,B2,B3,B3,B1,B3,B3,B1,B2,B3,B2,B2,B3,B2,B1,B1,B1,B3,B3,B3,B3,B3,B2,B1,B3,B1],
  [T,T,T,T,B3,B3,B3,B3,B2,B1,B3,B3,B2,B1,B2,B3,B3,B3,B3,B1,B3,B3,B2,B2,B2,B3,B3,B2,B1,B3,B3,B3,B1],
  [T,T,B1,B1,B2,B2,B2,B1,B3,B2,B1,B1,B2,B2,B2,B3,B3,B2,B2,B1,B1,B2,B1,B3,B3,B3,B3,B1,B1,B3,B3,B3,B1],
  [B2,B2,B1,B1,B1,B1,B1,B1,B1,B1,B1,B1,B2,B1,B1,B1,B1,B1,B1,B1,B1,B2,B1,B1,B2,B2,B1,B1,B1,B3,B1,B1,B3,B1,B2],
]

function PixelTombstone() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rows = TOMBSTONE_GRID.length
    const maxCols = Math.max(...TOMBSTONE_GRID.map(r => r.length))
    canvas.width = maxCols
    canvas.height = rows

    for (let y = 0; y < rows; y++) {
      const row = TOMBSTONE_GRID[y]
      for (let x = 0; x < row.length; x++) {
        const val = row[x]
        if (val === T) continue
        ctx.fillStyle = TOMBSTONE_COLORS[val] || '#000'
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}

function MediaThumb({ item }: { item: MediaItem }) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* pixel art tombstone placeholder */}
      {!loaded && (
        <PixelTombstone />
      )}
      {inView && (item.type === 'video' ? (
        <video
          src={item.url}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      ) : (
        <img
          src={item.url}
          alt=""
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      ))}
    </div>
  )
}

function PostCell({ post, onOpen, index }: { post: Post; onOpen: () => void; index: number }) {
  const thumb = post.media[0]
  const rand = useMemo(() => seededRandom(index * 4391 + 7), [index])
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const depth = useMemo(() => rand(), [rand]) // 0 = far, 1 = close
  const scale = useMemo(() => isMobile ? 0.85 + depth * 0.2 : 0.6 + depth * 0.6, [depth, isMobile])
  const nudgeX = useMemo(() => isMobile ? (rand() - 0.5) * 5 : (rand() - 0.5) * 15, [rand, isMobile])
  const nudgeY = useMemo(() => isMobile ? (rand() - 0.5) * 3 : (rand() - 0.5) * 10, [rand, isMobile])
  const rotation = useMemo(() => isMobile ? (rand() - 0.5) * 2 : (rand() - 0.5) * 4, [rand, isMobile])
  const blur = useMemo(() => isMobile ? 0 : Math.max(0, (1 - depth) * 1.5), [depth, isMobile])
  const brightness = useMemo(() => 0.7 + depth * 0.3, [depth])
  const zIndex = useMemo(() => 2 + Math.floor(depth * 20), [depth])

  return (
    <div
      onClick={onOpen}
      style={{
        position: 'relative',
        overflow: 'visible',
        borderRadius: '40% 40% 4px 4px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#111',
        padding: '3px',
        cursor: 'pointer',
        transform: `scale(${scale}) translate(${nudgeX}px, ${nudgeY}px) rotate(${rotation}deg)`,
        transformOrigin: 'center top',
        filter: blur > 0.1 ? `blur(${blur}px) brightness(${brightness})` : `brightness(${brightness})`,
        zIndex,
        boxShadow: `0 ${4 + depth * 10}px ${10 + depth * 20}px rgba(0,0,0,${0.3 + depth * 0.3})`,
      }}
    >
      <div style={{
        borderRadius: '38% 38% 2px 2px',
        overflow: 'hidden',
        aspectRatio: '0.75',
      }}>
        <MediaThumb item={thumb} />
      </div>
      {/* carousel indicator */}
      {post.media.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'monospace',
        }}>
          {post.media.length}
        </div>
      )}
      {/* date */}
      <div style={{
        textAlign: 'center',
        padding: '4px 0 2px',
        fontSize: '0.5rem',
        fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.1em',
      }}>
        {post.date}
      </div>
    </div>
  )
}

function CarouselModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const item = post.media[index]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '80vh',
          position: 'relative',
        }}
      >
        {item.type === 'video' ? (
          <video
            src={item.url}
            autoPlay
            muted
            loop
            playsInline
            controls
            style={{
              maxWidth: '90vw',
              maxHeight: '75vh',
              display: 'block',
              filter: 'none',
            }}
          />
        ) : (
          <img
            src={item.url}
            alt=""
            style={{
              maxWidth: '90vw',
              maxHeight: '75vh',
              display: 'block',
              filter: 'none',
            }}
          />
        )}
      </div>

      {/* nav */}
      {post.media.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          marginTop: '1rem',
          alignItems: 'center',
        }}>
          <button
            onClick={e => { e.stopPropagation(); setIndex((index - 1 + post.media.length) % post.media.length) }}
            style={navBtnStyle}
          >
            prev
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {index + 1} / {post.media.length}
          </span>
          <button
            onClick={e => { e.stopPropagation(); setIndex((index + 1) % post.media.length) }}
            style={navBtnStyle}
          >
            next
          </button>
        </div>
      )}

      <p style={{
        color: 'rgba(255,255,255,0.2)',
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        marginTop: '0.75rem',
      }}>
        {post.date}
      </p>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  fontSize: '0.8rem',
  padding: '0.4rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
}

export function InstagramGraveyard() {
  const [data, setData] = useState<GraveyardData | null>(null)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [openPost, setOpenPost] = useState<Post | null>(null)
  const [roseCount, setRoseCount] = useState(0)
  const [leftRose, setLeftRose] = useState(false)
  const [scrolledPast, setScrolledPast] = useState(false)
  const [showCondolences, setShowCondolences] = useState(false)
  const [condolence, setCondolence] = useState('')


  const allGhostsRef = useRef<Ghost[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const usedIndicesRef = useRef<Set<number>>(new Set())

  const sampleGhosts = (all: Ghost[], seed: number) => {
    const rand = seededRandom(seed)
    const available = all
      .map((g, i) => ({ ghost: g, idx: i }))
      .filter(({ idx }) => !usedIndicesRef.current.has(idx))

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
    const count = isMobile ? 5 : 10

    // if we've used most, reset
    if (available.length < count) {
      usedIndicesRef.current.clear()
      return sampleGhosts(all, seed + 1)
    }

    // shuffle available and take count
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]]
    }

    const picked = available.slice(0, count)
    picked.forEach(({ idx }) => usedIndicesRef.current.add(idx))
    return picked.map(({ ghost }) => ghost)
  }

  useEffect(() => {
    supabase.from('graveyard_roses').select('count').single().then(({ data }) => {
      if (data) setRoseCount(data.count)
    })
    setLeftRose(localStorage.getItem('left-rose') === 'true')
  }, [])

  const leaveRose = () => {
    if (leftRose) return
    setShowCondolences(true)
  }

  const submitCondolence = async () => {
    setShowCondolences(false)
    setLeftRose(true)
    localStorage.setItem('left-rose', 'true')
    const newCount = roseCount + 1
    setRoseCount(newCount)
    await supabase.from('graveyard_roses').upsert({ id: 1, count: newCount })
    if (condolence.trim()) {
      await supabase.from('guestbook_entries').insert({
        name: null,
        message: `🥀 ${condolence.trim()}`,
      })
    }
    setCondolence('')
  }

  const cycleRef = useRef(0)

  useEffect(() => {
    fetch(`${base}graveyard/ig/data.json`).then(r => r.json()).then(setData)
    fetch(`${base}graveyard/ig/ghosts.json`).then(r => r.json()).then((all: Ghost[]) => {
      allGhostsRef.current = all
      setGhosts(sampleGhosts(all, 0))

      // cycle through new ghosts every 6 seconds
      const interval = setInterval(() => {
        cycleRef.current++
        setGhosts(sampleGhosts(allGhostsRef.current, cycleRef.current))
      }, 6000)
      return () => clearInterval(interval)
    })
  }, [])

  // resample ghosts on scroll checkpoints + track scroll position
  useEffect(() => {
    const el = scrollRef.current
    if (!el || allGhostsRef.current.length === 0) return

    let lastBucket = 0
    const onScroll = () => {
      setScrolledPast(el.scrollTop > 250)
      const bucket = Math.floor(el.scrollTop / 600)
      if (bucket !== lastBucket) {
        lastBucket = bucket
        setGhosts(sampleGhosts(allGhostsRef.current, bucket))
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [data])

  const bats = useMemo(() => {
    const r = seededRandom(777)
    return Array.from({ length: 8 }, () => ({
      startY: 5 + r() * 60,
      duration: 8 + r() * 12,
      delay: r() * -20,
      size: 25 + r() * 30,
      flap: 0.3 + r() * 0.3,
      wobble: r() * 20 - 10,
      direction: r() > 0.5 ? 1 : -1,
    }))
  }, [])

  if (!data) {
    return (
      <RoomLayout>
        <style>{`
          @keyframes digUp {
            0% { transform: translateY(20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes dots {
            0% { content: ''; }
            25% { content: '.'; }
            50% { content: '..'; }
            75% { content: '...'; }
          }
        `}</style>
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          zIndex: 1,
        }}>
          <div style={{
            fontSize: '3rem',
            animation: 'digUp 1s ease-out forwards, pulse 2s ease-in-out 1s infinite',
          }}>
            🪦
          </div>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '1rem',
            animation: 'digUp 1s ease-out 0.3s forwards',
            opacity: 0,
          }}>
            exhuming data
          </p>
          <div style={{
            display: 'flex',
            gap: '6px',
            animation: 'digUp 1s ease-out 0.6s forwards',
            opacity: 0,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </RoomLayout>
    )
  }

  return (
    <RoomLayout>
      <style>{`
        @keyframes batFlap {
          0%, 100% { transform: scaleY(1); }
          25% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
          75% { transform: scaleY(0.3); }
        }
        @keyframes fogDrift1 {
          0% { transform: translateX(-10%); opacity: 0.3; }
          50% { opacity: 0.5; }
          100% { transform: translateX(10%); opacity: 0.3; }
        }
        @keyframes fogDrift2 {
          0% { transform: translateX(10%); opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { transform: translateX(-10%); opacity: 0.2; }
        }
        @keyframes fogDrift3 {
          0% { transform: translateX(-5%) scaleX(1.1); opacity: 0.15; }
          50% { opacity: 0.35; }
          100% { transform: translateX(5%) scaleX(0.9); opacity: 0.15; }
        }
        ${bats.map((bat, i) => `
          @keyframes bat-${i} {
            0% { left: ${bat.direction > 0 ? '-5' : '105'}vw; top: ${bat.startY}%; }
            25% { top: ${bat.startY + bat.wobble * 0.5}%; }
            50% { top: ${bat.startY - bat.wobble * 0.3}%; }
            75% { top: ${bat.startY + bat.wobble * 0.4}%; }
            100% { left: ${bat.direction > 0 ? '105' : '-5'}vw; top: ${bat.startY}%; }
          }
        `).join('')}
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#0a0a0a',
        }}
      >
        {/* bats */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none', overflow: 'hidden' }}>
          {bats.map((bat, i) => (
            <div
              key={`bat-${i}`}
              style={{
                position: 'absolute',
                animation: `bat-${i} ${bat.duration}s linear ${bat.delay}s infinite`,
              }}
            >
              <div style={{
                fontSize: `${bat.size}px`,
                animation: `batFlap ${bat.flap}s ease-in-out infinite`,
                opacity: 1,
                filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
              }}>
                🦇
              </div>
            </div>
          ))}
        </div>
        {/* fog layers */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 38, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '5%',
            left: '-20%',
            width: '140%',
            height: '25%',
            background: 'radial-gradient(ellipse at center, rgba(180,180,200,0.25) 0%, transparent 70%)',
            animation: 'fogDrift1 25s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '-10%',
            width: '120%',
            height: '20%',
            background: 'radial-gradient(ellipse at center, rgba(150,150,180,0.2) 0%, transparent 70%)',
            animation: 'fogDrift2 35s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            top: '55%',
            left: '-15%',
            width: '130%',
            height: '30%',
            background: 'radial-gradient(ellipse at center, rgba(160,160,190,0.18) 0%, transparent 65%)',
            animation: 'fogDrift3 40s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            top: '75%',
            left: '-10%',
            width: '120%',
            height: '25%',
            background: 'radial-gradient(ellipse at center, rgba(140,140,170,0.22) 0%, transparent 70%)',
            animation: 'fogDrift1 30s ease-in-out infinite reverse',
          }} />
        </div>

        {/* compact sticky header — shows rose after scrolling past epitaph */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 35,
            background: '#000',
            padding: '0.6rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: scrolledPast ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <Link
            to="/"
            style={{ fontSize: '0.85rem', opacity: 0.4, fontFamily: 'Georgia, serif', color: '#fff' }}
          >
            home
          </Link>
          {scrolledPast && (
            <button
              onClick={leaveRose}
              disabled={leftRose}
              style={{
                background: 'none',
                border: 'none',
                cursor: leftRose ? 'default' : 'pointer',
                fontSize: '0.9rem',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.6)',
                opacity: leftRose ? 0.7 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {leftRose ? `🥀 ${roseCount}` : '🥀 leave a rose'}
            </button>
          )}
          <div style={{ width: '2rem' }} />
        </div>

        {/* scrollable area with grid + ghosts */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            position: 'relative',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* epitaph */}
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem 3rem',
            background: '#0a0a0a',
            position: 'relative',
            zIndex: 30,
          }}>
            <p style={{
              fontSize: '1rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.8rem',
            }}>
              here doth lie
            </p>
            <p style={{
              fontSize: '2.5rem',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '0.3rem',
            }}>
              @violetforest.js
            </p>
            <p style={{
              fontSize: '1.2rem',
              letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'monospace',
            }}>
              2015 — 2026
            </p>
            <button
              onClick={leaveRose}
              disabled={leftRose}
              style={{
                background: 'none',
                border: 'none',
                marginTop: '1.2rem',
                cursor: leftRose ? 'default' : 'pointer',
                fontSize: '1.1rem',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.6)',
                opacity: leftRose ? 0.7 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {leftRose ? `🥀 ${roseCount} roses left` : '🥀 leave a rose'}
            </button>
          </div>

          {/* ghosts behind tombstones */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '3rem',
              zIndex: 1,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {ghosts.slice(0, Math.floor(ghosts.length / 3)).map((ghost, i) => (
              <GhostText key={`behind-${ghost.type}-${i}`} ghost={ghost} index={i} total={ghosts.length} />
            ))}
          </div>

          {/* photo grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '0 8px 4rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {((data as any).posts || []).map((post: Post, i: number) => (
              <PostCell key={post.folder + post.media[0]?.name} post={post} onOpen={() => setOpenPost(post)} index={i} />
            ))}
          </div>

          {/* bottom rose count */}
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem 4rem',
            position: 'relative',
            zIndex: 2,
          }}>
            <p style={{
              fontSize: '2rem',
              color: 'rgba(255,255,255,0.15)',
              marginBottom: '0.5rem',
            }}>
              🥀
            </p>
            <p style={{
              fontSize: '1rem',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.25)',
            }}>
              {roseCount} {roseCount === 1 ? 'rose' : 'roses'} left
            </p>
          </div>

          {/* ghosts weaving between tombstones */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '3rem',
              zIndex: 12,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {ghosts.slice(Math.floor(ghosts.length / 3), Math.floor(ghosts.length * 2 / 3)).map((ghost, i) => (
              <GhostText key={`mid-${ghost.type}-${i}`} ghost={ghost} index={i + Math.floor(ghosts.length / 3)} total={ghosts.length} />
            ))}
          </div>

          {/* ghosts in front of everything */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '3rem',
              zIndex: 25,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {ghosts.slice(Math.floor(ghosts.length * 2 / 3)).map((ghost, i) => (
              <GhostText key={`front-${ghost.type}-${i}`} ghost={ghost} index={i + Math.floor(ghosts.length * 2 / 3)} total={ghosts.length} />
            ))}
          </div>
        </div>
        {/* condolences popup */}
        {showCondolences && (
          <div
            onClick={() => setShowCondolences(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
            }}
          >
            <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
              <p style={{
                fontSize: '1.4rem',
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '1.5rem',
              }}>
                express your condolences
              </p>
              <textarea
                placeholder="say something nice... (optional)"
                value={condolence}
                onChange={e => setCondolence(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: 'Georgia, serif',
                  outline: 'none',
                  minHeight: '80px',
                  resize: 'vertical',
                  marginBottom: '1rem',
                }}
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={submitCondolence}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  🥀 leave a rose
                </button>
                <button
                  onClick={() => setShowCondolences(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  nevermind
                </button>
              </div>
            </div>
          </div>
        )}

        {openPost && (
          <CarouselModal post={openPost} onClose={() => setOpenPost(null)} />
        )}
      </div>
    </RoomLayout>
  )
}
