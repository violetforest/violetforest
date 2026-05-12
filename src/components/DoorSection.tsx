import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  showThreshold?: boolean
  light?: boolean
}

export function DoorSection({ children, showThreshold = true, light = false }: Props) {
  return (
    <section
      style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {children}
      </div>
      {showThreshold && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40px',
            height: '1px',
            background: light ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
          }}
        />
      )}
    </section>
  )
}
