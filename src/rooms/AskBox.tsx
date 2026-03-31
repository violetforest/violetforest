import { Link } from 'react-router-dom'
import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'

interface Ask {
  id: string
  question: string
  anonymous: boolean
  name: string | null
  answer: string | null
  answered_at: string | null
  created_at: string
}

export function AskBox() {
  const [asks, setAsks] = useState<Ask[]>([])
  const [question, setQuestion] = useState('')
  const [name, setName] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    supabase
      .from('asks')
      .select('*')
      .not('answer', 'is', null)
      .order('answered_at', { ascending: false })
      .then(({ data }) => setAsks(data || []))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!question) return
    setSubmitting(true)

    await supabase.from('asks').insert({
      question,
      anonymous,
      name: anonymous ? null : name || null,
    })

    setQuestion('')
    setName('')
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

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
            ask me anything
          </p>
          <div style={{ width: '2rem' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '2.5rem' }}>
          <textarea
            placeholder="ask me something..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
            style={{
              ...inputStyle,
              minHeight: '80px',
              resize: 'vertical',
              fontFamily: 'Georgia, serif',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <label style={{ fontSize: '1.2rem', opacity: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
              />
              anonymous
            </label>
            {!anonymous && (
              <input
                type="text"
                placeholder="your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: '1.2rem' }}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !question}
            style={{
              ...buttonStyle,
              marginTop: '0.75rem',
              width: '100%',
              opacity: submitting || !question ? 0.3 : 0.7,
            }}
          >
            {submitted ? 'sent' : submitting ? 'sending...' : 'ask'}
          </button>
        </form>

        {asks.map(ask => (
          <div
            key={ask.id}
            style={{
              padding: '1.25rem 0',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: '1.28rem', opacity: 0.5, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{ask.question}"
            </p>
            <p style={{ fontSize: '1.05rem', opacity: 0.45, marginTop: '0.25rem' }}>
              — {ask.anonymous ? 'anonymous' : ask.name}
            </p>
            <p style={{ fontSize: '1.43rem', opacity: 0.85, lineHeight: 1.5, marginTop: '0.75rem' }}>
              {ask.answer}
            </p>
          </div>
        ))}

        {asks.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.45, fontStyle: 'italic' }}>
            no questions answered yet
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
