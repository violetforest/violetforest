import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        background: '#000',
      }}
    >
      <iframe
        src={import.meta.env.BASE_URL + '3d/index.html'}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="Violet Forest 3D"
      />
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textDecoration: 'none',
          zIndex: 20,
          transition: 'opacity 0.3s',
        }}
      >
        &larr; back
      </Link>
    </motion.div>
  )
}
