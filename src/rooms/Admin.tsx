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

type MediaItem = { url: string; type: 'image' | 'video' }

// Parse a free-form tag string into a clean array.
// Accepts comma- or space-separated, with or without leading '#'.
function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,\s]+/)
        .map(t => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
    )
  )
}

function PostComposer({ onPost }: { onPost: () => void }) {
  const [body, setBody] = useState('')
  const [type, setType] = useState('text')
  const [linkUrl, setLinkUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [posting, setPosting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body && mediaFiles.length === 0) return
    setPosting(true)

    let image_url: string | null = null
    const media: MediaItem[] = []

    // Upload each attached file in order
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i]
      const ext = file.name.split('.').pop()
      const path = `posts/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('media').getPublicUrl(path)
        const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'
        media.push({ url: data.publicUrl, type: kind })
        // Mirror first image into legacy image_url for stories + back-compat
        if (image_url === null && kind === 'image') image_url = data.publicUrl
      }
    }

    let insertError = null
    if (type === 'story') {
      const { error } = await supabase.from('stories').insert({
        body: body || null,
        image_url,
      })
      insertError = error
    } else {
      const hasMedia = media.length > 0
      const tags = parseTags(tagsInput)
      // Only include media/tags keys when they have values, so a plain post
      // doesn't reference those columns at all if they're absent from the db.
      const row: Record<string, any> = {
        type: hasMedia ? 'photo' : type,
        body: body || null,
        image_url,
        link_url: type === 'link' ? linkUrl || null : null,
      }
      if (hasMedia) row.media = media
      if (tags.length > 0) row.tags = tags
      const { error } = await supabase.from('posts').insert(row)
      insertError = error
    }

    setPosting(false)

    if (insertError) {
      window.alert(`Post failed: ${insertError.message}`)
      return
    }

    setBody('')
    setLinkUrl('')
    setTagsInput('')
    setMediaFiles([])
    setType('text')
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
          disappears in 7 days
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

      {!isStory && (
        <input
          type="text"
          placeholder="tags (e.g. girly, dollz, blinkies)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
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
          {mediaFiles.length === 0
            ? 'attach images / videos'
            : `${mediaFiles.length} file${mediaFiles.length === 1 ? '' : 's'} attached`}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={e => setMediaFiles(Array.from(e.target.files || []))}
            style={{ display: 'none' }}
          />
        </label>
        {mediaFiles.length > 0 && (
          <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none' }}>
            {mediaFiles.map((f, i) => (
              <li
                key={i}
                style={{
                  fontSize: '1rem',
                  opacity: 0.55,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.15rem 0',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.type.startsWith('video/') ? '▶ ' : '🖼 '}{f.name}
                </span>
                <button
                  type="button"
                  onClick={() => setMediaFiles(mediaFiles.filter((_, j) => j !== i))}
                  style={{ ...deleteStyle, marginLeft: '0.5rem' }}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={posting || (!body && mediaFiles.length === 0)}
        style={{
          ...buttonStyle,
          marginTop: '1rem',
          width: '100%',
          opacity: posting || (!body && mediaFiles.length === 0) ? 0.3 : 0.7,
        }}
      >
        {posting ? 'posting...' : 'post'}
      </button>
    </form>
  )
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span style={{ fontSize: '0.9rem' }}>
        <button
          onClick={() => { onDelete(); setConfirming(false) }}
          style={{ ...deleteStyle, color: '#c44' }}
        >
          yes, delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ ...deleteStyle, marginLeft: '0.5rem' }}
        >
          cancel
        </button>
      </span>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} style={deleteStyle}>
      delete
    </button>
  )
}

function PostList({ refreshKey }: { refreshKey: number }) {
  const [posts, setPosts] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])

  useEffect(() => {
    supabase.from('posts').select('*').order('created_at', { ascending: false }).then(({ data }) => setPosts(data || []))
    supabase.from('stories').select('*').order('created_at', { ascending: false }).then(({ data }) => setStories(data || []))
  }, [refreshKey])

  const deletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id)
    setPosts(posts.filter(p => p.id !== id))
  }

  const deleteStory = async (id: string) => {
    await supabase.from('stories').delete().eq('id', id)
    setStories(stories.filter(s => s.id !== id))
  }

  // Extract the storage path from a Supabase public URL so we can delete the file.
  // URLs look like: <root>/storage/v1/object/public/media/posts/123.jpg
  const storagePathFromUrl = (url: string): string | null => {
    const m = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/)
    return m ? m[1] : null
  }

  // Remove a single media item from a post (and try to delete the storage file).
  const removeMediaItem = async (post: any, index: number) => {
    const current: { url: string; type: 'image' | 'video' }[] =
      post.media && post.media.length > 0
        ? post.media
        : post.image_url
          ? [{ url: post.image_url, type: 'image' }]
          : []

    const removed = current[index]
    const next = current.filter((_, i) => i !== index)

    // Mirror the first remaining image into image_url for back-compat.
    const firstImage = next.find(m => m.type === 'image')
    const updates: Record<string, any> = {
      media: next.length > 0 ? next : null,
      image_url: firstImage ? firstImage.url : null,
    }
    // If nothing left, drop back to a plain text post.
    if (next.length === 0 && post.type === 'photo') {
      updates.type = post.body ? 'text' : 'photo'
    }

    await supabase.from('posts').update(updates).eq('id', post.id)

    // Best-effort storage cleanup — ignore failures.
    if (removed) {
      const path = storagePathFromUrl(removed.url)
      if (path) await supabase.storage.from('media').remove([path])
    }

    setPosts(posts.map(p => (p.id === post.id ? { ...p, ...updates } : p)))
  }

  // Edit tags on an existing post via a quick prompt.
  const editTags = async (post: any) => {
    const current: string[] = post.tags || []
    const next = window.prompt('Tags (comma separated):', current.join(', '))
    if (next === null) return
    const tags = parseTags(next)
    await supabase
      .from('posts')
      .update({ tags: tags.length > 0 ? tags : null })
      .eq('id', post.id)
    setPosts(posts.map(p => (p.id === post.id ? { ...p, tags } : p)))
  }

  // Edit the text/body of an existing post via a quick prompt.
  const editBody = async (post: any) => {
    const next = window.prompt('Post text:', post.body || '')
    if (next === null) return
    const body = next.trim() || null
    await supabase
      .from('posts')
      .update({ body })
      .eq('id', post.id)
    setPosts(posts.map(p => (p.id === post.id ? { ...p, body } : p)))
  }

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      {stories.length > 0 && (
        <>
          <p style={{ fontSize: '1.2rem', opacity: 0.55, fontStyle: 'italic', marginBottom: '1rem' }}>
            stories ({stories.length})
          </p>
          {stories.map(story => (
            <div key={story.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '1.13rem', lineHeight: 1.5, opacity: 0.7 }}>{story.body || '(image)'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.9rem', opacity: 0.4 }}>{new Date(story.created_at).toLocaleString()}</p>
                <DeleteButton onDelete={() => deleteStory(story.id)} />
              </div>
            </div>
          ))}
        </>
      )}

      {posts.length > 0 && (
        <>
          <p style={{ fontSize: '1.2rem', opacity: 0.55, fontStyle: 'italic', marginBottom: '1rem', marginTop: '1.5rem' }}>
            posts ({posts.length})
          </p>
          {posts.map(post => {
            const items: { url: string; type: 'image' | 'video' }[] =
              post.media && post.media.length > 0
                ? post.media
                : post.image_url
                  ? [{ url: post.image_url, type: 'image' }]
                  : []
            return (
              <div key={post.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '1.13rem', lineHeight: 1.5, opacity: 0.7 }}>{post.body || '(image)'}</p>
                {items.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                    {items.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'relative',
                          width: 64,
                          height: 64,
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: '1px solid rgba(0,0,0,0.08)',
                          background: '#000',
                        }}
                      >
                        {m.type === 'video' ? (
                          <video
                            src={m.url}
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <img
                            src={m.url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                        <button
                          type="button"
                          title="remove this photo"
                          onClick={() => {
                            if (window.confirm('Remove this photo from the post?')) {
                              removeMediaItem(post, i)
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            fontSize: 12,
                            lineHeight: '18px',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {(post.tags || []).map((t: string) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.95rem',
                        opacity: 0.55,
                        fontStyle: 'italic',
                        fontFamily: 'Georgia, serif',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => editTags(post)}
                    style={{ ...deleteStyle, opacity: 0.5 }}
                  >
                    {(post.tags || []).length > 0 ? 'edit tags' : '+ add tags'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <p style={{ fontSize: '0.9rem', opacity: 0.4 }}>{post.type} · {new Date(post.created_at).toLocaleString()}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => editBody(post)}
                      style={{ ...deleteStyle, opacity: 0.5 }}
                    >
                      edit text
                    </button>
                    <DeleteButton onDelete={() => deletePost(post.id)} />
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function GuestbookList({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    supabase.from('guestbook_entries').select('*').order('created_at', { ascending: false }).then(({ data }) => setEntries(data || []))
  }, [refreshKey])

  const deleteEntry = async (id: string) => {
    await supabase.from('guestbook_entries').delete().eq('id', id)
    setEntries(entries.filter(e => e.id !== id))
  }

  if (entries.length === 0) return null

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <p style={{ fontSize: '1.2rem', opacity: 0.55, fontStyle: 'italic', marginBottom: '1rem' }}>
        guestbook ({entries.length})
      </p>
      {entries.map(entry => (
        <div key={entry.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '1.13rem', lineHeight: 1.5, opacity: 0.7 }}>{entry.message}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <p style={{ fontSize: '0.9rem', opacity: 0.4 }}>{entry.name || 'someone'} · {new Date(entry.created_at).toLocaleString()}</p>
            <DeleteButton onDelete={() => deleteEntry(entry.id)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DmList({ refreshKey }: { refreshKey: number }) {
  const [dms, setDms] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('dms')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDms(data || []))
  }, [refreshKey])

  const deleteDm = async (id: string) => {
    await supabase.from('dms').delete().eq('id', id)
    setDms(dms.filter(d => d.id !== id))
  }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <p style={{ fontSize: '1.05rem', opacity: 0.5 }}>
              {dm.name || 'anonymous'} · {new Date(dm.created_at).toLocaleDateString()}
            </p>
            <DeleteButton onDelete={() => deleteDm(dm.id)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AskList({ refreshKey }: { refreshKey: number }) {
  const [asks, setAsks] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('asks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setAsks(data || []))
  }, [refreshKey])

  const unanswered = asks.filter(a => !a.answer)

  const answerAsk = async (id: string, answer: string) => {
    await supabase
      .from('asks')
      .update({ answer, answered_at: new Date().toISOString() })
      .eq('id', id)
    setAsks(asks.map(a => a.id === id ? { ...a, answer, answered_at: new Date().toISOString() } : a))
  }

  const deleteAsk = async (id: string) => {
    await supabase.from('asks').delete().eq('id', id)
    setAsks(asks.filter(a => a.id !== id))
  }

  if (unanswered.length === 0) return null

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <p style={{ fontSize: '1.05rem', opacity: 0.5 }}>
              {ask.anonymous ? 'anonymous' : ask.name} · {new Date(ask.created_at).toLocaleDateString()}
            </p>
            <DeleteButton onDelete={() => deleteAsk(ask.id)} />
          </div>
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
        <PostList refreshKey={refreshKey} />
        <DmList refreshKey={refreshKey} />
        <AskList refreshKey={refreshKey} />
        <GuestbookList refreshKey={refreshKey} />
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

const deleteStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '0.85rem',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  cursor: 'pointer',
  opacity: 0.4,
  padding: 0,
}
