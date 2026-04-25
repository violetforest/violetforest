import { motion } from 'framer-motion'
import { NextRandomLink } from './NextRandomLink'

export function NetArtIframe({ src, title, showNext = true }: { src: string; title: string; showNext?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <iframe
        src={src}
        title={title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#000',
        }}
      />
      {showNext && <NextRandomLink />}
    </motion.div>
  )
}
