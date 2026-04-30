import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const RAINBOW = ['#ff5577', '#ff9944', '#ffdd55', '#66cc66', '#5588ff', '#aa66ff']

interface Props {
  children: ReactNode
  label?: string
  position?: 'top-right' | 'bottom-right'
  rainbow?: boolean
}

export function NetArtInfo({
  children,
  label = 'info',
  position = 'bottom-right',
  rainbow = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)

  const buttonAnchor: React.CSSProperties =
    position === 'top-right'
      ? { top: '2.5vh', right: '2vw' }
      : { bottom: '2.5vh', right: '2vw' }

  const baseColor = 'rgba(255, 255, 255, 0.55)'
  const hoverColor = 'rgba(255, 255, 255, 0.95)'

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'fixed',
          ...buttonAnchor,
          background: 'transparent',
          border: 'none',
          color: rainbow ? undefined : (hover ? hoverColor : baseColor),
          fontFamily: '"VT323", "Menlo", ui-monospace, monospace',
          fontSize: '40px',
          letterSpacing: '1px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          padding: '12px 16px',
          zIndex: 12,
          textShadow: '0 0 6px rgba(0, 0, 0, 0.6)',
          transition: 'opacity 200ms ease',
          opacity: rainbow ? (hover ? 1 : 0.85) : 1,
        }}
      >
        {rainbow
          ? label.split('').map((ch, i) => (
              <span key={i} style={{ color: RAINBOW[i % RAINBOW.length] }}>
                {ch}
              </span>
            ))
          : label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              padding: '2rem',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '420px',
                cursor: 'default',
                fontFamily: '"VT323", "Menlo", ui-monospace, monospace',
                color: 'rgba(255, 255, 255, 0.92)',
                letterSpacing: '0.5px',
                lineHeight: 1.45,
                textShadow: '0 0 8px rgba(0, 0, 0, 0.4)',
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
