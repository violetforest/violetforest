import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

interface Post {
  id: string
  type: string
  body: string | null
  image_url: string | null
  media: MediaItem[] | null
  link_url: string | null
  tags: string[] | null
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

function PostCard({ post, onTagClick }: { post: Post; onTagClick: (tag: string) => void }) {
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
      {post.type === 'photo' && (() => {
        // Prefer the multi-media array; fall back to legacy single image_url
        const items: MediaItem[] = post.media && post.media.length > 0
          ? post.media
          : post.image_url
            ? [{ url: post.image_url, type: 'image' }]
            : []
        if (items.length === 0) return null
        const single = items.length === 1
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: single ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            {items.map((m, i) => {
              // If odd count and >1, let the first item span both columns
              const span = !single && items.length % 2 === 1 && i === 0 ? 2 : 1
              const style: React.CSSProperties = {
                width: '100%',
                borderRadius: '4px',
                display: 'block',
                gridColumn: span === 2 ? 'span 2' : undefined,
                objectFit: 'cover',
                maxHeight: single ? undefined : '320px',
              }
              return m.type === 'video' ? (
                <video
                  key={i}
                  src={m.url}
                  controls
                  playsInline
                  style={style}
                />
              ) : (
                <img
                  key={i}
                  className={i === 0 ? 'u-photo' : undefined}
                  src={m.url}
                  alt=""
                  style={style}
                />
              )
            })}
          </div>
        )
      })()}

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

      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {post.tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className="p-category"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '1.13rem',
                fontStyle: 'italic',
                opacity: 0.55,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
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

const IG_EMBED_STYLES = `
  .ig-embed, .ig-embed * {
    font-family: Tahoma, Helvetica, Arial, sans-serif !important;
    color: #d4c1ff !important;
    border-color: #221655 !important;
    opacity: 1 !important;
  }
  .ig-embed time, .ig-embed .dt-published {
    color: #9988cc !important;
  }
  .ig-embed {
    background: #000 !important;
  }
  .ig-embed .h-feed {
    background: #000;
    padding: 0 !important;
  }
  .ig-embed a {
    color: #8844ff !important;
    text-shadow: 0 0 4px rgba(136, 68, 255, 0.5);
  }
  .ig-embed a:hover {
    color: #b599ff !important;
  }
  .ig-embed article {
    border-bottom: 1px solid #221655 !important;
    padding: 12px 10px !important;
  }
  .ig-embed h1, .ig-embed h2, .ig-embed h3, .ig-embed h4 {
    color: #fff !important;
    text-shadow: 0 0 4px rgba(136, 68, 255, 0.6);
  }
  .ig-embed p, .ig-embed span, .ig-embed div, .ig-embed time {
    font-size: 11px !important;
    line-height: 1.4 !important;
    font-style: normal !important;
  }
  .ig-embed em, .ig-embed i {
    font-style: italic !important;
  }
  .ig-embed blockquote {
    border-left: 2px solid #8844ff !important;
    padding-left: 10px !important;
    color: #d4c1ff !important;
  }
  .ig-embed button {
    background: #0a0418 !important;
    color: #d4c1ff !important;
    border: 0 !important;
    box-shadow:
      inset -1px -1px 0 0 #8844ff,
      inset 1px 1px 0 0 #8844ff !important;
    padding: 4px 8px !important;
    font-size: 10px !important;
    font-family: Tahoma, sans-serif !important;
    cursor: pointer;
  }
  .ig-embed button:hover {
    background: #1a1144 !important;
    box-shadow:
      inset -1px -1px 0 0 #b599ff,
      inset 1px 1px 0 0 #b599ff,
      0 0 6px rgba(136, 68, 255, 0.5) !important;
  }
  .ig-embed img, .ig-embed video {
    border: 1px solid #221655;
  }
  .ig-embed ::-webkit-scrollbar { width: 14px; }
  .ig-embed ::-webkit-scrollbar-track { background: #000; border-left: 1px solid #221655; }
  .ig-embed ::-webkit-scrollbar-thumb {
    background-color: #1a1144;
    box-shadow: inset -1px -1px 0 0 #8844ff, inset 1px 1px 0 0 #8844ff;
  }
`

export function Feed({ embed }: { embed?: boolean } = {}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')
  const igEmbed = embed || searchParams.get('embed') === 'ig'

  useEffect(() => {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (activeTag) query = query.contains('tags', [activeTag])
    query.then(({ data }) => {
      setPosts(data || [])
      setLoading(false)
    })
  }, [activeTag])

  const setTag = (tag: string | null) => {
    if (tag) setSearchParams({ tag })
    else setSearchParams({})
  }

  const inner = (
    <>
      {igEmbed && <style>{IG_EMBED_STYLES}</style>}
      <div className={`h-feed ${igEmbed ? 'ig-embed' : ''}`} style={{ width: '100%' }}>
        <data className="p-name" value="violet's space" style={{ display: 'none' }} />
        {!igEmbed && (
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
        )}

        {activeTag && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0.75rem',
              marginBottom: '1.5rem',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '4px',
              fontSize: '1.2rem',
              fontFamily: 'Georgia, serif',
            }}
          >
            <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
              filtering by #{activeTag}
            </span>
            <button
              onClick={() => setTag(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.13rem',
                opacity: 0.55,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              clear
            </button>
          </div>
        )}

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
          <PostCard key={post.id} post={post} onTagClick={setTag} />
        ))}
      </div>
    </>
  )

  if (igEmbed) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 10px',
        }}
      >
        {inner}
      </div>
    )
  }

  return (
    <ScrollableRoomLayout>
      {inner}
    </ScrollableRoomLayout>
  )
}
