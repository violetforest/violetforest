import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

const SOUNDCLOUD_USER = 'hypermiami'

// Scraped client IDs are kept in module scope so warm isolates skip re-scraping.
let cachedClientId: string | null = null

async function scrapeClientId(): Promise<string> {
  const home = await fetch('https://soundcloud.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!home.ok) throw new Error(`SC homepage fetch failed: ${home.status}`)
  const html = await home.text()
  const scriptUrls = [...html.matchAll(/<script[^>]+src="(https:\/\/[^"]+\.js)"/g)].map((m) => m[1])
  for (const url of scriptUrls) {
    const res = await fetch(url)
    if (!res.ok) continue
    const text = await res.text()
    const match = text.match(/client_id\s*:\s*"([a-zA-Z0-9]{32})"/)
    if (match) return match[1]
  }
  throw new Error('Could not find SoundCloud client_id in any script bundle')
}

async function getClientId(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    if (cachedClientId) return cachedClientId
    const envId = Deno.env.get('SOUNDCLOUD_CLIENT_ID')
    if (envId) return envId
  }
  cachedClientId = await scrapeClientId()
  return cachedClientId
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let clientId = await getClientId()

    // Resolve user; if the cached/env ID is stale, scrape a fresh one and retry once.
    const resolveOnce = (id: string) =>
      fetch(`https://api-v2.soundcloud.com/resolve?url=https://soundcloud.com/${SOUNDCLOUD_USER}&client_id=${id}`)
    let userRes = await resolveOnce(clientId)
    if (userRes.status === 401 || userRes.status === 403) {
      clientId = await getClientId(true)
      userRes = await resolveOnce(clientId)
    }
    if (!userRes.ok) throw new Error(`Resolve failed: ${userRes.status}`)
    const user = await userRes.json()

    // Fetch likes
    const likesUrl = `https://api-v2.soundcloud.com/users/${user.id}/likes?client_id=${clientId}&limit=50&offset=0`
    const likesRes = await fetch(likesUrl)
    if (!likesRes.ok) throw new Error(`Likes fetch failed: ${likesRes.status}`)
    const likesData = await likesRes.json()

    const tracks = (likesData.collection || [])
      .filter((item: any) => item.track)
      .map((item: any) => {
        const t = item.track
        return {
          title: t.title,
          artist: t.user?.username || 'Unknown',
          artwork_url: (t.artwork_url || t.user?.avatar_url)?.replace('-large', '-t300x300') || null,
          permalink_url: t.permalink_url,
          duration: t.duration,
        }
      })

    return new Response(JSON.stringify(tracks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
