import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'

interface Post {
  id: string
  type: string
  body: string | null
  image_url: string | null
  link_url: string | null
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

function PostCard({ post }: { post: Post }) {
  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        text: post.body || undefined,
        url: window.location.href,
      })
    }
  }

  return (
    <article
      className="h-entry"
      style={{
        width: '100%',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '1.5rem 0',
      }}
    >
      <data className="p-author h-card" value="violet forest" style={{ display: 'none' }} />
      {post.type === 'photo' && post.image_url && (
        <img
          className="u-photo"
          src={post.image_url}
          alt=""
          style={{
            width: '100%',
            borderRadius: '4px',
            marginBottom: '0.75rem',
          }}
        />
      )}

      {post.type === 'quote' && post.body && (
        <blockquote
          style={{
            borderLeft: '2px solid rgba(0,0,0,0.15)',
            paddingLeft: '1rem',
            fontStyle: 'italic',
            fontSize: 'clamp(1.65rem, 4.5vw, 1.95rem)',
            lineHeight: 1.5,
            opacity: 0.85,
          }}
        >
          <span className="e-content">{post.body}</span>
        </blockquote>
      )}

      {post.type === 'link' && (
        <a
          href={post.link_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            padding: '1rem',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '4px',
            marginBottom: post.body ? '0.5rem' : 0,
            fontSize: '1.35rem',
            opacity: 0.6,
            wordBreak: 'break-all',
          }}
        >
          {post.link_url}
        </a>
      )}

      {post.type === 'text' && post.body && (
        <p
          className="e-content"
          style={{
            fontSize: 'clamp(1.43rem, 3.75vw, 1.65rem)',
            lineHeight: 1.6,
            opacity: 0.85,
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.body}
        </p>
      )}

      {(post.type === 'link' || post.type === 'photo') && post.body && (
        <p
          style={{
            fontSize: 'clamp(1.35rem, 3vw, 1.5rem)',
            lineHeight: 1.5,
            opacity: 0.6,
            marginTop: '0.5rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.body}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem',
        }}
      >
        <time className="dt-published" dateTime={post.created_at} style={{ fontSize: '1.13rem', opacity: 0.45 }}>
          {timeAgo(post.created_at)}
        </time>
        {'share' in navigator && (
          <button
            onClick={share}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.13rem',
              opacity: 0.45,
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
            }}
          >
            share
          </button>
        )}
      </div>
    </article>
  )
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <ScrollableRoomLayout>
      <div className="h-feed" style={{ width: '100%' }}>
        <data className="p-name" value="violet's space" style={{ display: 'none' }} />
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
            feed
          </p>
          <div style={{ width: '2rem' }} />
        </div>

        {loading && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>
            loading...
          </p>
        )}

        {!loading && posts.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>
            nothing here yet
          </p>
        )}

        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </ScrollableRoomLayout>
  )
}
