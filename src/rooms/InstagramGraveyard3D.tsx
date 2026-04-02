import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface MediaItem {
  name: string
  type: 'image' | 'video'
  url: string
}

interface GraveyardData {
  media: MediaItem[]
  posts: { folder: string; date: string; media: MediaItem[] }[]
  stats: any
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

export function InstagramGraveyard3D() {
  const [data, setData] = useState<GraveyardData | null>(null)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [entered, setEntered] = useState(false)
  const [roseCount, setRoseCount] = useState(0)
  const [leftRose, setLeftRose] = useState(false)
  const [showCondolences, setShowCondolences] = useState(false)
  const [condolence, setCondolence] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${base}graveyard/ig/data.json`).then(r => r.json()).then(setData)
    fetch(`${base}graveyard/ig/ghosts.json`).then(r => r.json()).then((all: Ghost[]) => {
      const shuffled = all.sort(() => Math.random() - 0.5)
      setGhosts(shuffled.slice(0, 40))
    })
    supabase.from('graveyard_roses').select('count').single().then(({ data }) => {
      if (data) setRoseCount(data.count)
    })
    setLeftRose(localStorage.getItem('left-rose') === 'true')
  }, [])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    if (max <= 0) return
    setScrollProgress(el.scrollTop / max)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !entered) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [entered, onScroll])

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

  if (!data) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
      }}>
        <style>{`
          @keyframes digUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0%,100% { opacity: 0.15; } 50% { opacity: 0.4; } }
        `}</style>
        <div style={{ fontSize: '3rem', animation: 'digUp 1s ease-out forwards' }}>🪦</div>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
          exhuming data
        </p>
      </div>
    )
  }

  const posts = data.posts || []
  const COLS = 2
  const ROWS = Math.ceil(posts.length / COLS)
  const CELL_DEPTH = 150
  const TOTAL_DEPTH = ROWS * CELL_DEPTH
  const currentZ = scrollProgress * TOTAL_DEPTH

  if (!entered) {
    return (
      <div
        onClick={() => setEntered(true)}
        style={{
          position: 'fixed', inset: 0, background: '#000', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '1rem', fontFamily: 'Georgia, serif', color: '#fff',
        }}
      >
        <style>{`
          @keyframes pulse { 0%,100% { opacity: 0.15; } 50% { opacity: 0.4; } }
        `}</style>
        <p style={{ fontSize: '0.8rem', letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.4 }}>
          here doth lie
        </p>
        <p style={{ fontSize: '2.5rem', fontStyle: 'italic', opacity: 0.8 }}>
          @violetforest.js
        </p>
        <p style={{ fontSize: '1rem', letterSpacing: '0.2em', opacity: 0.3, fontFamily: 'monospace' }}>
          2015 — 2026
        </p>
        <p style={{ fontSize: '0.8rem', opacity: 0.25, marginTop: '2rem', animation: 'pulse 2s ease-in-out infinite' }}>
          click to enter, scroll to walk
        </p>
        <Link to="/" style={{ fontSize: '0.8rem', opacity: 0.2, marginTop: '1rem', color: '#fff' }}>
          home
        </Link>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes ghostFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes batFlap3d {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
        }
        .graveyard-scroll::-webkit-scrollbar { width: 4px; }
        .graveyard-scroll::-webkit-scrollbar-track { background: #000; }
        .graveyard-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="graveyard-scroll"
        style={{
          position: 'fixed', inset: 0, background: '#000',
          overflowY: 'auto', overflowX: 'hidden',
          zIndex: 0,
        }}
      >
        {/* Tall spacer */}
        <div style={{ height: `${Math.max(3000, ROWS * 100)}vh`, pointerEvents: 'none' }} />
      </div>

      {/* 3D viewport */}
      <div style={{
        position: 'fixed', inset: 0,
        perspective: '400px',
        perspectiveOrigin: '50% 55%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        {/* Fog */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 60%, transparent 15%, rgba(0,0,0,0.5) 50%, #000 85%)',
        }} />

        {/* The level */}
        <div style={{
          position: 'absolute',
          width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: `translateZ(${currentZ}px)`,
        }}>
          {/* Ground */}
          <div style={{
            position: 'absolute',
            width: '3000px', height: `${TOTAL_DEPTH + 600}px`,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%) rotateX(90deg) translateZ(-100px)',
            background: `
              repeating-linear-gradient(0deg, transparent, transparent ${CELL_DEPTH - 2}px, rgba(30,60,30,0.15) ${CELL_DEPTH - 2}px, rgba(30,60,30,0.15) ${CELL_DEPTH}px),
              linear-gradient(180deg, #080e08 0%, #0a150a 50%, #060b06 100%)
            `,
          }} />

          {/* Tombstones */}
          {posts.map((post, i) => {
            const row = Math.floor(i / COLS)
            const col = i % COLS
            const side = col === 0 ? -1 : 1
            const z = -(row * CELL_DEPTH + 300)
            const x = side * (80 + (i % 7) * 8)
            const media = post.media[0]

            return (
              <div
                key={media.name}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '90px',
                  height: '120px',
                  transformStyle: 'preserve-3d',
                  transform: `translate(-50%, -50%) translate3d(${x}px, -20px, ${z}px)`,
                }}
              >
                {/* Stone back */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%',
                  borderRadius: '40% 40% 2px 2px',
                  background: 'linear-gradient(180deg, #3a3a3a, #2a2a2a)',
                  transform: 'rotateY(180deg) translateZ(4px)',
                  backfaceVisibility: 'hidden',
                }} />

                {/* Left side */}
                <div style={{
                  position: 'absolute',
                  width: '8px', height: '100%',
                  background: '#2a2a2a',
                  left: '-4px', top: 0,
                  transform: 'rotateY(-90deg) translateZ(4px)',
                  transformOrigin: 'right',
                }} />

                {/* Right side */}
                <div style={{
                  position: 'absolute',
                  width: '8px', height: '100%',
                  background: '#2a2a2a',
                  right: '-4px', top: 0,
                  transform: 'rotateY(90deg) translateZ(4px)',
                  transformOrigin: 'left',
                }} />

                {/* Front face with photo */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%',
                  borderRadius: '40% 40% 2px 2px',
                  overflow: 'hidden',
                  border: '3px solid #444',
                  background: '#111',
                  transform: 'translateZ(4px)',
                  backfaceVisibility: 'hidden',
                }}>
                  {media.type === 'video' ? (
                    <video
                      src={media.url}
                      autoPlay muted loop playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>

                {/* Date */}
                <div style={{
                  position: 'absolute',
                  bottom: '-18px', left: '50%',
                  transform: 'translateX(-50%) translateZ(5px)',
                  fontSize: '7px', fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap',
                }}>
                  {post.date}
                </div>
              </div>
            )
          })}

          {/* Ghost text */}
          {ghosts.map((ghost, i) => {
            const z = -(i / ghosts.length) * TOTAL_DEPTH - 200
            const x = (Math.sin(i * 2.7) * 0.5) * 350
            const y = -15 - (Math.cos(i * 1.3) * 0.5 + 0.5) * 50
            const color = TYPE_COLORS[ghost.type] || '#fff'
            const duration = 3 + (i % 5) * 0.8
            return (
              <div
                key={`ghost-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`,
                  fontSize: '9px', fontFamily: 'monospace',
                  color, opacity: 0.5,
                  whiteSpace: 'nowrap', maxWidth: '200px',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  textShadow: `0 0 10px ${color}`,
                  animation: `ghostFloat ${duration}s ease-in-out ${-(i * 0.7)}s infinite`,
                  pointerEvents: 'none',
                }}
              >
                {ghost.text}
              </div>
            )
          })}

          {/* Bats */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`bat-${i}`}
              style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: `translate(-50%, -50%) translate3d(${Math.sin(i * 1.9) * 200}px, ${-50 - i * 10}px, ${-i * (TOTAL_DEPTH / 6) - 300}px)`,
                fontSize: '24px',
                animation: `batFlap3d ${0.3 + (i % 3) * 0.1}s ease-in-out infinite`,
                pointerEvents: 'none',
              }}
            >
              🦇
            </div>
          ))}
        </div>
      </div>

      {/* HUD */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 20, pointerEvents: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '1rem',
      }}>
        <Link to="/" style={{
          fontSize: '0.85rem', opacity: 0.4, fontFamily: 'Georgia, serif',
          color: '#fff', pointerEvents: 'auto',
        }}>
          home
        </Link>
        <button
          onClick={leaveRose}
          disabled={leftRose}
          style={{
            background: 'none', border: 'none', pointerEvents: 'auto',
            cursor: leftRose ? 'default' : 'pointer',
            fontSize: '0.9rem', fontFamily: 'Georgia, serif', fontStyle: 'italic',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {leftRose ? `🥀 ${roseCount}` : '🥀 leave a rose'}
        </button>
      </div>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 20, textAlign: 'center', padding: '0.8rem', pointerEvents: 'none',
      }}>
        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)', fontFamily: 'Georgia, serif',
        }}>
          here doth lie · @violetforest.js · 2015–2026
        </p>
      </div>

      {/* Condolences modal */}
      {showCondolences && (
        <div
          onClick={() => setShowCondolences(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <p style={{
              fontSize: '1.4rem', fontStyle: 'italic', fontFamily: 'Georgia, serif',
              color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem',
            }}>
              express your condolences
            </p>
            <textarea
              placeholder="say something nice... (optional)"
              value={condolence}
              onChange={e => setCondolence(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)', color: '#fff',
                fontSize: '1rem', fontFamily: 'Georgia, serif', outline: 'none',
                minHeight: '80px', resize: 'vertical', marginBottom: '1rem',
              }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={submitCondolence}
                style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.7)', fontFamily: 'Georgia, serif',
                  fontStyle: 'italic', fontSize: '1rem', padding: '0.6rem 1.5rem',
                  borderRadius: '4px', cursor: 'pointer',
                }}
              >
                🥀 leave a rose
              </button>
              <button
                onClick={() => setShowCondolences(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)', fontFamily: 'Georgia, serif',
                  fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                nevermind
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
