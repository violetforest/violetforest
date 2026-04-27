import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'


export function DateNightDialog() {
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      <button
        onClick={() => setRevealed(r => !r)}
        style={{
          position: 'fixed',
          top: '2.5vh',
          right: '2vw',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.45)',
          fontFamily: '"VT323", "Menlo", ui-monospace, monospace',
          fontSize: '40px',
          letterSpacing: '1px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          padding: '12px 16px',
          zIndex: 11,
          textShadow: '0 0 6px rgba(0,0,0,0.5)',
          transition: 'color 200ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)')}
      >
        info
      </button>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              bottom: '12vh',
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
              fontFamily: '"VT323", "Menlo", ui-monospace, monospace',
              letterSpacing: '1px',
              color: 'rgba(255, 255, 255, 0.92)',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
              lineHeight: 1.35,
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontStyle: 'italic' }}>
              Date Night
            </div>
            <div style={{ fontSize: 'clamp(18px, 2vw, 22px)', opacity: 0.85 }}>
              Violet Forest
            </div>
            <div style={{ fontSize: 'clamp(18px, 2vw, 22px)', opacity: 0.85 }}>
              2018
            </div>
            <div style={{ fontSize: 'clamp(16px, 1.7vw, 20px)', opacity: 0.7 }}>
              three.js
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
