import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, type Variants } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useSpaceStore } from '../store'
import { DoorSection } from '../components/DoorSection'

interface Post {
  id: string
  type: string
  body: string | null
  image_url: string | null
  link_url: string | null
  created_at: string
}

interface GuestbookEntry {
  id: string
  name: string | null
  message: string
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

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const doorLinkStyle: React.CSSProperties = {
  fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)',
  opacity: 0.4,
  borderBottom: '1px solid rgba(0,0,0,0.12)',
  paddingBottom: '2px',
  marginTop: '2rem',
}

function LipstickTunnel({ scrollProgress }: { scrollProgress: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'lipstick2-ready') readyRef.current = true
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    const post = () => {
      const w = iframeRef.current?.contentWindow
      if (!w) return
      w.postMessage({ type: 'lipstick2-progress', value: scrollProgress }, '*')
    }
    post()
    // also retry shortly in case the iframe loads after first scroll
    const id = setTimeout(post, 200)
    return () => clearTimeout(id)
  }, [scrollProgress])

  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', zIndex: 2, background: '#000' }}>
      <iframe
        ref={iframeRef}
        src={`${import.meta.env.BASE_URL}lipstick-2/index.html`}
        title="lipstick-2"
        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
      />
      <style>{`
        @keyframes scrollHint {
          0%, 100% { transform: translateY(0); opacity: 0.25; }
          50% { transform: translateY(6px); opacity: 0.45; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', opacity: Math.max(0, 0.5 - scrollProgress * 2),
          fontSize: '1.5rem', color: '#f0eaf5', animation: 'scrollHint 2s ease-in-out infinite',
        }}
      >
        ↓
      </div>
    </div>
  )
}

export function LipstickHome() {
  useSpaceStore()

  const [latestPost, setLatestPost] = useState<Post | null>(null)
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([])
  const [hallwayProgress, setHallwayProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hallwayHeight = window.innerHeight * 3
    const scrollTop = el.scrollTop
    const progress = Math.max(0, Math.min(1, scrollTop / (hallwayHeight - window.innerHeight)))
    setHallwayProgress(progress)
  }, [])

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setLatestPost(data[0])
      })

    supabase
      .from('guestbook_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setGuestbookEntries(data || [])
      })
  }, [])

  return (
    <motion.div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ position: 'fixed', inset: 0, zIndex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div style={{ height: '300vh', position: 'relative' }}>
        <LipstickTunnel scrollProgress={hallwayProgress} />
      </div>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>dopamine hit</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>a quick burst of something</h2>
        <Link to="/dopamine-hit" style={doorLinkStyle}>enter</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>now</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>what's happening right now</h2>
        <Link to="/stories" style={doorLinkStyle}>see what's up</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>listening</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, marginBottom: '0.5rem' }}>this room changes with what's playing</h2>
        <p style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', opacity: 0.4, lineHeight: 1.6 }}>
          put a song, a podcast, a sound here.
          <br />
          the background shifts to match.
        </p>
        <Link to="/listening" style={doorLinkStyle}>walk through</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>what i'm thinking about</p>
        {latestPost ? (
          <div style={{ width: '100%', textAlign: 'left' }}>
            {latestPost.type === 'text' && latestPost.body && (
              <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', lineHeight: 1.6, opacity: 0.85, whiteSpace: 'pre-wrap' }}>
                {latestPost.body.length > 200 ? latestPost.body.slice(0, 200) + '...' : latestPost.body}
              </p>
            )}
            {latestPost.type === 'quote' && latestPost.body && (
              <blockquote style={{ borderLeft: '2px solid rgba(0,0,0,0.15)', paddingLeft: '1rem', fontStyle: 'italic', fontSize: 'clamp(1.3rem, 3.5vw, 1.65rem)', lineHeight: 1.5, opacity: 0.85 }}>
                {latestPost.body}
              </blockquote>
            )}
            {latestPost.type === 'photo' && latestPost.image_url && (
              <img src={latestPost.image_url} alt="" style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
            )}
            {latestPost.type === 'link' && (
              <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', opacity: 0.6, wordBreak: 'break-all' }}>{latestPost.link_url}</p>
            )}
            {(latestPost.type === 'photo' || latestPost.type === 'link') && latestPost.body && (
              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', opacity: 0.6, marginTop: '0.5rem' }}>{latestPost.body}</p>
            )}
            <p style={{ fontSize: '0.9rem', opacity: 0.35, marginTop: '0.75rem' }}>{timeAgo(latestPost.created_at)}</p>
          </div>
        ) : (
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>a quiet room for loose thoughts</h2>
        )}
        <Link to="/feed" style={doorLinkStyle}>see more</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>what i'm making</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>sketches and experiments</h2>
        <Link to="/making" style={doorLinkStyle}>walk through</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>guestbook</p>
        {guestbookEntries.length > 0 ? (
          <div style={{ width: '100%', textAlign: 'left' }}>
            {guestbookEntries.map(entry => (
              <div key={entry.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', lineHeight: 1.5, opacity: 0.85 }}>
                  {entry.message.length > 100 ? entry.message.slice(0, 100) + '...' : entry.message}
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.4, marginTop: '0.25rem' }}>— {entry.name || 'someone'}</p>
              </div>
            ))}
          </div>
        ) : (
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>leave a mark</h2>
        )}
        <Link to="/guestbook" style={doorLinkStyle}>sign the guestbook</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>ask me anything</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>questions welcome</h2>
        <Link to="/ask" style={doorLinkStyle}>ask something</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>message me</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>say something privately</h2>
        <Link to="/dm" style={doorLinkStyle}>send a message</Link>
      </DoorSection>

      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>links</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>things i recommend</h2>
        <Link to="/links" style={doorLinkStyle}>browse</Link>
      </DoorSection>

      <DoorSection showThreshold={false}>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>instagram graveyard</p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>archived from another life</h2>
        <Link to="/graveyard/instagram" style={doorLinkStyle}>walk through</Link>
      </DoorSection>
    </motion.div>
  )
}
