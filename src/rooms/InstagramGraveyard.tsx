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

function GhostText({ ghost, index }: { ghost: Ghost; index: number }) {
  const rand = useMemo(() => seededRandom(index * 7919), [index])

  const startX = useMemo(() => rand() * 100, [rand])
  const startY = useMemo(() => rand() * 100, [rand])
  const duration = useMemo(() => 15 + rand() * 30, [rand])
  const delay = useMemo(() => rand() * -30, [rand])
  const size = useMemo(() => {
    if (ghost.type === 'ip' || ghost.type === 'cookie') return 1
    if (ghost.type === 'user-agent' || ghost.type === 'link') return 0.75
    if (ghost.type === 'comment') return 1.1
    return 0.9
  }, [ghost.type])

  const color = TYPE_COLORS[ghost.type] || '#fff'

  return (
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
        maxWidth: '60vw',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        animation: `ghostDrift ${duration}s linear ${delay}s infinite`,
        textShadow: `0 0 10px ${color}`,
      }}
    >
      {ghost.text}
    </div>
  )
}

function ImageCell({ item }: { item: MediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1' }}>
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
            filter: 'grayscale(0.5) brightness(0.7)',
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
            filter: 'grayscale(0.5) brightness(0.7)',
          }}
        />
      )}
    </div>
  )
}

export function InstagramGraveyard() {
  const [data, setData] = useState<GraveyardData | null>(null)
  const [ghosts, setGhosts] = useState<Ghost[]>([])

  useEffect(() => {
    fetch(`${base}graveyard/ig/data.json`).then(r => r.json()).then(setData)
    fetch(`${base}graveyard/ig/ghosts.json`).then(r => r.json()).then((all: Ghost[]) => {
      // Sample ~200 ghosts for performance, spread across types
      const byType: Record<string, Ghost[]> = {}
      for (const g of all) {
        if (!byType[g.type]) byType[g.type] = []
        byType[g.type].push(g)
      }
      const sampled: Ghost[] = []
      for (const type of Object.keys(byType)) {
        const items = byType[type]
        const count = Math.min(items.length, Math.max(10, Math.floor(200 * items.length / all.length)))
        for (let i = 0; i < count; i++) {
          sampled.push(items[Math.floor(Math.random() * items.length)])
        }
      }
      setGhosts(sampled)
    })
  }, [])

  if (!data) {
    return (
      <RoomLayout>
        <p style={{ opacity: 0.45, fontStyle: 'italic' }}>loading...</p>
      </RoomLayout>
    )
  }

  return (
    <RoomLayout>
      <style>{`
        @keyframes ghostDrift {
          0% { opacity: 0; transform: translate(0, 0); }
          5% { opacity: 0.7; }
          50% { opacity: 0.4; }
          95% { opacity: 0.7; }
          100% { opacity: 0; transform: translate(-20vw, -15vh); }
        }
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
          style={{
            flex: 1,
            position: 'relative',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* photo grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
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
              <GhostText key={`${ghost.type}-${i}`} ghost={ghost} index={i} />
            ))}
          </div>
        </div>
      </div>
    </RoomLayout>
  )
}
