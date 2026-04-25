import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { supabase } from '../lib/supabase'

interface PhotoItem {
  id: string
  image_url: string | null
  body: string | null
  created_at: string
  type: 'photo' | 'text' | 'quote'
}

const PLACEHOLDER_COLORS = [
  '#e8d5e0', '#d5dae8', '#d5e8d8', '#e8e2d5', '#ddd5e8',
  '#e8d5d5', '#d5e2e8', '#e0e8d5', '#e8d8e0', '#d8d5e8',
  '#e5d5e0', '#d5e8e2', '#e8ddd5', '#d5d8e8', '#e0d5e8',
]

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    h = h ^ (h >>> 16)
    return (h >>> 0) / 0xffffffff
  }
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

// ── Card face (shared between desktop and mobile) ──────────────
function CardFront({
  item,
  placeholderColor,
  shadow,
}: {
  item: PhotoItem | null
  placeholderColor: string
  shadow: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: shadow,
      }}
    >
      {item?.image_url ? (
        <img
          src={item.image_url}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      ) : item?.body ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            background: placeholderColor,
          }}
        >
          <p
            style={{
              fontSize: item.type === 'quote' ? '0.75rem' : '0.7rem',
              fontStyle: item.type === 'quote' ? 'italic' : 'normal',
              lineHeight: 1.4,
              opacity: 0.8,
              textAlign: 'center',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 8,
              WebkitBoxOrient: 'vertical',
              fontFamily: 'Georgia, serif',
            }}
          >
            {item.body}
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', background: placeholderColor }} />
      )}
    </div>
  )
}

function CardBack({
  item,
  shadow,
}: {
  item: PhotoItem | null
  shadow: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: '#fff',
        borderRadius: '3px',
        padding: '16px',
        boxShadow: shadow,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {item?.body && (
        <p
          style={{
            fontSize: '0.7rem',
            lineHeight: 1.5,
            opacity: 0.7,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 10,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {item.body}
        </p>
      )}
      {item && (
        <p style={{ fontSize: '0.6rem', opacity: 0.4, fontFamily: 'monospace', marginTop: 'auto' }}>
          {timeAgo(item.created_at)}
        </p>
      )}
    </div>
  )
}

// ── Desktop: draggable pile ────────────────────────────────────
function DesktopCard({
  item,
  index,
  zIndex,
  initialX,
  initialY,
  initialRotation,
  onBringToFront,
  isPlaceholder,
}: {
  item: PhotoItem | null
  index: number
  zIndex: number
  initialX: number
  initialY: number
  initialRotation: number
  onBringToFront: () => void
  isPlaceholder: boolean
}) {
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 })
  const [pos, setPos] = useState({ x: initialX, y: initialY })
  const [dragging, setDragging] = useState(false)
  const [flipped, setFlipped] = useState(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onBringToFront()
    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.x,
      startTop: pos.y,
    }
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos.x, pos.y, onBringToFront])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragInfo.current.isDragging) return
    setPos({
      x: dragInfo.current.startLeft + (e.clientX - dragInfo.current.startX),
      y: dragInfo.current.startTop + (e.clientY - dragInfo.current.startY),
    })
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - dragInfo.current.startX)
    const dy = Math.abs(e.clientY - dragInfo.current.startY)
    dragInfo.current.isDragging = false
    setDragging(false)
    if (dx < 5 && dy < 5 && !isPlaceholder && item) {
      setFlipped(f => !f)
    }
  }, [isPlaceholder, item])

  const width = 180
  const height = 270
  const placeholderColor = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length]
  const shadow = dragging
    ? '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)'
    : '0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width,
        height,
        zIndex,
        transform: `rotate(${initialRotation}deg)`,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        perspective: '600px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <CardFront item={item} placeholderColor={placeholderColor} shadow={shadow} />
        <CardBack item={item} shadow={shadow} />
      </div>
    </div>
  )
}

// ── Mobile: swipeable deck ─────────────────────────────────────
function SwipeCard({
  item,
  index,
  isTop,
  onSwipe,
}: {
  item: PhotoItem | null
  index: number
  isTop: boolean
  onSwipe: () => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])
  const placeholderColor = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length]
  const [flipped, setFlipped] = useState(false)

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
      const dir = info.offset.x > 0 ? 1 : -1
      animate(x, dir * 400, {
        duration: 0.3,
        onComplete: onSwipe,
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }

  const handleTap = () => {
    if (item) setFlipped(f => !f)
  }

  const shadow = '0 4px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: '75vw',
        maxWidth: '300px',
        aspectRatio: '2/3',
        x,
        rotate,
        opacity,
        cursor: isTop ? 'grab' : 'default',
        perspective: '600px',
        zIndex: isTop ? 10 : 0,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <CardFront item={item} placeholderColor={placeholderColor} shadow={shadow} />
        <CardBack item={item} shadow={shadow} />
      </div>
    </motion.div>
  )
}

