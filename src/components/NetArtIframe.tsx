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
      style={{
        position: 'fixed',
        inset: 0,
        // Gradient backdrop so the route fade reads as the lipstick gradient
        // rather than a black or off-white flash before the iframe paints.
        background: 'linear-gradient(30deg, #6a00ef, #ff4aab, #000fff)',
      }}
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
          // Match the webcore route-fader so the brief load gap reads as the
          // gradient fading in, not a black flash.
          background: 'linear-gradient(30deg, #6a00ef, #ff4aab, #000fff)',
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
