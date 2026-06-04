import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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

// Render text with any http(s) URLs turned into clickable links.
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  )
}

// A video thumbnail that shows an early frame as a still. Uses a #t= media
// fragment so the browser natively renders that frame — works on iOS, where
// off-screen canvas frame-capture does not.
function VideoThumb({ src, style, onClick }: {
  src: string
  style: React.CSSProperties
  onClick: () => void
}) {
  const posterSrc = src.includes('#') ? src : `${src}#t=0.1`
  return (
    <video
      src={posterSrc}
      muted
      playsInline
      preload="metadata"
      onClick={onClick}
      style={style}
    />
  )
}

function Lightbox({ items, index, onClose, onNav }: {
  items: MediaItem[]
  index: number
  onClose: () => void
  onNav: (delta: number) => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onNav(-1)
      else if (e.key === 'ArrowRight') onNav(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNav])

  const m = items[index]
  if (!m) return null

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 28,
    lineHeight: '48px',
    padding: 0,
    cursor: 'pointer',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%', border: 'none',
          background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 22,
          lineHeight: '40px', padding: 0, cursor: 'pointer',
        }}
      >
        ×
      </button>
      {items.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNav(-1) }} style={{ ...arrowStyle, left: 12 }}>
          ‹
        </button>
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {m.type === 'video' ? (
          <video src={m.url} controls autoPlay playsInline style={{ maxWidth: '92vw', maxHeight: '88vh' }} />
        ) : (
          <img src={m.url} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain' }} />
        )}
      </div>
      {items.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNav(1) }} style={{ ...arrowStyle, right: 12 }}>
          ›
        </button>
      )}
    </div>
  )
}

interface Comment {
  id: string
  post_id: string
  name: string | null
  body: string
  created_at: string
}