function MobileDeck({ items }: { items: PhotoItem[] }) {
  const [topIndex, setTopIndex] = useState(0)

  const handleSwipe = useCallback(() => {
    setTopIndex(prev => prev + 1)
  }, [])

  const remaining = items.slice(topIndex)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {remaining.length === 0 ? (
        <p style={{ opacity: 0.4, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
          that's everything
        </p>
      ) : (
        <>
          {/* Show up to 3 stacked cards behind the top one */}
          {remaining.slice(0, 3).reverse().map((item, reverseI) => {
            const stackI = 2 - reverseI
            const isTop = stackI === 0
            const offset = stackI * 4
            const scale = 1 - stackI * 0.03
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translateY(${offset}px) scale(${scale})`,
                  transition: 'transform 0.3s ease',
                }}
              >
                <SwipeCard
                  item={item.id.startsWith('placeholder-') ? null : item}
                  index={topIndex + stackI}
                  isTop={isTop}
                  onSwipe={handleSwipe}
                />
              </div>
            )
          })}

          <p
            style={{
              position: 'absolute',
              bottom: '2rem',
              fontSize: '0.7rem',
              opacity: 0.3,
              fontFamily: 'monospace',
            }}
          >
            {topIndex + 1} / {items.length}
          </p>
        </>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export function PhotoPile() {
  const [items, setItems] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [zIndices, setZIndices] = useState<number[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const maxZ = useRef(20)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const { data: stories } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      const combined: PhotoItem[] = []

      if (stories) {
        stories.forEach(s => {
          combined.push({
            id: s.id,
            image_url: s.image_url,
            body: s.body,
            created_at: s.created_at,
            type: 'photo',
          })
        })
      }

      if (posts) {
        posts.forEach(p => {
          combined.push({
            id: p.id,
            image_url: p.image_url,
            body: p.body,
            created_at: p.created_at,
            type: p.type as 'photo' | 'text' | 'quote',
          })
        })
      }

      const totalNeeded = Math.max(12, combined.length)
      while (combined.length < totalNeeded) {
        combined.push({
          id: `placeholder-${combined.length}`,
          image_url: null,
          body: null,
          created_at: new Date().toISOString(),
          type: 'photo',
        })
      }

      setItems(combined)
      setZIndices(combined.map((_, i) => i))
      maxZ.current = combined.length
      setLoading(false)
    }

    fetchData()
  }, [])

  const bringToFront = useCallback((index: number) => {
    maxZ.current += 1
    setZIndices(prev => {
      const next = [...prev]
      next[index] = maxZ.current
      return next
    })
  }, [])

  const positions = useMemo(() => {
    return items.map((item) => {
      const rand = seededRandom(item.id)
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1000
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      const margin = 60
      return {
        x: margin + rand() * (vw - 240 - margin * 2),
        y: margin + 60 + rand() * (vh - 330 - margin * 2),
        rotation: (rand() - 0.5) * 24,
      }
    })
  }, [items])

  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f5f0f8 0%, #ede6f2 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
        }}
      >
        <Link
          to="/"
          style={{ fontSize: '0.85rem', opacity: 0.4, fontFamily: 'Georgia, serif' }}
        >
          home
        </Link>
        <p style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.45 }}>
          photos
        </p>
        <div style={{ width: '2rem' }} />
      </div>

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ opacity: 0.4, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>...</p>
        </div>
      )}

      {!loading && isMobile && (
        <MobileDeck items={items} />
      )}

      {!loading && !isMobile && items.map((item, i) => (
        <DesktopCard
          key={item.id}
          item={item.id.startsWith('placeholder-') ? null : item}
          index={i}
          zIndex={zIndices[i] ?? i}
          initialX={positions[i]?.x ?? 100}
          initialY={positions[i]?.y ?? 100}
          initialRotation={positions[i]?.rotation ?? 0}
          onBringToFront={() => bringToFront(i)}
          isPlaceholder={item.id.startsWith('placeholder-')}
        />
      ))}
    </motion.div>
  )
}
