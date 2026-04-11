import { Link } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { RoomLayout } from '../components/RoomLayout'

interface Story {
  id: string
  body: string | null
  image_url: string | null
  created_at: string
}

function hoursLeft(created_at: string) {
  const ms = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(created_at).getTime())
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return '...'
}

// deterministic random from string seed
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

function StoryCard({ story, index }: { story: Story; index: number }) {
  const rand = useMemo(() => seededRandom(story.id), [story.id])

  const offsetX = useMemo(() => (rand() - 0.5) * 40, [rand])
  const rotation = useMemo(() => (rand() - 0.5) * 6, [rand])
  const animDelay = useMemo(() => rand() * 3, [rand])
  const animDuration = useMemo(() => 4 + rand() * 3, [rand])

  // fade based on time remaining
  const ms = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(story.created_at).getTime())
  const lifePercent = Math.max(0, Math.min(1, ms / (7 * 24 * 60 * 60 * 1000)))
  const fadeOpacity = 0.4 + lifePercent * 0.5

  return (
    <div
      style={{
        position: 'relative',
        transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
        opacity: fadeOpacity,
        animation: `storyFloat ${animDuration}s ease-in-out ${animDelay}s infinite`,
        padding: '1.2rem',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.04)',
        maxWidth: '85%',
        alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end',
      }}
    >
      {story.image_url && (
        <img
          src={story.image_url}
          alt=""
          style={{
            width: '100%',
            borderRadius: '4px',
            marginBottom: story.body ? '0.5rem' : 0,
          }}
        />
      )}
      {story.body && (
        <p style={{
          fontSize: '1.35rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}>
          {story.body}
        </p>
      )}
      <p style={{ fontSize: '0.85rem', opacity: 0.4, marginTop: '0.4rem' }}>
        {hoursLeft(story.created_at)}
      </p>
    </div>
  )
}

export function Stories() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('stories')
      .select('*')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setStories(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <RoomLayout>
      <style>{`
        @keyframes storyFloat {
          0%, 100% { transform: translateX(var(--ox)) rotate(var(--rot)) translateY(0); }
          50% { transform: translateX(var(--ox)) rotate(var(--rot)) translateY(-8px); }
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
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            zIndex: 2,
          }}
        >
          <Link
            to="/"
            style={{ fontSize: '1.28rem', opacity: 0.5, fontFamily: 'Georgia, serif' }}
          >
            home
          </Link>
          <p style={{ fontSize: '1.2rem', fontStyle: 'italic', opacity: 0.55 }}>
            now
          </p>
          <div style={{ width: '2rem' }} />
        </div>

        {/* stories area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: stories.length <= 3 ? 'center' : 'flex-start',
            alignItems: 'stretch',
            gap: '1.2rem',
            padding: '1rem 1.5rem 2rem',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {loading && (
            <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic', alignSelf: 'center' }}>
              ...
            </p>
          )}

          {!loading && stories.length === 0 && (
            <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic', alignSelf: 'center' }}>
              nothing right now
            </p>
          )}

          {stories.map((story, i) => (
            <StoryCard key={story.id} story={story} index={i} />
          ))}
        </div>
      </div>
    </RoomLayout>
  )
}
