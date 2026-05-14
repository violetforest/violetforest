import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const EXPORT_DIR = '/Users/violetforest/Documents/instagram-violetforest.js-2026-01-25-gEBhWaBv'
const DATA_PATH = join(process.cwd(), 'public', 'graveyard', 'ig', 'data.json')

interface MediaItem {
  name: string
  type: 'image' | 'video'
  url: string
}

interface Post {
  folder: string
  date: string
  caption: string
  media: MediaItem[]
}

const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
const allMedia: MediaItem[] = data.media

// Build a quick lookup: "posts/202408/HASH.jpg" → MediaItem
const byPath = new Map<string, MediaItem>()
for (const m of allMedia) {
  // name format: posts_202408_18336567529192280.jpg
  const parts = m.name.split('_')
  if (parts.length < 3) continue
  const prefix = parts[0] // posts | reels
  const folder = parts[1] // 202408
  const file = parts.slice(2).join('_') // HASH.jpg
  byPath.set(`${prefix}/${folder}/${file}`, m)
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#064;/g, '@')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
}

function parseDate(s: string): { iso: string; folder: string } {
  // e.g. "Aug 28, 2024 3:22 pm"
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  }
  const m = s.match(/(\w{3}) (\d+), (\d{4})\s+(\d+):(\d+)\s*(am|pm)/i)
  if (!m) return { iso: '0000-00-00', folder: '000000' }
  const [, mon, day, year, h, min, ap] = m
  let hour = parseInt(h)
  if (ap.toLowerCase() === 'pm' && hour < 12) hour += 12
  if (ap.toLowerCase() === 'am' && hour === 12) hour = 0
  const mm = months[mon]
  return {
    iso: `${year}-${mm}-${day.padStart(2, '0')}T${String(hour).padStart(2, '0')}:${min.padStart(2, '0')}:00`,
    folder: `${year}${mm}`,
  }
}

function parseFile(html: string, defaultPrefix: 'posts' | 'reels'): Post[] {
  const posts: Post[] = []
  // Split on the post marker. Some posts have NESTED markers inside their
  // Interest Topics metadata (e.g. "Digital Art" nested boxes), so a single
  // outer post can span multiple chunks: the first chunk has media+caption,
  // intermediate chunks have nested-topic fragments, and the date appears
  // in a later chunk.
  //
  // Strategy: accumulate media+caption across chunks until we hit a chunk
  // that contains a date, then emit one post.
  const chunks = html.split('pam _3-95 _2ph- _a6-g uiBoxWhite noborder')

  let curMedia: MediaItem[] = []
  let curCaption = ''
  const seen = new Set<string>()

  const flush = (dateStr: string) => {
    if (curMedia.length === 0) return
    const { folder } = parseDate(dateStr)
    posts.push({
      folder: `${defaultPrefix}_${folder}`,
      date: folder !== '000000' ? `${folder.slice(0, 4)}-${folder.slice(4, 6)}` : '0000-00',
      caption: curCaption,
      media: curMedia,
    })
    curMedia = []
    curCaption = ''
    seen.clear()
  }

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]

    // Caption: only set if not already set for the current accumulating post,
    // and only if this chunk doesn't already belong to a previous post (i.e.
    // we haven't seen media yet).
    if (curMedia.length === 0) {
      const cap = chunk.match(/_a6-h _a6-i">([\s\S]*?)<\/h2>/)
      if (cap) curCaption = decodeEntities(cap[1]).trim()
    }

    // Collect media in this chunk
    const re = /(?:src|href)="media\/(posts|reels)\/(\d{6})\/([^"]+\.(?:jpg|jpeg|png|mp4))"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(chunk))) {
      const [, prefix, fld, file] = m
      const key = `${prefix}/${fld}/${file}`
      if (seen.has(key)) continue
      seen.add(key)
      if (file.endsWith('.srt')) continue
      const item = byPath.get(key)
      if (!item) continue
      curMedia.push(item)
    }

    // Date closes a post. The outermost date is the last _3-94 _a6-o in this chunk.
    const dateMatches = [...chunk.matchAll(/_3-94 _a6-o">([^<]+)</g)]
    if (dateMatches.length > 0) {
      flush(dateMatches[dateMatches.length - 1][1])
    }
  }

  // If anything left without a date (shouldn't happen in normal files), drop it
  return posts
}

const postsHtml = readFileSync(
  join(EXPORT_DIR, 'your_instagram_activity/media/posts_1.html'),
  'utf-8',
)
const reelsHtml = readFileSync(
  join(EXPORT_DIR, 'your_instagram_activity/media/reels.html'),
  'utf-8',
)

const parsedPosts = parseFile(postsHtml, 'posts')
const parsedReels = parseFile(reelsHtml, 'reels')

// Dedupe: a media item should only appear once. If a reel-post is also in posts_1,
// keep the first occurrence (posts_1 comes first).
const usedMedia = new Set<string>()
const deduped: Post[] = []
for (const p of [...parsedPosts, ...parsedReels]) {
  // Filter media items that haven't appeared yet
  const fresh = p.media.filter(m => !usedMedia.has(m.name))
  if (fresh.length === 0) continue
  fresh.forEach(m => usedMedia.add(m.name))
  deduped.push({ ...p, media: fresh })
}

// Sort by date descending (newest first)
deduped.sort((a, b) => b.date.localeCompare(a.date))

console.log(`Parsed ${parsedPosts.length} posts from posts_1.html`)
console.log(`Parsed ${parsedReels.length} posts from reels.html`)
console.log(`After dedup: ${deduped.length} posts`)
console.log(`Total media referenced: ${[...usedMedia].length} / ${allMedia.length} uploaded`)
console.log(`Carousel size distribution:`)
const sizes: Record<number, number> = {}
deduped.forEach(p => { sizes[p.media.length] = (sizes[p.media.length] || 0) + 1 })
Object.keys(sizes).sort((a, b) => +a - +b).forEach(k => console.log(`  ${k} item${k === '1' ? '' : 's'}: ${sizes[+k]} posts`))

// Write out
data.posts = deduped
writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
console.log(`Wrote ${DATA_PATH}`)
