import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { RoomLayout } from '../components/RoomLayout'

export function DopamineHit() {
  const base = import.meta.env.BASE_URL
  const [entered, setEntered] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'dopamine-hit-done') {
        navigate('/making')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [navigate])

  const enter = async () => {
    // Request motion permission from the top-level page (required on iOS)
    try {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof (DeviceMotionEvent as any).requestPermission === 'function'
      ) {
        await (DeviceMotionEvent as any).requestPermission()
      }
    } catch {}
    setEntered(true)
  }

  if (!entered) {
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
            gap: '2rem',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              fontWeight: 400,
              fontStyle: 'italic',
            }}
          >
            dopamine hit
          </h2>
          <button
            onClick={enter}
            style={{
              background: 'none',
              border: '1px solid rgba(0,0,0,0.15)',
              padding: '0.8rem 2rem',
              fontSize: '1rem',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              cursor: 'pointer',
              opacity: 0.6,
              borderRadius: '4px',
            }}
          >
            enter
          </button>
          <Link
            to="/"
            style={{
              fontSize: '0.8rem',
              opacity: 0.3,
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              paddingBottom: '2px',
            }}
          >
            back
          </Link>
        </div>
      </RoomLayout>
    )
  }

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
            allow="autoplay; encrypted-media; accelerometer; gyroscope; vibrate"
            allowFullScreen
          />
        </div>
      </div>
    </RoomLayout>
  )
}
