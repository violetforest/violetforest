import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qbmglbnxkchwekatkrlr.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wdc8NjEgJqfmH52FCRnWsw_qBVYTpbC'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const SITE_URL = 'https://violetforest.com/violetforest'
const FEED_TITLE = "violet's space"
const FEED_DESCRIPTION = 'a personal website that replaces social media'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function generateRSS() {
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!posts || posts.length === 0) {
    console.log('No posts found, generating empty feed')
  }

  const items = (posts || []).map(post => {
    const title = post.type === 'quote'
      ? `"${(post.body || '').slice(0, 60)}..."`
      : post.type === 'link'
      ? post.link_url || 'link'
      : (post.body || '').slice(0, 60) || 'post'

    let description = ''
    if (post.image_url) {
      description += `<img src="${escapeXml(post.image_url)}" /><br/>`
    }
    if (post.body) {
      description += escapeXml(post.body)
    }
    if (post.link_url) {
      description += `<br/><a href="${escapeXml(post.link_url)}">${escapeXml(post.link_url)}</a>`
    }

    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${SITE_URL}/feed</link>
      <guid>${SITE_URL}/feed#${post.id}</guid>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`
  }).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  const outPath = join(process.cwd(), 'dist', 'feed.xml')
  writeFileSync(outPath, rss, 'utf-8')
  console.log(`RSS feed written to ${outPath} (${(posts || []).length} posts)`)
}

generateRSS().catch(console.error)
