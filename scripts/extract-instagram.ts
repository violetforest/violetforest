import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'path'

const EXPORT_DIR = '/Users/violetforest/Documents/instagram-violetforest.js-2026-01-25-gEBhWaBv'
const OUT_DIR = join(process.cwd(), 'public', 'graveyard', 'ig')

// Create output directories
mkdirSync(join(OUT_DIR, 'photos'), { recursive: true })

// --- Parse login activity for metadata ---
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

const entries: LoginEntry[] = []
// Each entry starts with an h2 containing the ISO timestamp
const blocks = loginHtml.split('uiBoxWhite noborder')
for (const block of blocks) {
  const tsMatch = block.match(/_a6-i">([\d\-T:+]+)</)
  if (!tsMatch) continue

  const extract = (label: string) => {
    const re = new RegExp(label + '<div><div>([^<]*)</div></div>')
    const m = block.match(re)
    return m ? m[1] : ''
  }

  entries.push({
    timestamp: tsMatch[1],
    cookie: extract('Cookie Name'),
    ip: extract('IP Address'),
    port: extract('Port'),
    language: extract('Language Code'),
    userAgent: extract('User Agent'),
  })
}

console.log(`Extracted ${entries.length} login entries`)

// --- Collect post images ---
const postsDir = join(EXPORT_DIR, 'media/posts')
const images: string[] = []

for (const folder of readdirSync(postsDir)) {
  const folderPath = join(postsDir, folder)
  if (!statSync(folderPath).isDirectory()) continue
  for (const file of readdirSync(folderPath)) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
      images.push(join(folder, file))
    }
  }
}

// Sort by folder name (date-based)
images.sort()
console.log(`Found ${images.length} post images`)

// --- Copy images ---
for (const img of images) {
  const src = join(postsDir, img)
  const destName = img.replace('/', '_')
  copyFileSync(src, join(OUT_DIR, 'photos', destName))
}
console.log(`Copied ${images.length} images to ${join(OUT_DIR, 'photos')}`)

// --- Parse advertisers ---
const adsHtml = readFileSync(
  join(EXPORT_DIR, 'ads_information/instagram_ads_and_businesses/advertisers_using_your_activity_or_information.html'),
  'utf-8'
)
const advertiserMatches = adsHtml.match(/_a6-o">[^<]+</g) || []
const advertisers = advertiserMatches.map(m => m.replace('_a6-o">', '').replace('<', ''))
console.log(`Found ${advertisers.length} advertisers`)

// --- Build output data ---
const data = {
  logins: entries,
  images: images.map(img => img.replace('/', '_')),
  advertisers,
  stats: {
    totalLogins: entries.length,
    totalImages: images.length,
    totalAdvertisers: advertisers.length,
    uniqueIPs: [...new Set(entries.map(e => e.ip))].length,
    uniqueUserAgents: [...new Set(entries.map(e => e.userAgent))].length,
    firstLogin: entries[entries.length - 1]?.timestamp,
    lastLogin: entries[0]?.timestamp,
  }
}

writeFileSync(join(OUT_DIR, 'data.json'), JSON.stringify(data, null, 2))
console.log(`Data written to ${join(OUT_DIR, 'data.json')}`)
