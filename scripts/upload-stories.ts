import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://qbmglbnxkchwekatkrlr.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseKey) {
  console.error('Set SUPABASE_SERVICE_KEY env var (from Supabase Settings → API → service_role key)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const EXPORT_DIR = '/Users/violetforest/Documents/instagram-violetforest.js-2026-01-25-gEBhWaBv'
const BUCKET = 'media'
const PREFIX = 'graveyard/ig'
const STORIES_DIR = join(EXPORT_DIR, 'media/stories')

const files: { path: string; name: string; type: 'image' | 'video' }[] = []
for (const folder of readdirSync(STORIES_DIR)) {
  const folderPath = join(STORIES_DIR, folder)
  if (!statSync(folderPath).isDirectory()) continue
  for (const file of readdirSync(folderPath)) {
    const ext = file.split('.').pop()?.toLowerCase()
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      files.push({ path: join(folderPath, file), name: `stories_${folder}_${file}`, type: 'image' })
    } else if (ext === 'mp4') {
      files.push({ path: join(folderPath, file), name: `stories_${folder}_${file}`, type: 'video' })
    }
  }
}
files.sort((a, b) => a.name.localeCompare(b.name))

const totalSize = files.reduce((sum, f) => sum + statSync(f.path).size, 0)
console.log(`Found ${files.length} story media files (${files.filter(m => m.type === 'image').length} images, ${files.filter(m => m.type === 'video').length} videos)`)
console.log(`Total size: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`)
console.log(`This will upload to ${BUCKET}/${PREFIX}/stories_*. Press Ctrl+C to cancel, otherwise upload starts in 5s...`)
await new Promise(r => setTimeout(r, 5000))

let ok = 0
let skipped = 0
for (let i = 0; i < files.length; i++) {
  const m = files[i]
  const storagePath = `${PREFIX}/${m.name}`
  const contentType = m.type === 'video' ? 'video/mp4' : 'image/jpeg'
  const fileData = readFileSync(m.path)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileData, { contentType, upsert: false })

  if (error) {
    // Skip if already exists (upsert:false), warn otherwise
    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      skipped++
    } else {
      console.error(`Failed ${m.name}: ${error.message}`)
      continue
    }
  } else {
    ok++
  }

  if ((i + 1) % 50 === 0) {
    console.log(`Progress: ${i + 1}/${files.length}  (uploaded: ${ok}, skipped: ${skipped})`)
  }
}
console.log(`Done. Uploaded: ${ok}, skipped (already existed): ${skipped}`)
