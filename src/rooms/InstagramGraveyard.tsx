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

function MediaThumb({ item }: { item: MediaItem }) {
  return item.type === 'video' ? (
    <video
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
        filter: 'none',
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
        filter: 'none',
      }}
    />
  )
}

function PostCell({ post, onOpen, index }: { post: Post; onOpen: () => void; index: number }) {
  const thumb = post.media[0]
  const rand = useMemo(() => seededRandom(index * 4391 + 7), [index])
  const depth = useMemo(() => rand(), [rand]) // 0 = far, 1 = close
  const scale = useMemo(() => 0.6 + depth * 0.6, [depth]) // 0.6 to 1.2
  const nudgeX = useMemo(() => (rand() - 0.5) * 15, [rand])
  const nudgeY = useMemo(() => (rand() - 0.5) * 10, [rand])
  const rotation = useMemo(() => (rand() - 0.5) * 4, [rand])
  const blur = useMemo(() => Math.max(0, (1 - depth) * 1.5), [depth]) // far = blurry
  const brightness = useMemo(() => 0.7 + depth * 0.3, [depth]) // 0.7 to 1.0
  const zIndex = useMemo(() => 2 + Math.floor(depth * 20), [depth]) // 2 to 22

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
  const [scrollY, setScrollY] = useState(0)

  const allGhostsRef = useRef<Ghost[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const usedIndicesRef = useRef<Set<number>>(new Set())

  const sampleGhosts = (all: Ghost[], seed: number) => {
    const rand = seededRandom(seed)
    const available = all
      .map((g, i) => ({ ghost: g, idx: i }))
      .filter(({ idx }) => !usedIndicesRef.current.has(idx))

    // if we've used most, reset
    if (available.length < 150) {
      usedIndicesRef.current.clear()
      return sampleGhosts(all, seed + 1)
    }

    // shuffle available and take 150
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]]
    }

    const picked = available.slice(0, 150)
    picked.forEach(({ idx }) => usedIndicesRef.current.add(idx))
    return picked.map(({ ghost }) => ghost)
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

  // track scroll for parallax columns
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrollY(el.scrollTop)
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
        {/* sticky header with epitaph */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 4,
            background: 'rgba(10, 10, 10, 0.92)',
            backdropFilter: 'blur(12px)',
            padding: '1.2rem 1rem',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <Link
              to="/"
              style={{ fontSize: '0.85rem', opacity: 0.4, fontFamily: 'Georgia, serif', color: '#fff' }}
            >
              home
            </Link>
            <div style={{ width: '2rem' }} />
          </div>
          <p style={{
            fontSize: '1rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '0.8rem',
          }}>
            here doth lie
          </p>
          <p style={{
            fontSize: '2.5rem',
            fontStyle: 'italic',
            fontFamily: 'Georgia, serif',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.3rem',
          }}>
            @violetforest.js
          </p>
          <p style={{
            fontSize: '1.2rem',
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.25)',
            fontFamily: 'monospace',
          }}>
            2015 — 2026
          </p>
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

          {/* parallax columns */}
          {(() => {
            const posts: Post[] = (data as any).posts || []
            const cols: Post[][] = [[], [], []]
            posts.forEach((p, i) => cols[i % 3].push(p))
            const speeds = [0, -0.15, -0.3] // column speed offsets

            return (
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '0 8px 4rem',
                position: 'relative',
                zIndex: 2,
                alignItems: 'flex-start',
              }}>
                {cols.map((col, colIdx) => (
                  <div
                    key={colIdx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transform: `translateY(${scrollY * speeds[colIdx]}px)`,
                      willChange: 'transform',
                    }}
                  >
                    {col.map((post, i) => (
                      <PostCell key={post.folder + post.media[0]?.name} post={post} onOpen={() => setOpenPost(post)} index={colIdx * 100 + i} />
                    ))}
                  </div>
                ))}
              </div>
            )
          })()}

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
        {openPost && (
          <CarouselModal post={openPost} onClose={() => setOpenPost(null)} />
        )}
      </div>
    </RoomLayout>
  )
}
