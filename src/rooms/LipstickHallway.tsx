import { useEffect } from 'react'

export function LipstickHallway() {
  useEffect(() => {
    window.location.href = `${import.meta.env.BASE_URL}lipstick-hallway/index.html`
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }} />
  )
}
