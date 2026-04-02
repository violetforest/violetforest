import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    fetch(`${base}graveyard/ig/data.json`).then(r => r.json()).then(setData)
    fetch(`${base}graveyard/ig/ghosts.json`).then(r => r.json()).then((all: Ghost[]) => {
      // sample ~40 ghosts for the 3D scene
      const shuffled = all.sort(() => Math.random() - 0.5)
      setGhosts(shuffled.slice(0, 40))
    })
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

  if (!data) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
      }}>
        <div style={{ fontSize: '3rem', animation: 'digUp 1s ease-out forwards' }}>🪦</div>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
          exhuming data
        </p>
      </div>
    )
  }

  const posts = data.posts || []
  const COLS = 2 // tombstones per row (1 left, 1 right)
  const ROWS = Math.ceil(posts.length / COLS)
  const CELL_DEPTH = 120 // px depth per row
  const TOTAL_DEPTH = ROWS * CELL_DEPTH

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
          scroll to enter
        </p>
        <Link to="/" style={{ fontSize: '0.8rem', opacity: 0.2, marginTop: '1rem', color: '#fff' }}>
          home
        </Link>
        <style>{`
          @keyframes pulse { 0%,100% { opacity: 0.15; } 50% { opacity: 0.4; } }
          @keyframes digUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes walkForward {
          0% { transform: translateZ(0px); }
          100% { transform: translateZ(${TOTAL_DEPTH}px); }
        }
        @keyframes ghostFloat {
          0%, 100% { opacity: 0.5; transform: translateY(0); }
          50% { opacity: 0.2; transform: translateY(-10px); }
        }
        @keyframes batFlyAcross {
          0% { left: -10%; } 100% { left: 110%; }
        }
        @keyframes batFlap3d {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
        }
        .graveyard-scroll::-webkit-scrollbar { width: 4px; }
        .graveyard-scroll::-webkit-scrollbar-track { background: #000; }
        .graveyard-scroll::-webkit-scrollbar-thumb { background: #333; }
      `}</style>

      {/* Scrollable body */}
      <div
        className="graveyard-scroll"
        style={{
          position: 'fixed', inset: 0, background: '#000',
          overflowY: 'auto', overflowX: 'hidden',
        }}
      >
        {/* Tall spacer for scroll */}
        <div style={{ height: `${Math.max(2000, ROWS * 80)}vh`, pointerEvents: 'none' }} />
      </div>

      {/* 3D viewport */}
      <div style={{
        position: 'fixed', inset: 0,
        perspective: '500px',
        perspectiveOrigin: '50% 55%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        {/* Fog overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 60%, transparent 20%, rgba(0,0,0,0.6) 60%, #000 90%)',
        }} />

        {/* The level — moves forward on scroll */}
        <div style={{
          position: 'absolute',
          width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          animation: 'walkForward linear',
          animationTimeline: 'scroll()' as any,
          animationRange: 'entry 0% cover 100%' as any,
        }}>
          {/* Ground plane */}
          <div style={{
            position: 'absolute',
            width: '2000px', height: `${TOTAL_DEPTH + 500}px`,
            left: '50%', top: '50%',
            transform: `translate(-50%, -50%) rotateX(90deg) translateZ(-80px)`,
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 118px, rgba(30,50,30,0.3) 118px, rgba(30,50,30,0.3) 120px),
              repeating-linear-gradient(90deg, transparent, transparent 98px, rgba(30,50,30,0.2) 98px, rgba(30,50,30,0.2) 100px),
              linear-gradient(180deg, #0a120a 0%, #0d1a0d 50%, #0a0f0a 100%)
            `,
            transformStyle: 'preserve-3d',
          }} />

          {/* Tombstones */}
          {posts.map((post, i) => {
            const row = Math.floor(i / COLS)
            const col = i % COLS
            const side = col === 0 ? -1 : 1
            const z = -(row * CELL_DEPTH + 200)
            const x = side * 120
            const media = post.media[0]

            return (
              <div
                key={media.name}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '80px',
                  height: '100px',
                  transformStyle: 'preserve-3d',
                  transform: `translate(-50%, -50%) translate3d(${x}px, -10px, ${z}px)`,
                }}
              >
                {/* Stone back */}
                <div style={{
                  position: 'absolute',
                  width: '100%', height: '100%',
                  borderRadius: '40% 40% 4px 4px',
                  background: '#3a3a3a',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(3px)',
                }} />

                {/* Stone front with photo */}
                <div style={{
                  position: 'absolute',
                  width: '100%', height: '100%',
                  borderRadius: '40% 40% 4px 4px',
                  overflow: 'hidden',
                  border: '2px solid #555',
                  background: '#222',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(3px)',
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

                {/* Date label */}
                <div style={{
                  position: 'absolute',
                  bottom: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%) translateZ(4px)',
                  fontSize: '6px',
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.2)',
                  whiteSpace: 'nowrap',
                }}>
                  {post.date}
                </div>
              </div>
            )
          })}

          {/* Ghost text in 3D space */}
          {ghosts.map((ghost, i) => {
            const z = -(Math.random() * TOTAL_DEPTH)
            const x = (Math.random() - 0.5) * 400
            const y = -20 - Math.random() * 60
            const color = TYPE_COLORS[ghost.type] || '#fff'
            return (
              <div
                key={`ghost-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`,
                  fontSize: '8px',
                  fontFamily: 'monospace',
                  color,
                  opacity: 0.4,
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: `0 0 8px ${color}`,
                  animation: `ghostFloat ${3 + Math.random() * 4}s ease-in-out ${Math.random() * -5}s infinite`,
                  pointerEvents: 'none',
                }}
              >
                {ghost.text}
              </div>
            )
          })}

          {/* Bats */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`bat3d-${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate3d(${(Math.random() - 0.5) * 300}px, ${-40 - Math.random() * 40}px, ${-Math.random() * TOTAL_DEPTH}px)`,
                fontSize: '20px',
                animation: `batFlap3d ${0.3 + Math.random() * 0.3}s ease-in-out infinite`,
                pointerEvents: 'none',
              }}
            >
              🦇
            </div>
          ))}
        </div>
      </div>

      {/* HUD overlay */}
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
        zIndex: 20, textAlign: 'center',
        padding: '0.8rem', pointerEvents: 'none',
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
