import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const dataPath = join(process.cwd(), 'public', 'graveyard', 'ig', 'data.json')
const data = JSON.parse(readFileSync(dataPath, 'utf-8'))

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

// Each media file is its own post, sorted newest first
const posts: Post[] = data.media.map((item: MediaItem) => {
  const parts = item.name.split('_')
  const datePart = parts[1] // e.g. "201804"
  const year = datePart.slice(0, 4)
  const month = datePart.slice(4, 6)
  return {
    folder: `${parts[0]}_${parts[1]}`,
    date: `${year}-${month}`,
    media: [item],
  }
}).sort((a: Post, b: Post) => {
  // sort by date descending, then by filename descending within same date
  if (a.date !== b.date) return b.date.localeCompare(a.date)
  return b.media[0].name.localeCompare(a.media[0].name)
})

console.log(`Grouped ${data.media.length} media into ${posts.length} posts`)
posts.forEach(p => console.log(`  ${p.date}: ${p.media.length} items`))

// Write updated data
data.posts = posts
writeFileSync(dataPath, JSON.stringify(data, null, 2))
console.log('Updated data.json with grouped posts')
