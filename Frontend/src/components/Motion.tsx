import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { Routes, useLocation } from 'react-router-dom'

const ease = [0.16, 1, 0.3, 1] as const

// Troca de tela: cortina laranja varre a tela e o conteúdo entra subindo.
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { pathname } = location
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 })
  }, [pathname, location.hash])

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={reduce ? false : { opacity: 0, y: 36, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease }}
        >
          <Routes location={location}>{children}</Routes>
        </motion.div>
      </AnimatePresence>
      {!reduce && (
        <motion.div
          key={`curtain-${pathname}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60]"
          style={{ background: 'var(--grad)', transformOrigin: 'bottom' }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [0, 1, 1, 0], transformOrigin: ['bottom', 'bottom', 'top', 'top'] }}
          transition={{ duration: 0.9, times: [0, 0.4, 0.5, 1], ease: [0.76, 0, 0.24, 1] }}
        />
      )}
    </>
  )
}

// Entra quando aparece na tela.
export function Reveal({ children, delay = 0, className = '', y = 40 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.8, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

// Título que revela palavra por palavra.
export function SplitWords({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease, delay: delay + i * 0.07 }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  )
}

export { motion }
