import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense, useState } from 'react'
import { Home } from './rooms/Home'
import { HomeClassic } from './rooms/HomeClassic'
import { Listening } from './rooms/Listening'
import { Thinking } from './rooms/Thinking'
import { Making } from './rooms/Making'
import { DopamineHit } from './rooms/DopamineHit'
import { LipstickHallway } from './rooms/LipstickHallway'
import { useSpaceStore } from './store'
import { useEffect } from 'react'

const Feed = lazy(() => import('./rooms/Feed').then(m => ({ default: m.Feed })))
const Admin = lazy(() => import('./rooms/Admin').then(m => ({ default: m.Admin })))
const Guestbook = lazy(() => import('./rooms/Guestbook').then(m => ({ default: m.Guestbook })))
const AskBox = lazy(() => import('./rooms/AskBox').then(m => ({ default: m.AskBox })))
const Links = lazy(() => import('./rooms/Links').then(m => ({ default: m.Links })))
const Stories = lazy(() => import('./rooms/Stories').then(m => ({ default: m.Stories })))
const SendDM = lazy(() => import('./rooms/SendDM').then(m => ({ default: m.SendDM })))
const PhotoPile = lazy(() => import('./rooms/PhotoPile').then(m => ({ default: m.PhotoPile })))
const InstagramGraveyard = lazy(() => import('./rooms/InstagramGraveyard').then(m => ({ default: m.InstagramGraveyard })))
// const InstagramGraveyard3D = lazy(() => import('./rooms/InstagramGraveyard3D').then(m => ({ default: m.InstagramGraveyard3D })))

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { markVisited, incrementVisits } = useSpaceStore()

  useEffect(() => {
    incrementVisits()
  }, [])

  useEffect(() => {
    markVisited(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'navigate' && typeof e.data.to === 'string') {
        navigate(e.data.to)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  const blackBgRoute = location.pathname === '/' || location.pathname === '/lipstick'

  const [rotate, setRotate] = useState(false)
  useEffect(() => {
    const check = () => {
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

  const rotatedWrapperStyle: React.CSSProperties = rotate
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
      }
    : { position: 'fixed', inset: 0 }

  return (
    <>
      {blackBgRoute && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div style={rotatedWrapperStyle}>
        <AnimatePresence mode="wait">
          <Suspense key={location.pathname} fallback={null}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/classic" element={<HomeClassic />} />
              <Route path="/listening" element={<Listening />} />
              <Route path="/thinking" element={<Thinking />} />
              <Route path="/making" element={<Making />} />
              <Route path="/dopamine-hit" element={<DopamineHit />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/guestbook" element={<Guestbook />} />
              <Route path="/ask" element={<AskBox />} />
              <Route path="/links" element={<Links />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/dm" element={<SendDM />} />
              <Route path="/graveyard/instagram" element={<InstagramGraveyard />} />
              <Route path="/photos" element={<PhotoPile />} />
              <Route path="/lipstick" element={<LipstickHallway />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>
    </>
  )
}
