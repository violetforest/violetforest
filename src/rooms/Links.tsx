import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'

interface AffiliateLink {
  id: string
  title: string
  url: string
  description: string | null
  category: string | null
  sort_order: number
}

export function Links() {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('affiliate_links')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setLinks(data || [])
        setLoading(false)
      })
  }, [])

  const grouped = links.reduce<Record<string, AffiliateLink[]>>((acc, link) => {
    const cat = link.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(link)
    return acc
  }, {})

  return (
    <ScrollableRoomLayout>
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <Link
            to="/"
            style={{ fontSize: '1.28rem', opacity: 0.5, fontFamily: 'Georgia, serif' }}
          >
            home
          </Link>
          <p style={{ fontSize: '1.2rem', fontStyle: 'italic', opacity: 0.55 }}>
            links
          </p>
          <div style={{ width: '2rem' }} />
        </div>

        {loading && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>loading...</p>
        )}

        {!loading && links.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>
            nothing here yet
          </p>
        )}

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <p
              style={{
                fontSize: '1.05rem',
                letterSpacing: '0.15em',
                textTransform: 'lowercase',
                opacity: 0.45,
                marginBottom: '0.75rem',
              }}
            >
              {category}
            </p>
            {items.map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <p style={{ fontSize: '1.43rem', opacity: 0.85 }}>{item.title}</p>
                {item.description && (
                  <p style={{ fontSize: '1.2rem', opacity: 0.5, marginTop: '0.25rem' }}>
                    {item.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        ))}
      </div>
    </ScrollableRoomLayout>
  )
}
