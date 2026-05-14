import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

interface MediaItem {
  name: string
  type: 'image' | 'video'
  url: string
}

interface Post {
  folder: string
  date: string
  media: MediaItem[]
}

interface Story {
  name: string
  type: 'image' | 'video'
  url: string
  date: string // ISO-ish
  folder: string // YYYYMM
}

interface GraveyardData {
  posts: Post[]
  stories?: Story[]
}

const base = import.meta.env.BASE_URL

const AVATAR = `${base}graveyard/ig/avatar.jpg`
const USERNAME = 'violetforest.js'
const NAME = 'Violet Forest'
const BIO = '└  ｡ₓˑ༺ʚ♡ɞ༻ˑₓ｡ ̶̶̷̸̲̱❉҈҉҈҉҈҇'
const WEBSITE = 'violetforest.com'
const FOLLOWERS = 2369
const FOLLOWING = 3028

const STYLES = `
  .igexe, .igexe *, .igexe *:before, .igexe *:after {
    box-sizing: border-box;
    cursor: default;
    user-select: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
  }
  .igexe a[href], .igexe button { cursor: pointer; }
  .igexe *:focus { outline: none !important; }

  .igexe-stage {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    color: #d4c1ff;
    font-family: Tahoma, Helvetica, Arial, sans-serif;
    font-size: 11px;
    line-height: 11px;
    overflow: hidden;
  }

  .igexe-window {
    width: 100%;
    max-width: 380px;
    height: 100%;
    padding: 1px;
    box-shadow:
      inset -1px -1px 0 0 #8844ff,
      inset 1px 1px 0 0 #8844ff,
      0 0 16px rgba(136, 68, 255, 0.45);
    display: flex;
    flex-direction: column;
    background: #000;
  }
  @media (min-height: 720px) {
    .igexe-window { max-height: 700px; }
  }
  .igexe-inner {
    width: 100%;
    height: 100%;
    box-shadow:
      inset -1px -1px 0 0 #3a1188,
      inset 1px 1px 0 0 #b599ff;
    background: #0a0418;
    padding: 3px;
    display: flex;
    flex-direction: column;
  }

  .igexe-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 18px;
    padding: 2px;
    background: linear-gradient(180deg, #8844ff 0%, #5522aa 100%);
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 6px rgba(136, 68, 255, 0.6);
    text-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
  }
  .igexe-bar h1 {
    padding: 0 0 1px 3px;
    font-weight: 700;
    font-size: 11px;
    margin: 0;
    letter-spacing: 0.05em;
  }
  .igexe-bar .buttons { display: flex; }
  .igexe-bar .buttons a {
    color: #8844ff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-left: 2px;
    width: 14px;
    height: 14px;
    padding: 0 0 10px;
    border: 0;
    background: #0a0418;
    box-shadow:
      inset -1px -1px 0 0 #8844ff,
      inset 1px 1px 0 0 #8844ff;
    text-decoration: none;
  }
  .igexe-bar .buttons .minimize:after {
    content: ""; display: block; position: absolute;
    bottom: 3px; left: 4px; width: 6px; height: 2px; background: #8844ff;
    box-shadow: 0 0 3px #8844ff;
  }
  .igexe-bar .buttons .maximize:after {
    content: ""; display: block; position: absolute;
    top: 3px; left: 3px; width: 8px; height: 8px;
    border: 1px solid #8844ff; border-top-width: 2px;
    box-shadow: 0 0 3px rgba(136, 68, 255, 0.7);
  }
  .igexe-bar .buttons .close:before, .igexe-bar .buttons .close:after {
    transform-origin: center center;
    content: ""; display: block; position: absolute;
    top: 50%; left: 50%; margin-top: -4px; margin-left: -1px;
    width: 2px; height: 8px; background: #8844ff;
    box-shadow: 0 0 3px #8844ff;
  }
  .igexe-bar .buttons .close:before { transform: rotate(-45deg); }
  .igexe-bar .buttons .close:after { transform: rotate(45deg); }

  .igexe-menu { flex-shrink: 0; }
  .igexe-menu ul {
    display: flex;
    padding: 1px 0;
    margin: 0;
    list-style: none;
  }
  .igexe-menu a {
    display: block;
    padding: 4px 6px 5px;
    color: #d4c1ff;
    text-decoration: none;
  }
  .igexe-menu a:first-letter { text-decoration: underline; }
  .igexe-menu a:active { background: #8844ff; color: #000; }

  .igexe-container {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .igexe-content {
    flex: 1;
    min-height: 0;
    position: relative;
  }
  .igexe-section {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
  }

  .igexe-tabs {
    display: flex;
    height: 22px;
    flex-shrink: 0;
  }
  .igexe-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 1px;
    background: #0a0418;
    color: #d4c1ff;
    border: 0;
    height: 22px;
    margin-right: 1px;
    box-shadow:
      inset -1px -1px 0 0 #8844ff,
      inset 1px 1px 0 0 #8844ff;
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  .igexe-tab:last-child { margin-right: 0; }
  .igexe-tab:first-letter { text-decoration: underline; }
  .igexe-tab[disabled] {
    cursor: default;
    color: #554477;
    box-shadow:
      inset -1px -1px 0 0 #221a44,
      inset 1px 1px 0 0 #221a44;
  }
  .igexe-tab.active {
    background: #1a1144;
    color: #fff;
    box-shadow:
      inset -1px -1px 0 0 #b599ff,
      inset 1px 1px 0 0 #b599ff,
      0 0 8px rgba(136, 68, 255, 0.5);
    text-shadow: 0 0 4px rgba(181, 153, 255, 0.7);
  }

  .igexe-feed {
    padding: 2px;
    flex: 1;
    min-height: 0;
    box-shadow:
      inset -1px -1px 0 0 #8844ff,
      inset 1px 1px 0 0 #3a1188;
    background: #000;
  }
  .igexe-scroll {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .igexe-profile-header {
    padding: 6px 4px 0;
    background: #000;
  }
  .igexe-profile-header h2 {
    padding: 6px 0 8px;
    font-weight: 700;
    font-size: 12px;
    line-height: 12px;
    text-align: center;
    margin: 0;
  }
  .igexe-profile-header h2 a {
    text-decoration: none;
    color: #fff;
    text-shadow: 0 0 6px rgba(136, 68, 255, 0.7);
  }
  .igexe-hr {
    border: 0;
    border-top: 1px solid #8844ff;
    margin: 0;
    width: 100%;
    box-shadow: 0 0 4px rgba(136, 68, 255, 0.5);
  }
  .igexe-info {
    display: flex;
    flex-flow: row wrap;
    padding: 6px 4px;
  }
  .igexe-avatar-big {
    width: 60px;
    height: 60px;
    margin-right: 6px;
    overflow: hidden;
  }
  .igexe-avatar-big img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .igexe-stats {
    display: flex;
    flex-flow: row wrap;
    align-content: space-between;
    width: calc(100% - 66px);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .igexe-stats li {
    width: calc(100% / 3);
    text-align: center;
  }
  .igexe-stats li strong, .igexe-stats li span {
    display: block;
    line-height: 1.2;
  }
  .igexe-stats li strong { font-weight: 700; font-size: 14px; color: #fff; }
  .igexe-stats li span { color: #9988cc; }
  .igexe-stats li.follow-row {
    display: flex;
    width: 100%;
    margin-top: 4px;
  }
  .igexe-btn {
    height: 22px;
    border: 0;
    padding: 0 6px 1px;
    background: #0a0418;
    box-shadow:
      inset -1px -1px 0 0 #8844ff,
      inset 1px 1px 0 0 #8844ff;
    color: #d4c1ff;
    font-family: inherit;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .igexe-btn:hover {
    background: #1a1144;
    box-shadow:
      inset -1px -1px 0 0 #b599ff,
      inset 1px 1px 0 0 #b599ff,
      0 0 6px rgba(136, 68, 255, 0.5);
    color: #fff;
  }
  .igexe-btn:active {
    background: #0a0418;
    box-shadow:
      inset 1px 1px 0 0 #3a1188,
      inset -1px -1px 0 0 #b599ff;
  }
  .igexe-btn.wide { width: 100%; }
  .igexe-btn.menu-arrow {
    position: relative;
    width: 22px;
    margin-left: 2px;
  }
  .igexe-btn.menu-arrow:after {
    content: "▼";
    font-size: 8px;
    color: #8844ff;
  }
  .igexe-desc {
    width: 100%;
    padding: 4px 0;
    color: #d4c1ff;
  }
  .igexe-desc p {
    padding: 2px 0;
    line-height: 1.3;
    margin: 0;
  }
  .igexe-desc a {
    color: #fff;
    font-weight: 700;
    text-decoration: none;
    text-shadow: 0 0 4px rgba(136, 68, 255, 0.6);
  }

  /* Profile grid (3 columns) */
  .igexe-grid {
    display: flex;
    flex-flow: row wrap;
    padding: 1px;
    gap: 1px;
    background: #000;
  }
  .igexe-grid > .igexe-cell {
    width: calc(33.333% - 1px);
    display: block;
    border: 1px solid #221655;
    position: relative;
    background: #000;
  }
  .igexe-grid > .igexe-cell:hover {
    border: 1px solid #8844ff;
    box-shadow: 0 0 8px rgba(136, 68, 255, 0.6);
    z-index: 1;
  }
  .igexe-grid > .igexe-cell:active {
    border: 1px dotted #b599ff;
  }
  .igexe-grid > .igexe-cell .igexe-thumb {
    display: block;
    position: relative;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: 100%;
  }
  .igexe-grid img, .igexe-grid video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .igexe-grid .igexe-multi {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    font-size: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Tahoma, sans-serif;
    border: 1px solid #8844ff;
    box-shadow: 0 0 4px rgba(136, 68, 255, 0.7);
  }
  .igexe-grid .igexe-vid-badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
    color: #8844ff;
    font-size: 10px;
    text-shadow: 0 0 4px rgba(136, 68, 255, 0.9);
  }

  /* Home feed (figure style) */
  .igexe-home figure {
    padding: 2px;
    margin: 0 0 22px;
  }
  .igexe-home figure:last-child { margin-bottom: 0; }
  .igexe-home figure header {
    display: flex;
    align-items: center;
    padding: 4px 4px 6px;
  }
  .igexe-home figure header .av {
    width: 32px;
    height: 32px;
    overflow: hidden;
    margin-right: 8px;
    border: 1px solid #8844ff;
    box-shadow: 0 0 4px rgba(136, 68, 255, 0.5);
  }
  .igexe-home figure header .av img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .igexe-home figure header .name {
    display: block;
    font-size: 12px;
    line-height: 12px;
    color: #fff;
    font-weight: 700;
    text-decoration: none;
    text-shadow: 0 0 4px rgba(136, 68, 255, 0.6);
  }
  .igexe-home figure .media {
    width: 100%;
    background: #000;
    border: 1px solid #221655;
  }
  .igexe-home figure .media img, .igexe-home figure .media video {
    display: block;
    width: 100%;
  }
  .igexe-home figcaption {
    padding: 3px 1px;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
  }
  .igexe-home figcaption > .row {
    padding: 3px;
    display: flex;
  }
  .igexe-home figcaption .row button {
    margin: 0 6px 0 0;
  }
  .igexe-home figcaption time {
    display: block;
    width: 100%;
    padding: 3px;
    color: #9988cc;
    font-size: 9px;
    line-height: 9px;
    text-transform: uppercase;
  }

  /* Scrollbar (Win95 chunky) */
  .igexe-scroll::-webkit-scrollbar { width: 14px; height: 14px; }
  .igexe-scroll::-webkit-scrollbar-track {
    background: #000;
    border-left: 1px solid #221655;
  }
  .igexe-scroll::-webkit-scrollbar-thumb {
    box-shadow:
      inset -1px -1px 0 0 #8844ff,
      inset 1px 1px 0 0 #8844ff;
    background-color: #1a1144;
  }
  .igexe-scroll::-webkit-scrollbar-thumb:hover {
    background-color: #2a0050;
    box-shadow:
      inset -1px -1px 0 0 #b599ff,
      inset 1px 1px 0 0 #b599ff;
  }
  .igexe-scroll::-webkit-scrollbar-corner { background-color: #000; }

  /* Modal */
  .igexe-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .igexe-modal-inner {
    max-width: 95vw;
    max-height: 95vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .igexe-modal-media {
    max-width: 95vw;
    max-height: 78vh;
    display: block;
  }
  .igexe-modal-nav {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    align-items: center;
  }
  .igexe-modal-nav .igexe-btn { min-width: 60px; }
  .igexe-modal-nav .count {
    color: rgba(255,255,255,0.6);
    font-family: Tahoma, sans-serif;
    font-size: 11px;
    padding: 0 6px;
  }
  .igexe-modal-date {
    color: rgba(255,255,255,0.5);
    font-family: Tahoma, sans-serif;
    font-size: 11px;
    margin-top: 6px;
  }

  /* Stories — single column, year-grouped */
  .igexe-stories {
    padding: 2px 0;
  }
  .igexe-year-header {
    position: sticky;
    top: 0;
    background: #1a1144;
    color: #fff;
    padding: 4px 8px;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.1em;
    border-bottom: 1px solid #8844ff;
    border-top: 1px solid #8844ff;
    box-shadow: 0 0 6px rgba(136, 68, 255, 0.5);
    text-shadow: 0 0 4px rgba(181, 153, 255, 0.7);
    z-index: 2;
  }
  .igexe-year-header .count {
    float: right;
    color: #b599ff;
    font-weight: 400;
  }
  .igexe-story-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-bottom: 1px solid #221655;
    cursor: pointer;
    background: #000;
  }
  .igexe-story-row:hover {
    background: #1a1144;
    box-shadow: inset 0 0 8px rgba(136, 68, 255, 0.4);
  }
  .igexe-story-thumb {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    background: #0a0418;
    border: 1px solid #221655;
    position: relative;
    overflow: hidden;
  }
  .igexe-story-row:hover .igexe-story-thumb {
    border-color: #8844ff;
  }
  .igexe-story-thumb img, .igexe-story-thumb video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .igexe-story-thumb .vid-tag {
    position: absolute;
    bottom: 1px;
    right: 2px;
    font-size: 8px;
    color: #8844ff;
    text-shadow: 0 0 3px rgba(136, 68, 255, 0.9);
  }
  .igexe-story-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .igexe-story-date {
    color: #d4c1ff;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
  }
  .igexe-story-time {
    color: #9988cc;
    font-size: 9px;
    font-family: 'Courier New', monospace;
  }
  .igexe-story-type {
    color: #8844ff;
    font-size: 9px;
    padding-left: 4px;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* Home link */
  .igexe-home-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 50;
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 12px;
    color: #8844ff;
    opacity: 0.7;
    text-decoration: none;
    text-shadow: 0 0 4px rgba(136, 68, 255, 0.6);
  }
  .igexe-home-link:hover { opacity: 1; }
`

