import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { NextRandomLink } from './NextRandomLink'
import { NetArtInfo } from './NetArtInfo'

export function NetArtIframe({
  src,
  title,
  showNext = true,
  info,
  infoLabel,
  infoPosition,
  infoRainbow,
}: {
  src: string
  title: string
  showNext?: boolean
  info?: ReactNode
  infoLabel?: string
  infoPosition?: 'top-right' | 'bottom-right'
  infoRainbow?: boolean
}) {
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
      {info && (
        <NetArtInfo label={infoLabel} position={infoPosition} rainbow={infoRainbow}>
          {info}
        </NetArtInfo>
      )}
      {showNext && <NextRandomLink />}
    </motion.div>
  )
}
