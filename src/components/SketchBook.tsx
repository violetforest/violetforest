import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface Sketch {
  title: string
  url: string
}

interface Props {
  sketches: Sketch[]
}

export function SketchBook({ sketches }: Props) {
  const [index, setIndex] = useState(0)

  const sketch = sketches[index]
  const isLast = index === sketches.length - 1

  const next = () => {
    setIndex((index + 1) % sketches.length)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.8rem 1.2rem',
          background: 'rgba(240, 234, 245, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: '0.85rem',
            opacity: 0.4,
            fontFamily: 'Georgia, serif',
          }}
        >
          home
        </Link>

        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.4 }}>
          {sketch.title}
        </p>

        {isLast ? (
          <Link
            to="/"
            style={{
              fontSize: '0.85rem',
              opacity: 0.5,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            end
          </Link>
        ) : (
          <button
            onClick={next}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.85rem',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              cursor: 'pointer',
              opacity: 0.5,
              padding: 0,
            }}
          >
            next
          </button>
        )}
      </div>

      {/* Sketch */}
      <div style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <iframe
              src={sketch.url}
              title={sketch.title}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
