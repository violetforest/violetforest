import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { RoomLayout } from '../components/RoomLayout'

interface LoginEntry {
  timestamp: string
  cookie: string
  ip: string
  port: string
  language: string
  userAgent: string
}

interface MediaItem {
  name: string
  type: 'image' | 'video'
  url: string
}

interface GraveyardData {
  logins: LoginEntry[]
  media: MediaItem[]
  stats: {
    totalLogins: number
    totalMedia: number
    totalImages: number
    totalVideos: number
    uniqueIPs: number
    uniqueUserAgents: number
    firstLogin: string
    lastLogin: string
  }
}

const base = import.meta.env.BASE_URL

function ImageCell({ item, login }: { item: MediaItem; login: LoginEntry }) {
  const [touched, setTouched] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '1',
      }}
      onMouseEnter={() => setTouched(true)}
      onMouseLeave={() => setTouched(false)}
      onTouchStart={() => setTouched(true)}
      onTouchEnd={() => setTimeout(() => setTouched(false), 2000)}
    >
      {item.type === 'video' ? (
        <video
          ref={videoRef}
          src={item.url}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: touched ? 'none' : 'grayscale(0.3) contrast(0.9)',
            transition: 'filter 0.3s ease',
          }}
        />
      ) : (
        <img
          src={item.url}
          alt=""
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: touched ? 'none' : 'grayscale(0.3) contrast(0.9)',
            transition: 'filter 0.3s ease',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0.4rem',
          background: touched
            ? 'linear-gradient(transparent 20%, rgba(0,0,0,0.8) 100%)'
            : 'none',
          transition: 'background 0.3s ease',
        }}
      >
        {touched && (
          <>
            <p style={{ color: '#0ff', fontSize: '0.55rem', fontFamily: 'monospace', lineHeight: 1.4 }}>
              {login.ip}:{login.port}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.45rem',
              fontFamily: 'monospace',
              lineHeight: 1.3,
              wordBreak: 'break-all',
              maxHeight: '2.5em',
              overflow: 'hidden',
            }}>
              {login.userAgent}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.45rem', fontFamily: 'monospace' }}>
              {login.cookie}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.45rem', fontFamily: 'monospace' }}>
              {new Date(login.timestamp).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export function InstagramGraveyard() {
  const [data, setData] = useState<GraveyardData | null>(null)

  useEffect(() => {
    fetch(`${base}graveyard/ig/data.json`)
      .then(r => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <RoomLayout>
        <p style={{ opacity: 0.45, fontStyle: 'italic' }}>loading...</p>
      </RoomLayout>
    )
  }

  return (
    <RoomLayout>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.8rem 1rem',
            zIndex: 2,
            background: 'rgba(240, 234, 245, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Link
            to="/"
            style={{ fontSize: '0.85rem', opacity: 0.5, fontFamily: 'Georgia, serif' }}
          >
            home
          </Link>
          <p style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.55 }}>
            instagram graveyard
          </p>
          <div style={{ width: '2rem' }} />
        </div>

        {/* stats bar */}
        <div
          style={{
            padding: '0.6rem 1rem',
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            color: '#1a1a1a',
            opacity: 0.4,
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            background: 'rgba(240, 234, 245, 0.6)',
          }}
        >
          <span>{data.stats.totalLogins} logins tracked</span>
          <span>{data.stats.uniqueIPs} unique IPs</span>
          <span>{data.stats.totalMedia} posts</span>
        </div>

        {/* grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2px',
            }}
          >
            {data.media.map((item, i) => (
              <ImageCell
                key={item.name}
                item={item}
                login={data.logins[i % data.logins.length]}
              />
            ))}
          </div>
        </div>
      </div>
    </RoomLayout>
  )
}