function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments(data || [])
        setLoaded(true)
      })
  }, [postId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setPosting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, name: name.trim() || null, body: trimmed })
      .select()
      .single()
    setPosting(false)
    if (error) {
      window.alert(`Comment failed: ${error.message}`)
      return
    }
    if (data) setComments([...comments, data as Comment])
    setBody('')
    setOpen(false)
  }

  return (
    <div style={{ marginTop: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid rgba(0,0,0,0.06)' }}>
      {loaded && comments.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          {comments.map(c => (
            <div key={c.id} style={{ fontSize: '1.13rem', opacity: 0.75, marginBottom: '0.4rem', lineHeight: 1.5 }}>
              <span style={{ fontStyle: 'italic', opacity: 0.7 }}>{c.name || 'someone'}: </span>
              <Linkified text={c.body} />
            </div>
          ))}
        </div>
      )}
      {!open ? (
        <a
          href="#"
          className="comment-link"
          onClick={(e) => { e.preventDefault(); setOpen(true) }}
          style={{
            display: 'inline-block',
            marginTop: '0.35rem',
            fontSize: '1.13rem',
            fontStyle: 'italic',
            opacity: 0.55,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: 'inherit',
            textDecoration: 'underline',
          }}
        >
          write a comment
        </a>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name (optional)"
            style={{ width: '100%', fontSize: '1.13rem', padding: '0.4rem 0.5rem', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 3, background: 'transparent', fontFamily: 'inherit', fontStyle: 'italic', color: 'inherit' }}
          />
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="add a comment…"
            autoFocus
            style={{ width: '100%', fontSize: '1.13rem', padding: '0.4rem 0.5rem', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 3, background: 'transparent', fontFamily: 'inherit', color: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setOpen(false); setBody(''); setName('') }}
              style={{ fontSize: '1.13rem', fontStyle: 'italic', padding: '0.25rem 0.7rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 3, cursor: 'pointer', opacity: 0.55, fontFamily: 'inherit', color: 'inherit' }}
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={posting || !body.trim()}
              style={{ fontSize: '1.13rem', fontStyle: 'italic', padding: '0.25rem 0.7rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 3, cursor: posting ? 'default' : 'pointer', opacity: posting || !body.trim() ? 0.4 : 0.7, fontFamily: 'inherit', color: 'inherit' }}
            >
              {posting ? '…' : 'post'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function PostCard({ post, onTagClick }: { post: Post; onTagClick: (tag: string) => void }) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  // Prefer the multi-media array; fall back to legacy single image_url
  const items: MediaItem[] = post.media && post.media.length > 0
    ? post.media
    : post.image_url
      ? [{ url: post.image_url, type: 'image' }]
      : []
  return (
    <article
      className="h-entry"
      data-post-id={post.id}
      style={{
        width: '100%',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '1.5rem 0',
      }}
    >
      <data className="p-author h-card" value="violet forest" style={{ display: 'none' }} />
      {post.type === 'photo' && (() => {
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
                cursor: 'pointer',
                // The single image and the spanning "hero" image show fully
                // at their natural aspect ratio; only the side-by-side tiles
                // are cropped to a uniform square.
                ...(single || span === 2
                  ? { objectFit: 'contain' as const, alignSelf: 'start' as const }
                  : { objectFit: 'cover' as const, aspectRatio: '1 / 1' }),
              }
              return m.type === 'video' ? (
                <VideoThumb
                  key={i}
                  src={m.url}
                  onClick={() => setLightbox(i)}
                  style={style}
                />
              ) : (
                <img
                  key={i}
                  className={i === 0 ? 'u-photo' : undefined}
                  src={m.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onClick={() => setLightbox(i)}
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
          <span className="e-content"><Linkified text={post.body} /></span>
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
          <Linkified text={post.body} />
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
          <Linkified text={post.body} />
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
      </div>
      <Comments postId={post.id} />
      {lightbox !== null && (
        <Lightbox
          items={items}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNav={(delta) => setLightbox((cur) => (cur === null ? cur : (cur + delta + items.length) % items.length))}
        />
      )}
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
  .ig-embed p, .ig-embed span, .ig-embed div, .ig-embed time, .ig-embed a,
  .ig-embed input, .ig-embed textarea {
    font-size: 11px !important;
    line-height: 1.4 !important;
    font-style: normal !important;
  }
  .ig-embed a.comment-link {
    font-style: italic !important;
  }
  .ig-embed input, .ig-embed textarea {
    font-family: Tahoma, Helvetica, Arial, sans-serif !important;
    color: #d4c1ff !important;
    background: transparent !important;
    border: 1px solid #221655 !important;
    padding: 4px 6px !important;
  }
  .ig-embed input::placeholder, .ig-embed textarea::placeholder {
    color: #d4c1ff !important;
    font-style: normal !important;
    opacity: 0.55;
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
  const PAGE_SIZE = 8
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [allTags, setAllTags] = useState<string[]>([])
  // year → { post index in unfiltered list, post id } — first post of that year
  const [yearAnchors, setYearAnchors] = useState<Map<number, { index: number; id: string }>>(new Map())
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')
  const igEmbed = embed || searchParams.get('embed') === 'ig'
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset pagination when the active tag changes
  useEffect(() => {
    setPosts([])
    setPageCount(1)
    setHasMore(true)
    setLoading(true)
  }, [activeTag])

  useEffect(() => {
    if (pageCount > 1) setLoadingMore(true)
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, pageCount * PAGE_SIZE - 1)
    if (activeTag) query = query.contains('tags', [activeTag])
    query.then(({ data }) => {
      const arr = (data || []) as Post[]
      setPosts(arr)
      setLoading(false)
      setLoadingMore(false)
      if (arr.length < pageCount * PAGE_SIZE) setHasMore(false)
    })
  }, [activeTag, pageCount])

  // Load the next page when the sentinel scrolls into view
  useEffect(() => {
    if (!hasMore || loading) return
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPageCount(c => c + 1) },
      { rootMargin: '600px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading, posts.length])

  // Load every distinct tag (unfiltered) so the tag cloud is the same on
  // every view, regardless of the current filter. Frequency-sorted desc.
  useEffect(() => {
    supabase
      .from('posts')
      .select('tags')
      .then(({ data }) => {
        const counts = new Map<string, number>()
        for (const row of (data || []) as { tags: string[] | null }[]) {
          for (const t of row.tags || []) counts.set(t, (counts.get(t) || 0) + 1)
        }
        setAllTags(
          Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([t]) => t)
        )
      })
  }, [])

  // Load the post id + created_at for every post (lightweight) so we know
  // which years exist and where the first post of each year sits in the
  // unfiltered timeline. Used by the year jump links.
  useEffect(() => {
    supabase
      .from('posts')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const m = new Map<number, { index: number; id: string }>()
        ;(data || []).forEach((row: { id: string; created_at: string }, i: number) => {
          const year = new Date(row.created_at).getFullYear()
          if (!m.has(year)) m.set(year, { index: i, id: row.id })
        })
        setYearAnchors(m)
      })
  }, [])

  const years = Array.from(yearAnchors.keys()).sort((a, b) => b - a)

  const jumpToYear = (year: number) => {
    const anchor = yearAnchors.get(year)
    if (!anchor) return
    // Clear any active tag filter so the year jump operates on the full feed
    if (activeTag) setSearchParams({})
    // Make sure enough pages have been requested to include the anchor post
    const pageNeeded = Math.ceil((anchor.index + 1) / PAGE_SIZE)
    if (pageNeeded > pageCount) setPageCount(pageNeeded)
    // Wait for the new posts to render, then scroll the post into view.
    const tryScroll = (attempts = 0) => {
      const el = document.querySelector(`[data-post-id="${anchor.id}"]`)
      if (el) {
        ;(el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (attempts < 30) {
        setTimeout(() => tryScroll(attempts + 1), 100)
      }
    }
    tryScroll()
  }

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

        {allTags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTag(activeTag === tag ? null : tag)}
                className="p-category"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '1.13rem',
                  fontStyle: 'italic',
                  opacity: activeTag === tag ? 0.95 : 0.55,
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {years.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            {years.map(y => (
              <button
                key={y}
                onClick={() => jumpToYear(y)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '1.13rem',
                  fontStyle: 'italic',
                  opacity: 0.55,
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  textDecoration: 'underline',
                }}
              >
                {y}
              </button>
            ))}
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

        {hasMore && posts.length > 0 && (
          <div ref={sentinelRef} style={{ height: 1 }} />
        )}
        {loadingMore && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic', padding: '0.75rem 0' }}>
            loading more…
          </p>
        )}
      </div>
    </>
  )

  if (igEmbed) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
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
