import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ScrollableRoomLayout } from '../components/ScrollableRoomLayout'
import type { Session } from '@supabase/supabase-js'

function LoginForm({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
    } else if (data.session) {
      onLogin(data.session)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ ...inputStyle, marginTop: '0.75rem' }}
      />
      {error && (
        <p style={{ color: '#c44', fontSize: '1.2rem', marginTop: '0.5rem' }}>{error}</p>
      )}
      <button type="submit" style={{ ...buttonStyle, marginTop: '1rem', width: '100%' }}>
        log in
      </button>
    </form>
  )
}

function PostComposer({ onPost }: { onPost: () => void }) {
  const [body, setBody] = useState('')
  const [type, setType] = useState('text')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [posting, setPosting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body && !imageFile) return
    setPosting(true)

    let image_url: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `posts/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, imageFile)
      if (!error) {
        const { data } = supabase.storage.from('media').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    if (type === 'story') {
      await supabase.from('stories').insert({
        body: body || null,
        image_url,
      })
    } else {
      await supabase.from('posts').insert({
        type: imageFile ? 'photo' : type,
        body: body || null,
        image_url,
        link_url: type === 'link' ? linkUrl || null : null,
      })
    }

    setBody('')
    setLinkUrl('')
    setImageFile(null)
    setType('text')
    setPosting(false)
    onPost()
  }

  const isStory = type === 'story'

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: '100%',
        marginBottom: '2rem',
        padding: isStory ? '1rem' : 0,
        border: isStory ? '1px dashed rgba(0,0,0,0.15)' : 'none',
        borderRadius: isStory ? '8px' : 0,
        background: isStory ? 'rgba(255,255,255,0.25)' : 'transparent',
        transition: 'all 0.3s ease',
      }}
    >
      {isStory && (
        <p style={{ fontSize: '1.05rem', opacity: 0.45, fontStyle: 'italic', marginBottom: '0.75rem' }}>
          disappears in 24 hours
        </p>
      )}

      <textarea
        placeholder={isStory ? "what's happening right now?" : "what's on your mind?"}
        value={body}
        onChange={e => setBody(e.target.value)}
        style={{
          ...inputStyle,
          minHeight: isStory ? '60px' : '100px',
          resize: 'vertical',
          fontFamily: 'Georgia, serif',
          background: isStory ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)',
        }}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {['text', 'quote', 'link'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            style={{
              ...buttonStyle,
              opacity: type === t ? 0.8 : 0.45,
              fontSize: '1.13rem',
              padding: '0.4rem 0.8rem',
            }}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setType(isStory ? 'text' : 'story')}
          style={{
            ...buttonStyle,
            opacity: isStory ? 0.8 : 0.45,
            fontSize: '1.13rem',
            padding: '0.4rem 0.8rem',
            borderStyle: 'dashed',
          }}
        >
          story
        </button>
      </div>

      {type === 'link' && (
        <input
          type="url"
          placeholder="link url"
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          style={{ ...inputStyle, marginTop: '0.75rem' }}
        />
      )}

      <div style={{ marginTop: '0.75rem' }}>
        <label
          style={{
            fontSize: '1.2rem',
            opacity: 0.5,
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
          }}
        >
          {imageFile ? imageFile.name : 'attach image'}
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files?.[0] || null)}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={posting || (!body && !imageFile)}
        style={{
          ...buttonStyle,
          marginTop: '1rem',
          width: '100%',
          opacity: posting || (!body && !imageFile) ? 0.3 : 0.7,
        }}
      >
        {posting ? 'posting...' : 'post'}
      </button>
    </form>
  )
}

function DmList() {
  const [dms, setDms] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('dms')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDms(data || []))
  }, [])

  if (dms.length === 0) return null

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <p style={{ fontSize: '1.2rem', opacity: 0.55, fontStyle: 'italic', marginBottom: '1rem' }}>
        DMs ({dms.filter(d => !d.read).length} unread)
      </p>
      {dms.map(dm => (
        <div
          key={dm.id}
          style={{
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            opacity: dm.read ? 0.4 : 0.8,
          }}
        >
          <p style={{ fontSize: '1.28rem', lineHeight: 1.5 }}>{dm.message}</p>
          <p style={{ fontSize: '1.05rem', opacity: 0.5, marginTop: '0.25rem' }}>
            {dm.name || 'anonymous'} · {new Date(dm.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}

function AskList() {
  const [asks, setAsks] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('asks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setAsks(data || []))
  }, [])

  const unanswered = asks.filter(a => !a.answer)
  if (unanswered.length === 0) return null

  const answerAsk = async (id: string, answer: string) => {
    await supabase
      .from('asks')
      .update({ answer, answered_at: new Date().toISOString() })
      .eq('id', id)
    setAsks(asks.map(a => a.id === id ? { ...a, answer, answered_at: new Date().toISOString() } : a))
  }

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <p style={{ fontSize: '1.2rem', opacity: 0.55, fontStyle: 'italic', marginBottom: '1rem' }}>
        unanswered asks ({unanswered.length})
      </p>
      {unanswered.map(ask => (
        <div
          key={ask.id}
          style={{
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <p style={{ fontSize: '1.28rem', lineHeight: 1.5, fontStyle: 'italic' }}>
            "{ask.question}"
          </p>
          <p style={{ fontSize: '1.05rem', opacity: 0.5, marginTop: '0.25rem' }}>
            {ask.anonymous ? 'anonymous' : ask.name} · {new Date(ask.created_at).toLocaleDateString()}
          </p>
          <AnswerForm onAnswer={(answer) => answerAsk(ask.id, answer)} />
        </div>
      ))}
    </div>
  )
}

function AnswerForm({ onAnswer }: { onAnswer: (answer: string) => void }) {
  const [answer, setAnswer] = useState('')

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      <input
        type="text"
        placeholder="answer..."
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        style={{ ...inputStyle, flex: 1, fontSize: '1.2rem' }}
      />
      <button
        onClick={() => { if (answer) { onAnswer(answer); setAnswer('') } }}
        style={{ ...buttonStyle, fontSize: '1.13rem', padding: '0.4rem 0.8rem' }}
      >
        reply
      </button>
    </div>
  )
}

export function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <ScrollableRoomLayout>
        <p style={{ opacity: 0.45, fontStyle: 'italic' }}>...</p>
      </ScrollableRoomLayout>
    )
  }

  if (!session) {
    return (
      <ScrollableRoomLayout>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '1.2rem', opacity: 0.55, fontStyle: 'italic', marginBottom: '2rem' }}>
            admin
          </p>
          <LoginForm onLogin={setSession} />
          <Link
            to="/"
            style={{
              display: 'inline-block',
              marginTop: '2rem',
              fontSize: '1.2rem',
              opacity: 0.45,
            }}
          >
            back
          </Link>
        </div>
      </ScrollableRoomLayout>
    )
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
            admin
          </p>
          <button
            onClick={() => { supabase.auth.signOut(); setSession(null) }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              opacity: 0.45,
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
            }}
          >
            logout
          </button>
        </div>

        <PostComposer onPost={() => setRefreshKey(k => k + 1)} />
        <DmList key={`dms-${refreshKey}`} />
        <AskList key={`asks-${refreshKey}`} />
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
