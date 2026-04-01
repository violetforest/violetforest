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

// Group media by date folder
const groups: Record<string, MediaItem[]> = {}
for (const item of data.media) {
  // name format: posts_201804_123456.jpg or reels_202201_123456.mp4
  const parts = item.name.split('_')
  const folder = `${parts[0]}_${parts[1]}` // e.g. "posts_201804"
  if (!groups[folder]) groups[folder] = []
  groups[folder].push(item)
}

// Convert to posts array, sorted by date (newest first)
const posts: Post[] = Object.entries(groups)
  .map(([folder, media]) => {
    const datePart = folder.split('_')[1] // e.g. "201804"
    const year = datePart.slice(0, 4)
    const month = datePart.slice(4, 6)
    return {
      folder,
      date: `${year}-${month}`,
      media,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

console.log(`Grouped ${data.media.length} media into ${posts.length} posts`)
posts.forEach(p => console.log(`  ${p.date}: ${p.media.length} items`))

// Write updated data
data.posts = posts
writeFileSync(dataPath, JSON.stringify(data, null, 2))
console.log('Updated data.json with grouped posts')
