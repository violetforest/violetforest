import { Link } from 'react-router-dom'
import { RoomLayout } from '../components/RoomLayout'

export function DopamineHit() {
  const base = import.meta.env.BASE_URL

  return (
    <RoomLayout>
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.8rem 1.2rem',
            background: 'rgba(240, 234, 245, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: '0.85rem',
              opacity: 0.4,
              fontFamily: 'Georgia, serif',
            }}
          >
            home
          </Link>
          <p style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.5 }}>
            dopamine hit
          </p>
          <div style={{ width: '3rem' }} />
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            src={`${base}dopamine-hit.html`}
            title="DOPAMINE HIT"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </RoomLayout>
  )
}
