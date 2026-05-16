import { ReactNode, useEffect } from 'react'
import { motion } from 'framer-motion'
import { NextRandomLink } from './NextRandomLink'
import { NetArtInfo } from './NetArtInfo'

// Cache-bust each iframe src so updated public/*.html files get re-fetched
// instead of being served from the browser's HTTP cache. Computed once at
// module load so all instances share the same value within a session.
const CACHE_BUST = (import.meta.env.VITE_BUILD_ID as string | undefined) || Date.now().toString()

export function NetArtIframe({
  src,
  title,
  showNext = true,
  info,
  infoLabel,
  infoPosition,
  infoRainbow,
  favicon,
  docTitle,
}: {
  src: string
  title: string
  showNext?: boolean
  info?: ReactNode
  infoLabel?: string
  infoPosition?: 'top-right' | 'bottom-right'
  infoRainbow?: boolean
  /**
   * Optional URL to swap into the document's favicon for the duration of this
   * route. The browser ignores `<link rel="icon">` inside iframed pages, so
   * iframe-based net-art routes that want their own favicon have to set it on
   * the top-level document. Original favicons are restored on unmount.
   */
  favicon?: string
  /**
   * Optional document.title to set while this route is mounted. Same reason as
   * `favicon` — the browser tab uses the parent document's title, not the
   * iframe's <title>. Original title is restored on unmount.
   */
  docTitle?: string
}) {
  useEffect(() => {
    if (!docTitle) return
    const prev = document.title
    document.title = docTitle
    return () => { document.title = prev }
  }, [docTitle])

  useEffect(() => {
    if (!favicon) return
    const head = document.head
    // Snapshot the existing icon links so we can restore them when leaving.
    const existing = Array.from(
      head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    ) as HTMLLinkElement[]
    const prevHrefs = existing.map((el) => el.getAttribute('href'))
    // Point every icon link at the route-specific favicon.
    existing.forEach((el) => el.setAttribute('href', favicon))
    // If there were no icon links at all, add one.
    let added: HTMLLinkElement | null = null
    if (existing.length === 0) {
      added = document.createElement('link')
      added.rel = 'icon'
      added.href = favicon
      head.appendChild(added)
    }
    return () => {
      existing.forEach((el, i) => {
        const prev = prevHrefs[i]
        if (prev != null) el.setAttribute('href', prev)
      })
      if (added) added.remove()
    }
  }, [favicon])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        // Windows XP Luna blue backdrop — bright sky-blue center fading out to
        // a deep navy edge, echoing the classic XP title-bar / Bliss palette.
        background:
          'radial-gradient(ellipse at 50% 45%, #6cb6ff 0%, #2566c8 55%, #0a2a6b 100%)',
      }}
    >
      <iframe
        src={src + (src.includes('?') ? '&' : '?') + 'v=' + CACHE_BUST}
        title={title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          // Windows XP Luna title-bar gradient — the iconic deep→bright→deep
          // blue ramp. Used as the iframe's load-time backdrop so the gap
          // reads as XP chrome fading in, not a black flash.
          background: 'linear-gradient(30deg, #0058ed, #2490f9, #1b75e0)',
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
