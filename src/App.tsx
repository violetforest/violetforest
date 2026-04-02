import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { WebGLBackground } from './components/WebGLBackground'
import { Home } from './rooms/Home'
import { Listening } from './rooms/Listening'
import { Thinking } from './rooms/Thinking'
import { Making } from './rooms/Making'
import { DopamineHit } from './rooms/DopamineHit'
import { useSpaceStore } from './store'
import { useEffect } from 'react'

const Feed = lazy(() => import('./rooms/Feed').then(m => ({ default: m.Feed })))
const Admin = lazy(() => import('./rooms/Admin').then(m => ({ default: m.Admin })))
const Guestbook = lazy(() => import('./rooms/Guestbook').then(m => ({ default: m.Guestbook })))
const AskBox = lazy(() => import('./rooms/AskBox').then(m => ({ default: m.AskBox })))
const Links = lazy(() => import('./rooms/Links').then(m => ({ default: m.Links })))
const Stories = lazy(() => import('./rooms/Stories').then(m => ({ default: m.Stories })))
const SendDM = lazy(() => import('./rooms/SendDM').then(m => ({ default: m.SendDM })))
const InstagramGraveyard = lazy(() => import('./rooms/InstagramGraveyard').then(m => ({ default: m.InstagramGraveyard })))
const InstagramGraveyard3D = lazy(() => import('./rooms/InstagramGraveyard3D').then(m => ({ default: m.InstagramGraveyard3D })))

const ROOM_MAP: Record<string, number> = {
  '/': 0,
  '/listening': 1,
  '/thinking': 2,
  '/making': 3,
  '/dopamine-hit': 3,
  '/feed': 0,
  '/guestbook': 0,
  '/ask': 0,
  '/links': 0,
  '/stories': 0,
  '/dm': 0,
  '/admin': 0,
  '/graveyard/instagram': 0,
  '/graveyard/instagram/3d': 0,
}

export default function App() {
  const location = useLocation()
  const roomIndex = ROOM_MAP[location.pathname] ?? 0
  const { markVisited, incrementVisits } = useSpaceStore()

  useEffect(() => {
    incrementVisits()
  }, [])

  useEffect(() => {
    markVisited(location.pathname)
  }, [location.pathname])

  return (
    <>
      <WebGLBackground roomIndex={roomIndex} />
      <AnimatePresence mode="wait">
        <Suspense fallback={null}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
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
            <Route path="/graveyard/instagram" element={<InstagramGraveyard3D />} />
            <Route path="/graveyard/instagram/2d" element={<InstagramGraveyard />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  )
}
