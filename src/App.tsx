import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { WebGLBackground } from './components/WebGLBackground'
import { Home } from './rooms/Home'
import { Listening } from './rooms/Listening'
import { Thinking } from './rooms/Thinking'
import { Making } from './rooms/Making'
import { DopamineHit } from './rooms/DopamineHit'
import { useSpaceStore } from './store'
import { useEffect } from 'react'

const ROOM_MAP: Record<string, number> = {
  '/': 0,
  '/listening': 1,
  '/thinking': 2,
  '/making': 3,
  '/dopamine-hit': 3,
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
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/listening" element={<Listening />} />
          <Route path="/thinking" element={<Thinking />} />
          <Route path="/making" element={<Making />} />
          <Route path="/dopamine-hit" element={<DopamineHit />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
