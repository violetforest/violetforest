import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// New home: full-screen iframe of the standalone 3D logo page (public/violet-forest-3d/).
// On mobile portrait, the iframe is rotated 90° so the wide logo fills the screen
// horizontally (otherwise it would be tiny in a narrow portrait window).
export function Home() {
  const [rotate, setRotate] = useState(false)

  useEffect(() => {
    const check = () => {
      // Rotate iframe if we're on a touch device in portrait
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

  const base = {
    position: 'fixed' as const,
    border: 'none',
    background: '#000',
  }

  // Rotated: swap w/h and rotate 90° around the center, using the viewport
  // size so the rotated iframe fills the whole portrait screen.
  const rotatedStyle = rotate
    ? {
        ...base,
        top: '50%',
        left: '50%',
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
      }
    : {
        ...base,
        inset: 0 as const,
        width: '100%',
        height: '100%',
      }

  return (
    <motion.iframe
      src="/violet-forest-3d/index.html"
      title="Violet Forest"
      style={rotatedStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
    />
  )
}
