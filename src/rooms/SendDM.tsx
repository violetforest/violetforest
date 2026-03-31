import { Link } from 'react-router-dom'
import { useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'

export function SendDM() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message) return
    setSubmitting(true)

    await supabase.from('dms').insert({
      name: name || null,
      message,
    })

    setName('')
    setMessage('')
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <ScrollableRoomLayout>
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            textAlign: 'left',
          }}
        >
          <Link
            to="/"
            style={{ fontSize: '1.28rem', opacity: 0.5, fontFamily: 'Georgia, serif' }}
          >
            home
          </Link>
          <p style={{ fontSize: '1.2rem', fontStyle: 'italic', opacity: 0.55 }}>
            message me
          </p>
          <div style={{ width: '2rem' }} />
        </div>

        {submitted ? (
          <div>
            <p style={{ fontSize: '1.65rem', fontStyle: 'italic', opacity: 0.6, marginBottom: '2rem' }}>
              sent. i'll read it soon.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              style={{ ...buttonStyle, opacity: 0.45 }}
            >
              send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <input
              type="text"
              placeholder="your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder="say something..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              style={{
                ...inputStyle,
                marginTop: '0.75rem',
                minHeight: '120px',
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
              {submitting ? 'sending...' : 'send'}
            </button>
          </form>
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
