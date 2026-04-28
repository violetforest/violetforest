import { motion } from 'framer-motion'

export function Home() {
  return (
    <motion.iframe
      src="/violet-forest-3d/index.html"
      title="Violet Forest"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        background: '#000',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
    />
  )
}
