import { Link } from 'react-router-dom'
import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'

interface Entry {
  id: string
  name: string | null
  message: string
  created_at: string
}

export function Guestbook() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    supabase
      .from('guestbook_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setEntries(data || []))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message) return
    setSubmitting(true)

    const { data } = await supabase
      .from('guestbook_entries')
      .insert({ name: name || null, message })
      .select()
      .single()

    if (data) {
      setEntries([data, ...entries])
    }
    setName('')
    setMessage('')
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <ScrollableRoomLayout>
      <div className="letter-page" style={{ width: '100%' }}>
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
            guestbook
          </p>
          <div style={{ width: '2rem' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '2.5rem' }}>
          <input
            type="text"
            placeholder="your name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="leave a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            style={{
              ...inputStyle,
              marginTop: '0.75rem',
              minHeight: '80px',
              resize: 'vertical',
              fontFamily: 'Georgia, serif',
            }}
          />
          <button
            type="submit"
            disabled={submitting || !message}
            style={{
              ...buttonStyle,
              marginTop: '0.75rem',
              width: '100%',
              opacity: submitting || !message ? 0.3 : 0.7,
            }}
          >
            {submitted ? 'sent' : submitting ? 'sending...' : 'sign'}
          </button>
        </form>

        {entries.map(entry => (
          <div
            key={entry.id}
            style={{
              padding: '1rem 0',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: '1.35rem', lineHeight: 1.5, opacity: 0.85, whiteSpace: 'pre-wrap' }}>
              {entry.message}
            </p>
            <p style={{ fontSize: '1.05rem', opacity: 0.5, marginTop: '0.4rem' }}>
              — {entry.name || 'someone'} · {new Date(entry.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}

        {entries.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>
            be the first to sign
          </p>
        )}
      </div>
    </ScrollableRoomLayout>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: '4px',
  background: 'rgba(255,255,255,0.5)',
  fontSize: '0.9rem',
  fontFamily: 'Georgia, serif',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid rgba(0,0,0,0.15)',
  padding: '0.6rem 1.2rem',
  fontSize: '0.85rem',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  cursor: 'pointer',
  borderRadius: '4px',
}
