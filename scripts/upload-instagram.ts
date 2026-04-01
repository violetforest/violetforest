import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
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

// --- Parse login activity ---
const loginHtml = readFileSync(
  join(EXPORT_DIR, 'security_and_login_information/login_and_profile_creation/login_activity.html'),
  'utf-8'
)

interface LoginEntry {
  timestamp: string
  cookie: string
  ip: string
  port: string
  language: string
  userAgent: string
}

const logins: LoginEntry[] = []
const blocks = loginHtml.split('uiBoxWhite noborder')
for (const block of blocks) {
  const tsMatch = block.match(/_a6-i">([\d\-T:+]+)</)
  if (!tsMatch) continue
  const extract = (label: string) => {
    const re = new RegExp(label + '<div><div>([^<]*)</div></div>')
    const m = block.match(re)
    return m ? m[1] : ''
  }
  logins.push({
    timestamp: tsMatch[1],
    cookie: extract('Cookie Name'),
    ip: extract('IP Address'),
    port: extract('Port'),
    language: extract('Language Code'),
    userAgent: extract('User Agent'),
  })
}
console.log(`Extracted ${logins.length} login entries`)

// --- Collect all media (images + videos) ---
const postsDir = join(EXPORT_DIR, 'media/posts')
const mediaFiles: { path: string; name: string; type: 'image' | 'video' }[] = []

for (const folder of readdirSync(postsDir)) {
  const folderPath = join(postsDir, folder)
  if (!statSync(folderPath).isDirectory()) continue
  for (const file of readdirSync(folderPath)) {
    const ext = file.split('.').pop()?.toLowerCase()
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      mediaFiles.push({ path: join(folderPath, file), name: `${folder}_${file}`, type: 'image' })
    } else if (ext === 'mp4') {
      mediaFiles.push({ path: join(folderPath, file), name: `${folder}_${file}`, type: 'video' })
    }
  }
}
mediaFiles.sort((a, b) => a.name.localeCompare(b.name))
console.log(`Found ${mediaFiles.length} media files (${mediaFiles.filter(m => m.type === 'image').length} images, ${mediaFiles.filter(m => m.type === 'video').length} videos)`)

// --- Upload to Supabase ---
const uploaded: { name: string; type: 'image' | 'video'; url: string }[] = []

for (let i = 0; i < mediaFiles.length; i++) {
  const m = mediaFiles[i]
  const storagePath = `${PREFIX}/${m.name}`
  const contentType = m.type === 'video' ? 'video/mp4' : 'image/jpeg'
  const fileData = readFileSync(m.path)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileData, { contentType, upsert: true })

  if (error) {
    console.error(`Failed to upload ${m.name}: ${error.message}`)
    continue
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  uploaded.push({ name: m.name, type: m.type, url: data.publicUrl })

  if ((i + 1) % 10 === 0) {
    console.log(`Uploaded ${i + 1}/${mediaFiles.length}`)
  }
}
console.log(`Uploaded ${uploaded.length} files`)

// --- Build data.json ---
const data = {
  logins,
  media: uploaded,
  stats: {
    totalLogins: logins.length,
    totalMedia: uploaded.length,
    totalImages: uploaded.filter(m => m.type === 'image').length,
    totalVideos: uploaded.filter(m => m.type === 'video').length,
    uniqueIPs: [...new Set(logins.map(e => e.ip))].length,
    uniqueUserAgents: [...new Set(logins.map(e => e.userAgent))].length,
    firstLogin: logins[logins.length - 1]?.timestamp,
    lastLogin: logins[0]?.timestamp,
  }
}

const outPath = join(process.cwd(), 'public', 'graveyard', 'ig', 'data.json')
writeFileSync(outPath, JSON.stringify(data, null, 2))
console.log(`Data written to ${outPath}`)
console.log('Done! You can delete the local photos folder now.')
