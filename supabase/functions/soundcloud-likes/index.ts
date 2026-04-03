import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

const SOUNDCLOUD_USER = 'hypermiami'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const clientId = Deno.env.get('SOUNDCLOUD_CLIENT_ID')
  if (!clientId) {
    return new Response(JSON.stringify({ error: 'Missing SoundCloud client ID' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Resolve user
    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=https://soundcloud.com/${SOUNDCLOUD_USER}&client_id=${clientId}`
    const userRes = await fetch(resolveUrl)
    if (!userRes.ok) throw new Error(`Resolve failed: ${userRes.status}`)
    const user = await userRes.json()

    // Fetch likes
    const likesUrl = `https://api-v2.soundcloud.com/users/${user.id}/likes?client_id=${clientId}&limit=10&offset=0`
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
