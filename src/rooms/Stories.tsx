import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'

interface Story {
  id: string
  body: string | null
  image_url: string | null
  created_at: string
}

function hoursLeft(created_at: string) {
  const ms = 24 * 60 * 60 * 1000 - (Date.now() - new Date(created_at).getTime())
  const hours = Math.floor(ms / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours}h left`
  if (minutes > 0) return `${minutes}m left`
  return 'fading...'
}

export function Stories() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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
    <ScrollableRoomLayout>
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
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

        {loading && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>loading...</p>
        )}

        {!loading && stories.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>
            nothing right now
          </p>
        )}

        {stories.map(story => (
          <div
            key={story.id}
            style={{
              width: '100%',
              padding: '1.5rem 0',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {story.image_url && (
              <img
                src={story.image_url}
                alt=""
                style={{ width: '100%', borderRadius: '4px', marginBottom: '0.75rem' }}
              />
            )}
            {story.body && (
              <p style={{ fontSize: '1.5rem', lineHeight: 1.6, opacity: 0.85, whiteSpace: 'pre-wrap' }}>
                {story.body}
              </p>
            )}
            <p style={{ fontSize: '1.05rem', opacity: 0.45, marginTop: '0.5rem' }}>
              {hoursLeft(story.created_at)}
            </p>
          </div>
        ))}
      </div>
    </ScrollableRoomLayout>
  )
}
