import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const EXPORT_DIR = '/Users/violetforest/Documents/instagram-violetforest.js-2026-01-25-gEBhWaBv'
const DATA_PATH = join(process.cwd(), 'public', 'graveyard', 'ig', 'data.json')
const SUPABASE_PREFIX = 'https://qbmglbnxkchwekatkrlr.supabase.co/storage/v1/object/public/media/graveyard/ig'

interface Story {
  name: string
  type: 'image' | 'video'
  url: string
  date: string // ISO-ish: 2024-08-28T15:22:00
  folder: string // 202408
}

function parseDate(s: string): { iso: string; folder: string } {
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  }
  const m = s.match(/(\w{3}) (\d+), (\d{4})\s+(\d+):(\d+)\s*(am|pm)/i)
  if (!m) return { iso: '0000-00-00T00:00:00', folder: '000000' }
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

const html = readFileSync(join(EXPORT_DIR, 'your_instagram_activity/media/stories.html'), 'utf-8')
const chunks = html.split('pam _3-95 _2ph- _a6-g uiBoxWhite noborder')

const stories: Story[] = []
let curMedia: { name: string; type: 'image' | 'video'; folder: string; file: string } | null = null

for (let i = 1; i < chunks.length; i++) {
  const chunk = chunks[i]

  // Each story has exactly one media item (img or video) in media/stories/YYYYMM/FILE
  if (!curMedia) {
    const m = chunk.match(/(?:src|href)="media\/stories\/(\d{6})\/([^"]+\.(?:jpg|jpeg|png|mp4))"/)
    if (m) {
      const [, folder, file] = m
      const ext = file.split('.').pop()!.toLowerCase()
      const type: 'image' | 'video' = ext === 'mp4' ? 'video' : 'image'
      curMedia = { name: `stories_${folder}_${file}`, type, folder, file }
    }
  }

  // Date closes the story
  const dateMatches = [...chunk.matchAll(/_3-94 _a6-o">([^<]+)</g)]
  if (dateMatches.length > 0 && curMedia) {
    const { iso, folder: dateFolder } = parseDate(dateMatches[dateMatches.length - 1][1])
    stories.push({
      name: curMedia.name,
      type: curMedia.type,
      url: `${SUPABASE_PREFIX}/${curMedia.name}`,
      date: iso,
      folder: dateFolder,
    })
    curMedia = null
  }
}

stories.sort((a, b) => b.date.localeCompare(a.date))

const byYear: Record<string, number> = {}
stories.forEach(s => {
  const y = s.date.slice(0, 4)
  byYear[y] = (byYear[y] || 0) + 1
})

console.log(`Parsed ${stories.length} stories`)
console.log(`Date range: ${stories[stories.length - 1]?.date.slice(0, 10)} → ${stories[0]?.date.slice(0, 10)}`)
console.log('Stories by year:')
Object.keys(byYear).sort((a, b) => b.localeCompare(a)).forEach(y => console.log(`  ${y}: ${byYear[y]}`))

const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
data.stories = stories
writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
console.log(`Wrote ${stories.length} stories to ${DATA_PATH}`)
console.log('')
console.log('NOTE: story media is not uploaded to Supabase yet. Run upload-stories.ts')
console.log('with SUPABASE_SERVICE_KEY set to populate the URLs.')
