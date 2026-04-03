import { Link } from 'react-router-dom'
import { RoomLayout } from '../components/RoomLayout'
import { useSpaceStore } from '../store'

export function Home() {
  const { visitCount } = useSpaceStore()
  const isReturning = visitCount > 1

  return (
    <RoomLayout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '480px',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
            letterSpacing: '0.15em',
            textTransform: 'lowercase',
            opacity: 0.4,
            marginBottom: '1.5rem',
          }}
        >
          {isReturning ? 'welcome back' : 'hi, this is'}
        </p>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 8vw, 4rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.1,
            marginBottom: '2.5rem',
          }}
        >
          violet's space
        </h1>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            width: '100%',
          }}
        >
          {[
            { to: '/dopamine-hit', label: 'dopamine hit' },
            { to: '/stories', label: 'now' },
            { to: '/listening', label: 'what i\'m listening to' },
            { to: '/feed', label: 'what i\'m thinking about' },
            { to: '/making', label: 'what i\'m making' },
            { to: '/guestbook', label: 'guestbook' },
            { to: '/ask', label: 'ask me anything' },
            { to: '/dm', label: 'message me' },
            { to: '/links', label: 'links' },
            { to: '/about', label: 'about' },
            { to: '/graveyard/instagram', label: 'instagram graveyard' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                padding: '0.8rem 0',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                transition: 'opacity 0.3s',
                opacity: 0.7,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </RoomLayout>
  )
}
