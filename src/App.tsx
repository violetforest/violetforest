import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { NetArtIframe } from './components/NetArtIframe'
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
            <Route path="/webcore" element={<NetArtIframe src={`${import.meta.env.BASE_URL}webcore/index.html`} title="webcore" showNext={false} />} />
            <Route path="/scroll-spiral" element={<NetArtIframe src={`${import.meta.env.BASE_URL}scroll-spiral/index.html`} title="scroll-spiral" />} />
            <Route path="/sludge-flower" element={<NetArtIframe src={`${import.meta.env.BASE_URL}sludge-flower/index.html`} title="sludge-flower" />} />
            <Route path="/tones" element={<NetArtIframe src={`${import.meta.env.BASE_URL}tones/index.html`} title="tones" />} />
            <Route path="/myspace" element={
              <NetArtIframe
                src={`${import.meta.env.BASE_URL}myspace/index.html`}
                title="myspace"
                info={
                  <>
                    <div style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontStyle: 'italic', marginBottom: '0.4em' }}>
                      MySpace
                    </div>
                    <div style={{ fontSize: 'clamp(18px, 2vw, 22px)', opacity: 0.85 }}>
                      Violet Forest
                    </div>
                    <div style={{ fontSize: 'clamp(18px, 2vw, 22px)', opacity: 0.85, marginBottom: '1.2em' }}>
                      2019
                    </div>
                    <p style={{ fontSize: 'clamp(15px, 1.6vw, 18px)', opacity: 0.85, marginBottom: '0.6em' }}>
                      Shown at <em>Make Believe</em>, BOM Birmingham, 7 June – 31 August 2019.
                    </p>
                    <p style={{ fontSize: 'clamp(13px, 1.4vw, 16px)', opacity: 0.6 }}>
                      A summer exhibition of four artists working at the intersection
                      of art, AI and machine learning — Gene Kogan, Violet Forest,
                      Will Pappenheimer and Sofia Crespo.
                    </p>
                  </>
                }
              />
            } />
            <Route path="/flower-mirror" element={<NetArtIframe src={`${import.meta.env.BASE_URL}flower-mirror/index.html`} title="flower-mirror" />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  )
}
