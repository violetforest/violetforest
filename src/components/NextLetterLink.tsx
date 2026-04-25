import { useMemo } from 'react'
import { Link } from 'react-router-dom'

const LETTER_ROUTES = ['/guestbook', '/ask', '/dm']

export function NextLetterLink() {
  const to = useMemo(() => LETTER_ROUTES[Math.floor(Math.random() * LETTER_ROUTES.length)], [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '3vh',
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <Link
        to={to}
        style={{
          display: 'inline-block',
          pointerEvents: 'auto',
          fontFamily: '"VT323", "Menlo", ui-monospace, monospace',
          fontSize: 'clamp(32px, 3.4vw, 40px)',
          letterSpacing: '1px',
          color: 'rgba(255, 255, 255, 0.7)',
          textShadow: '0 0 8px rgba(0, 0, 0, 0.6)',
          transition: 'color 200ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)' }}
      >
        Next
        <span style={{ animation: 'date-night-caret 0.9s steps(1) infinite', marginLeft: 6 }}>▌</span>
      </Link>
    </div>
  )
}
