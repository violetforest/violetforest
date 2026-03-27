interface Sketch {
  title: string
  url: string
}

interface Props {
  sketches: Sketch[]
}

export function SketchBook({ sketches }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'scroll',
        overflowX: 'hidden',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {sketches.map((sketch, i) => (
        <div
          key={i}
          style={{
            width: '100vw',
            height: '100vh',
            scrollSnapAlign: 'start',
            position: 'relative',
          }}
        >
          <iframe
            src={sketch.url}
            title={sketch.title}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          {/* Title overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <p
              style={{
                display: 'inline-block',
                padding: '0.4rem 1rem',
                background: 'rgba(240, 234, 245, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontStyle: 'italic',
                opacity: 0.6,
              }}
            >
              {sketch.title}
              <span style={{ opacity: 0.4, marginLeft: '0.6rem', fontStyle: 'normal', fontSize: '0.7rem' }}>
                {i + 1}/{sketches.length}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