function Thumb({ post }: { post: Post }) {
  const first = post.media[0]
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { rootMargin: '300px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="igexe-thumb">
      {!loaded && <div style={{ position: 'absolute', inset: 0, background: '#0a0418' }} />}
      {inView && (first.type === 'video' ? (
        <video
          src={first.url + '#t=0.1'}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s' }}
        />
      ) : (
        <img
          src={first.url}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s' }}
        />
      ))}
      {post.media.length > 1 && <div className="igexe-multi">{post.media.length}</div>}
      {first.type === 'video' && post.media.length === 1 && <div className="igexe-vid-badge">▶</div>}
    </div>
  )
}

function FeedItem({ post }: { post: Post }) {
  const first = post.media[0]
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { rootMargin: '600px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const dateLabel = useMemo(() => {
    const [y, m] = post.date.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(m) - 1]} ${y}`
  }, [post.date])

  return (
    <figure ref={ref}>
      <header>
        <a className="av" href="#">
          <img src={AVATAR} alt={USERNAME} />
        </a>
        <a className="name" href="#">{USERNAME}</a>
      </header>
      <div className="media">
        {inView && (first.type === 'video' ? (
          <video
            src={first.url}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s' }}
          />
        ) : (
          <img
            src={first.url}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s' }}
          />
        ))}
      </div>
      <figcaption>
        <div className="row">
          <button className="igexe-btn">Like</button>
          <button className="igexe-btn">Comment</button>
          <button className="igexe-btn">Share</button>
        </div>
        <div className="row">
          <button className="igexe-btn">Bookmark</button>
        </div>
        <time>{dateLabel}</time>
      </figcaption>
    </figure>
  )
}

function StoryThumb({ story }: { story: Story }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { rootMargin: '400px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="igexe-story-thumb">
      {inView && !errored && (story.type === 'video' ? (
        <video
          src={story.url + '#t=0.1'}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
          onError={() => setErrored(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        />
      ) : (
        <img
          src={story.url}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        />
      ))}
      {story.type === 'video' && <div className="vid-tag">▶</div>}
    </div>
  )
}

function formatStoryDate(iso: string): { date: string; time: string } {
  // 2024-08-28T15:22:00 → { date: "08·28·2024", time: "3:22 PM" }
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return { date: iso, time: '' }
  const [, y, mo, d, h, mi] = m
  const hour = parseInt(h)
  const ap = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return {
    date: `${mo}·${d}·${y}`,
    time: `${h12}:${mi} ${ap}`,
  }
}

function StoriesView({ stories, onOpen }: { stories: Story[]; onOpen: (s: Story) => void }) {
  // Group by year, descending
  const byYear = useMemo(() => {
    const groups: Record<string, Story[]> = {}
    for (const s of stories) {
      const y = s.date.slice(0, 4)
      if (!groups[y]) groups[y] = []
      groups[y].push(s)
    }
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(y => ({ year: y, items: groups[y] }))
  }, [stories])

  if (stories.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9988cc', fontSize: '11px' }}>
        no stories yet
      </div>
    )
  }

  return (
    <div className="igexe-stories">
      {byYear.map(({ year, items }) => (
        <div key={year}>
          <div className="igexe-year-header">
            {year}
            <span className="count">{items.length} {items.length === 1 ? 'story' : 'stories'}</span>
          </div>
          {items.map((s, i) => {
            const { date, time } = formatStoryDate(s.date)
            return (
              <div
                key={s.name + i}
                className="igexe-story-row"
                onClick={() => onOpen(s)}
              >
                <StoryThumb story={s} />
                <div className="igexe-story-meta">
                  <span className="igexe-story-date">{date}</span>
                  <span className="igexe-story-time">{time}</span>
                </div>
                <span className="igexe-story-type">{s.type === 'video' ? 'reel' : 'photo'}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function StoryModal({ story, onClose }: { story: Story; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { date, time } = formatStoryDate(story.date)

  return (
    <div className="igexe-modal" onClick={onClose}>
      <div className="igexe-modal-inner" onClick={e => e.stopPropagation()}>
        {story.type === 'video' ? (
          <video src={story.url} controls autoPlay playsInline className="igexe-modal-media" />
        ) : (
          <img src={story.url} alt="" className="igexe-modal-media" />
        )}
        <div className="igexe-modal-date">{date} · {time}</div>
      </div>
    </div>
  )
}

function Modal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [i, setI] = useState(0)
  const item = post.media[i]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setI(v => (v - 1 + post.media.length) % post.media.length)
      if (e.key === 'ArrowRight') setI(v => (v + 1) % post.media.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [post.media.length, onClose])

  const dateLabel = useMemo(() => {
    const [y, m] = post.date.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(m) - 1]} ${y}`
  }, [post.date])

  return (
    <div className="igexe-modal" onClick={onClose}>
      <div className="igexe-modal-inner" onClick={e => e.stopPropagation()}>
        {item.type === 'video' ? (
          <video src={item.url} controls autoPlay playsInline className="igexe-modal-media" />
        ) : (
          <img src={item.url} alt="" className="igexe-modal-media" />
        )}
        {post.media.length > 1 && (
          <div className="igexe-modal-nav">
            <button className="igexe-btn" onClick={() => setI(v => (v - 1 + post.media.length) % post.media.length)}>
              prev
            </button>
            <span className="count">{i + 1} / {post.media.length}</span>
            <button className="igexe-btn" onClick={() => setI(v => (v + 1) % post.media.length)}>
              next
            </button>
          </div>
        )}
        <div className="igexe-modal-date">{dateLabel}</div>
      </div>
    </div>
  )
}

