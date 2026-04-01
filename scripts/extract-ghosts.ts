import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const EXPORT_DIR = '/Users/violetforest/Documents/instagram-violetforest.js-2026-01-25-gEBhWaBv'
const OUT_DIR = join(process.cwd(), 'public', 'graveyard', 'ig')
mkdirSync(OUT_DIR, { recursive: true })

const ghosts: { text: string; type: string }[] = []

function extractDivText(html: string): string[] {
  const matches = html.match(/<div>([^<]+)<\/div>/g) || []
  return matches.map(m => m.replace(/<\/?div>/g, '').trim()).filter(t => t.length > 0)
}

function extractTableValues(html: string): string[] {
  const matches = html.match(/_a6_r">([^<]+)</) || []
  return matches ? Array.from(html.matchAll(/_a6_r">([^<]+)</g)).map(m => m[1].trim()) : []
}

// --- Login activity (IPs, user agents, cookies) ---
const loginHtml = readFileSync(join(EXPORT_DIR, 'security_and_login_information/login_and_profile_creation/login_activity.html'), 'utf-8')
const ips = [...new Set(Array.from(loginHtml.matchAll(/IP Address<div><div>([^<]*)<\/div>/g)).map(m => m[1]))]
ips.forEach(ip => ghosts.push({ text: ip, type: 'ip' }))

const agents = [...new Set(Array.from(loginHtml.matchAll(/User Agent<div><div>([^<]*)<\/div>/g)).map(m => m[1]))]
agents.forEach(ua => ghosts.push({ text: ua, type: 'user-agent' }))

const cookies = [...new Set(Array.from(loginHtml.matchAll(/Cookie Name<div><div>([^<]*)<\/div>/g)).map(m => m[1]))]
cookies.forEach(c => ghosts.push({ text: c, type: 'cookie' }))

console.log(`Logins: ${ips.length} IPs, ${agents.length} user agents, ${cookies.length} cookies`)

// --- Searches ---
try {
  const searchHtml = readFileSync(join(EXPORT_DIR, 'logged_information/recent_searches/word_or_phrase_searches.html'), 'utf-8')
  const searches = extractDivText(searchHtml).filter(t => !t.match(/^\d{4}/) && t.length > 1)
  searches.forEach(s => ghosts.push({ text: s, type: 'search' }))
  console.log(`Searches: ${searches.length}`)
} catch { console.log('No search data') }

try {
  const profileSearchHtml = readFileSync(join(EXPORT_DIR, 'logged_information/recent_searches/profile_searches.html'), 'utf-8')
  const profileSearches = extractDivText(profileSearchHtml).filter(t => !t.match(/^\d{4}/) && t.length > 1)
  profileSearches.forEach(s => ghosts.push({ text: s, type: 'search' }))
  console.log(`Profile searches: ${profileSearches.length}`)
} catch { console.log('No profile search data') }

// --- Advertisers ---
try {
  const adsHtml = readFileSync(join(EXPORT_DIR, 'ads_information/instagram_ads_and_businesses/advertisers_using_your_activity_or_information.html'), 'utf-8')
  const advertisers = extractDivText(adsHtml).filter(t => t.length > 2 && !t.includes('http'))
  advertisers.forEach(a => ghosts.push({ text: a, type: 'advertiser' }))
  console.log(`Advertisers: ${advertisers.length}`)
} catch { console.log('No advertiser data') }

// --- Ads viewed ---
try {
  const adsViewedHtml = readFileSync(join(EXPORT_DIR, 'ads_information/ads_and_topics/ads_viewed.html'), 'utf-8')
  const adsViewed = extractDivText(adsViewedHtml).filter(t => t.length > 2 && !t.includes('http')).slice(0, 100)
  adsViewed.forEach(a => ghosts.push({ text: a, type: 'ad' }))
  console.log(`Ads viewed: ${adsViewed.length}`)
} catch { console.log('No ads viewed data') }

// --- Synced contacts ---
try {
  const contactsHtml = readFileSync(join(EXPORT_DIR, 'connections/contacts/synced_contacts.html'), 'utf-8')
  const contacts = extractDivText(contactsHtml).filter(t => t.length > 1 && !t.includes('http'))
  contacts.forEach(c => ghosts.push({ text: c, type: 'contact' }))
  console.log(`Synced contacts: ${contacts.length}`)
} catch { console.log('No contacts data') }

// --- Following ---
try {
  const followingHtml = readFileSync(join(EXPORT_DIR, 'connections/followers_and_following/following.html'), 'utf-8')
  const following = extractDivText(followingHtml).filter(t => t.length > 1 && !t.includes('http'))
  following.forEach(f => ghosts.push({ text: f, type: 'following' }))
  console.log(`Following: ${following.length}`)
} catch { console.log('No following data') }

// --- Your comments ---
try {
  const commentsHtml = readFileSync(join(EXPORT_DIR, 'your_instagram_activity/comments/post_comments_1.html'), 'utf-8')
  const comments = extractDivText(commentsHtml).filter(t => t.length > 2 && !t.includes('http'))
  comments.forEach(c => ghosts.push({ text: c, type: 'comment' }))
  console.log(`Comments: ${comments.length}`)
} catch { console.log('No comment data') }

// --- Link history ---
try {
  const linksHtml = readFileSync(join(EXPORT_DIR, 'logged_information/link_history/link_history.html'), 'utf-8')
  const links = Array.from(linksHtml.matchAll(/href="([^"]+)"/g)).map(m => m[1]).filter(l => !l.includes('instagram.com')).slice(0, 50)
  links.forEach(l => ghosts.push({ text: l, type: 'link' }))
  console.log(`Links tracked: ${links.length}`)
} catch { console.log('No link history') }

console.log(`\nTotal ghosts: ${ghosts.length}`)

writeFileSync(join(OUT_DIR, 'ghosts.json'), JSON.stringify(ghosts, null, 2))
console.log(`Written to ${join(OUT_DIR, 'ghosts.json')}`)
