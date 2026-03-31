import { motion, type Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

export function ScrollableRoomLayout({ children }: Props) {
  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem 1rem 4rem',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
