import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DateNightDialog } from './DateNightDialog'

export function LipstickHallway() {
  const [rotate, setRotate] = useState(false)

  useEffect(() => {
    const check = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isPortrait = window.innerHeight > window.innerWidth
      setRotate(isTouch && isPortrait)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  const wrapperStyle: React.CSSProperties = rotate
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
      }
    : { position: 'fixed', inset: 0 }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
      style={wrapperStyle}
    >
      <iframe
        src={`${import.meta.env.BASE_URL}lipstick-hallway/index.html`}
        title="Lipstick Hallway"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#000',
        }}
      />
      <DateNightDialog />
    </motion.div>
  )
}
