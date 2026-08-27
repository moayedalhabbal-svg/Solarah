import { useEffect, useRef, useState } from 'react'

// ── useReveal ──────────────────────────────────────────────────────────────
// Returns a ref + boolean. Attach ref to any element; `visible` becomes true
// once the element scrolls into view, then stays true (one-shot reveal).
// Respects prefers-reduced-motion automatically via CSS (see global.css).

export function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible]
}
