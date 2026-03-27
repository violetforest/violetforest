import { Link } from 'react-router-dom'
import { RoomLayout } from '../components/RoomLayout'

export function Thinking() {
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
            fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
            letterSpacing: '0.15em',
            textTransform: 'lowercase',
            opacity: 0.35,
            marginBottom: '1rem',
          }}
        >
          thinking
        </p>

        <h2
          style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.3,
            marginBottom: '0.5rem',
          }}
        >
          a quiet room for loose thoughts
        </h2>

        <p
          style={{
            fontSize: 'clamp(0.85rem, 2vw, 1rem)',
            opacity: 0.4,
            lineHeight: 1.6,
            marginBottom: '3rem',
          }}
        >
          a sentence. a question. a link.
          <br />
          whatever is on your mind lately.
        </p>

        <Link
          to="/"
          style={{
            fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)',
            opacity: 0.35,
            borderBottom: '1px solid rgba(0,0,0,0.15)',
            paddingBottom: '2px',
          }}
        >
          back
        </Link>
      </div>
    </RoomLayout>
  )
}
