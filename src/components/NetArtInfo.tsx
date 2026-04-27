import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function NetArtInfo({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          top: '2.5vh',
          right: '2vw',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.55)',
          fontFamily: '"VT323", "Menlo", ui-monospace, monospace',
          fontSize: '40px',
          letterSpacing: '1px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          padding: '12px 16px',
          zIndex: 12,
          textShadow: '0 0 6px rgba(0, 0, 0, 0.6)',
          transition: 'color 200ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)' }}
      >
        info
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