export function InstagramExe() {
  const [data, setData] = useState<GraveyardData | null>(null)
  const [tab, setTab] = useState<'home' | 'profile' | 'stories'>('profile')
  const [openPost, setOpenPost] = useState<Post | null>(null)
  const [openStory, setOpenStory] = useState<Story | null>(null)

  useEffect(() => {
    fetch(`${base}graveyard/ig/data.json`).then(r => r.json()).then(setData)
  }, [])

  const posts = data?.posts ?? []
  const stories = data?.stories ?? []
  const postCount = posts.length

  return (
    <div className="igexe">
      <style>{STYLES}</style>
      <Link to="/" className="igexe-home-link">home</Link>
      <div className="igexe-stage">
        <div className="igexe-window">
          <div className="igexe-inner">
            <header className="igexe-bar">
              <h1>Instagram.exe</h1>
              <div className="buttons">
                <a className="minimize" href="#" onClick={e => e.preventDefault()} />
                <a className="maximize" href="#" onClick={e => e.preventDefault()} />
                <a className="close" href="#" onClick={e => e.preventDefault()} />
              </div>
            </header>
            <nav className="igexe-menu">
              <ul>
                <li><a href="/" target="_top">Home</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); setTab('home') }}>Feed</a></li>
                <li><a href="https://violetforest.com" target="_blank" rel="noreferrer">Portfolio</a></li>
              </ul>
            </nav>
            <div className="igexe-container">
              <div className="igexe-content">
                {tab === 'home' && (
                  <div className="igexe-section">
                    <div className="igexe-feed" style={{ padding: 0 }}>
                      <iframe
                        src={`${base}feed`}
                        title="feed"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }}
                      />
                    </div>
                  </div>
                )}
                {tab === 'stories' && (
                  <div className="igexe-section">
                    <div className="igexe-feed">
                      <div className="igexe-scroll">
                        <StoriesView stories={stories} onOpen={setOpenStory} />
                      </div>
                    </div>
                  </div>
                )}
                {tab === 'profile' && (
                  <div className="igexe-section">
                    <div className="igexe-feed">
                      <div className="igexe-scroll">
                        <div className="igexe-profile-header">
                          <h2><a href="#">{USERNAME}</a></h2>
                          <hr className="igexe-hr" />
                          <div className="igexe-info">
                            <div className="igexe-avatar-big">
                              <img src={AVATAR} alt={USERNAME} />
                            </div>
                            <ul className="igexe-stats">
                              <li><strong>{postCount}</strong><span>posts</span></li>
                              <li><strong>{FOLLOWERS.toLocaleString()}</strong><span>followers</span></li>
                              <li><strong>{FOLLOWING.toLocaleString()}</strong><span>following</span></li>
                              <li className="follow-row">
                                <a
                                  className="igexe-btn wide"
                                  href={`https://instagram.com/${USERNAME}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ textDecoration: 'none' }}
                                >
                                  Follow
                                </a>
                                <button className="igexe-btn menu-arrow" />
                              </li>
                            </ul>
                            <div className="igexe-desc">
                              <p><a href="#">{NAME}</a></p>
                              <p>{BIO}</p>
                              <p>
                                <a href={`https://${WEBSITE}`} target="_blank" rel="noreferrer">{WEBSITE}</a>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="igexe-grid">
                          {posts.map((p, idx) => (
                            <a
                              key={p.folder + '-' + p.media[0].name + '-' + idx}
                              className="igexe-cell"
                              href="#"
                              onClick={e => { e.preventDefault(); setOpenPost(p) }}
                            >
                              <Thumb post={p} />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="igexe-tabs">
                <button
                  className={`igexe-tab ${tab === 'home' ? 'active' : ''}`}
                  onClick={() => setTab('home')}
                >
                  Home
                </button>
                <button className="igexe-tab" disabled>Explore</button>
                <button className="igexe-tab" disabled>Camera</button>
                <button className="igexe-tab" disabled>Stories</button>
                <button
                  className={`igexe-tab ${tab === 'profile' ? 'active' : ''}`}
                  onClick={() => setTab('profile')}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {openPost && <Modal post={openPost} onClose={() => setOpenPost(null)} />}
      {openStory && <StoryModal story={openStory} onClose={() => setOpenStory(null)} />}
    </div>
  )
}
