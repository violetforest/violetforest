import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, type Variants } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useSpaceStore } from '../store'
import { DoorSection } from '../components/DoorSection'
import { Hallway } from '../components/Hallway'

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
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

const doorLinkStyle: React.CSSProperties = {
  fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)',
  opacity: 0.4,
  borderBottom: '1px solid rgba(0,0,0,0.12)',
  paddingBottom: '2px',
  marginTop: '2rem',
}

export function HomeClassic() {
  useSpaceStore()

  const [latestPost, setLatestPost] = useState<Post | null>(null)
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([])
  const [hallwayProgress, setHallwayProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // The hallway section is 300vh tall. Calculate progress within it.
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <style>{`
        @keyframes scrollHint {
          0%, 100% { transform: translateY(0); opacity: 0.25; }
          50% { transform: translateY(6px); opacity: 0.45; }
        }
      `}</style>

      {/* 1. Hallway — 300vh scroll space with sticky 3D canvas */}
      <div style={{ height: '300vh', position: 'relative' }}>
        <Hallway scrollProgress={hallwayProgress} />
      </div>

      {/* 2. Now */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          now
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
          what's happening right now
        </h2>
        <Link to="/stories" style={doorLinkStyle}>
          see what's up
        </Link>
      </DoorSection>

      {/* 4. Listening */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          listening
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, marginBottom: '0.5rem' }}>
          this room changes with what's playing
        </h2>
        <p style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', opacity: 0.4, lineHeight: 1.6 }}>
          put a song, a podcast, a sound here.
          <br />
          the background shifts to match.
        </p>
        <Link to="/listening" style={doorLinkStyle}>
          walk through
        </Link>
      </DoorSection>

      {/* 5. Thinking / Feed */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          what i'm thinking about
        </p>
        {latestPost ? (
          <div style={{ width: '100%', textAlign: 'left' }}>
            {latestPost.type === 'text' && latestPost.body && (
              <p style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                lineHeight: 1.6,
                opacity: 0.85,
                whiteSpace: 'pre-wrap',
              }}>
                {latestPost.body.length > 200
                  ? latestPost.body.slice(0, 200) + '...'
                  : latestPost.body}
              </p>
            )}
            {latestPost.type === 'quote' && latestPost.body && (
              <blockquote style={{
                borderLeft: '2px solid rgba(0,0,0,0.15)',
                paddingLeft: '1rem',
                fontStyle: 'italic',
                fontSize: 'clamp(1.3rem, 3.5vw, 1.65rem)',
                lineHeight: 1.5,
                opacity: 0.85,
              }}>
                {latestPost.body}
              </blockquote>
            )}
            {latestPost.type === 'photo' && latestPost.image_url && (
              <img
                src={latestPost.image_url}
                alt=""
                style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }}
              />
            )}
            {latestPost.type === 'link' && (
              <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', opacity: 0.6, wordBreak: 'break-all' }}>
                {latestPost.link_url}
              </p>
            )}
            {(latestPost.type === 'photo' || latestPost.type === 'link') && latestPost.body && (
              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', opacity: 0.6, marginTop: '0.5rem' }}>
                {latestPost.body}
              </p>
            )}
            <p style={{ fontSize: '0.9rem', opacity: 0.35, marginTop: '0.75rem' }}>
              {timeAgo(latestPost.created_at)}
            </p>
          </div>
        ) : (
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
            a quiet room for loose thoughts
          </h2>
        )}
        <Link to="/feed" style={doorLinkStyle}>
          see more
        </Link>
      </DoorSection>

      {/* 6. Making */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          what i'm making
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
          sketches and experiments
        </h2>
        <Link to="/making" style={doorLinkStyle}>
          walk through
        </Link>
      </DoorSection>

      {/* 7. Guestbook */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          guestbook
        </p>
        {guestbookEntries.length > 0 ? (
          <div style={{ width: '100%', textAlign: 'left' }}>
            {guestbookEntries.map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', lineHeight: 1.5, opacity: 0.85 }}>
                  {entry.message.length > 100
                    ? entry.message.slice(0, 100) + '...'
                    : entry.message}
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.4, marginTop: '0.25rem' }}>
                  — {entry.name || 'someone'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
            leave a mark
          </h2>
        )}
        <Link to="/guestbook" style={doorLinkStyle}>
          sign the guestbook
        </Link>
      </DoorSection>

      {/* 8. Ask */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          ask me anything
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
          questions welcome
        </h2>
        <Link to="/ask" style={doorLinkStyle}>
          ask something
        </Link>
      </DoorSection>

      {/* 9. Message me */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          message me
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
          say something privately
        </h2>
        <Link to="/dm" style={doorLinkStyle}>
          send a message
        </Link>
      </DoorSection>

      {/* 10. Links */}
      <DoorSection>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          links
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
          things i recommend
        </h2>
        <Link to="/links" style={doorLinkStyle}>
          browse
        </Link>
      </DoorSection>

      {/* 11. Instagram Graveyard */}
      <DoorSection showThreshold={false}>
        <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', letterSpacing: '0.15em', opacity: 0.35, marginBottom: '1rem' }}>
          instagram graveyard
        </p>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3 }}>
          archived from another life
        </h2>
        <Link to="/graveyard/instagram" style={doorLinkStyle}>
          walk through
        </Link>
      </DoorSection>
    </motion.div>
  )
}
