import { motion } from 'framer-motion'
import { DateNightDialog } from './DateNightDialog'

export function LipstickHallway() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <iframe
        src={`${import.meta.env.BASE_URL}lipstick-hallway/index.html`}
        title="Lipstick Hallway"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#000',
        }}
      />
      <DateNightDialog />
    </motion.div>
  )
}
