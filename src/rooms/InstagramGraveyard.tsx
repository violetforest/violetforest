import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { RoomLayout } from '../components/RoomLayout'

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
  advertiser: '#ff4444',
  ad: '#ff4444',
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
  // spread ghosts evenly across the space, then add jitter
  const rand = useMemo(() => seededRandom(index * 7919 + 13), [index])

  const cols = Math.ceil(Math.sqrt(total))
  const row = Math.floor(index / cols)
  const col = index % cols

  const baseX = (col / cols) * 100
  const baseY = (row / cols) * 100
  const startX = useMemo(() => (baseX + (rand() - 0.5) * 30 + 100) % 100, [baseX, rand])
  const startY = useMemo(() => (baseY + (rand() - 0.5) * 30 + 100) % 100, [baseY, rand])

  const duration = useMemo(() => 20 + rand() * 40, [rand])
  const delay = useMemo(() => rand() * -60, [rand])

  // random drift direction per ghost
  const driftX = useMemo(() => (rand() - 0.5) * 40, [rand])
  const driftY = useMemo(() => (rand() - 0.5) * 30, [rand])
  const animName = useMemo(() => `ghost-${index}`, [index])

  const size = useMemo(() => {
    if (ghost.type === 'ip' || ghost.type === 'cookie') return 1
    if (ghost.type === 'user-agent' || ghost.type === 'link') return 0.75
    if (ghost.type === 'comment') return 1.1
    return 0.9
  }, [ghost.type])

  const color = TYPE_COLORS[ghost.type] || '#fff'

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0% { opacity: 0; transform: translate(0, 0); }
          8% { opacity: 0.7; }
          50% { opacity: 0.35; transform: translate(${driftX * 0.5}vw, ${driftY * 0.5}vh); }
          92% { opacity: 0.7; }
          100% { opacity: 0; transform: translate(${driftX}vw, ${driftY}vh); }
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
          textShadow: `0 0 10px ${color}`,
        }}
      >
        {ghost.text}
      </div>
    </>
  )
}

function ImageCell({ item }: { item: MediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '40% 40% 4px 4px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#111',
      padding: '3px',
    }}>
      <div style={{
        borderRadius: '38% 38% 2px 2px',
        overflow: 'hidden',
        aspectRatio: '0.75',
      }}>
        {item.type === 'video' ? (
          <video
            ref={videoRef}
            src={item.url}
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: 'grayscale(0.7) brightness(0.5) contrast(0.9)',
            }}
          />
        ) : (
          <img
            src={item.url}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: 'grayscale(0.7) brightness(0.5) contrast(0.9)',
            }}
          />
        )}
      </div>
    </div>
  )
}

export function InstagramGraveyard() {
  const [data, setData] = useState<GraveyardData | null>(null)
  const [ghosts, setGhosts] = useState<Ghost[]>([])

  const allGhostsRef = useRef<Ghost[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const sampleGhosts = (all: Ghost[], seed: number) => {
    const byType: Record<string, Ghost[]> = {}
    for (const g of all) {
      if (!byType[g.type]) byType[g.type] = []
      byType[g.type].push(g)
    }
    const sampled: Ghost[] = []
    const rand = seededRandom(seed)
    for (const type of Object.keys(byType)) {
      const items = byType[type]
      const count = Math.min(items.length, Math.max(10, Math.floor(150 * items.length / all.length)))
      for (let i = 0; i < count; i++) {
        sampled.push(items[Math.floor(rand() * items.length)])
      }
    }
    return sampled
  }

  useEffect(() => {
    fetch(`${base}graveyard/ig/data.json`).then(r => r.json()).then(setData)
    fetch(`${base}graveyard/ig/ghosts.json`).then(r => r.json()).then((all: Ghost[]) => {
      allGhostsRef.current = all
      setGhosts(sampleGhosts(all, 0))
    })
  }, [])

  // resample ghosts on scroll checkpoints
  useEffect(() => {
    const el = scrollRef.current
    if (!el || allGhostsRef.current.length === 0) return

    let lastBucket = 0
    const onScroll = () => {
      const bucket = Math.floor(el.scrollTop / 600)
      if (bucket !== lastBucket) {
        lastBucket = bucket
        setGhosts(sampleGhosts(allGhostsRef.current, bucket))
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [data])

  if (!data) {
    return (
      <RoomLayout>
        <p style={{ opacity: 0.45, fontStyle: 'italic' }}>loading...</p>
      </RoomLayout>
    )
  }

  return (
    <RoomLayout>
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
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.8rem 1rem',
            zIndex: 3,
            background: 'rgba(10, 10, 10, 0.9)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Link
            to="/"
            style={{ fontSize: '0.85rem', opacity: 0.4, fontFamily: 'Georgia, serif', color: '#fff' }}
          >
            home
          </Link>
          <p style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.3, color: '#fff' }}>
            instagram graveyard
          </p>
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
            padding: '3rem 1rem 2rem',
            color: 'rgba(255,255,255,0.25)',
            fontFamily: 'Georgia, serif',
          }}>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              rest in peace
            </p>
            <p style={{ fontSize: '1.4rem', fontStyle: 'italic', marginBottom: '0.3rem' }}>
              @violetforest.js
            </p>
            <p style={{ fontSize: '0.8rem', letterSpacing: '0.15em' }}>
              2015 — 2026
            </p>
          </div>

          {/* photo grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '0 8px 4rem',
            }}
          >
            {data.media.map(item => (
              <ImageCell key={item.name} item={item} />
            ))}
          </div>

          {/* ghost overlay */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '3rem',
              zIndex: 2,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {ghosts.map((ghost, i) => (
              <GhostText key={`${ghost.type}-${i}`} ghost={ghost} index={i} total={ghosts.length} />
            ))}
          </div>
        </div>
      </div>
    </RoomLayout>
  )
}
