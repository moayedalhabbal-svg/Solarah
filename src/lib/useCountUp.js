import { useState, useEffect } from 'react'

/**
 * useCountUp — animates a number from 0 to target over `duration` ms.
 * Uses requestAnimationFrame + easeOutExpo for smooth deceleration.
 * @param {number} target   – final value
 * @param {number} duration – animation length in ms (default 800)
 * @param {number} decimals – decimal places to return (default 0)
 * @returns {string} current animated value, formatted to `decimals` places
 */
export function useCountUp(target, duration = 800, decimals = 0) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const targetValue = parseFloat(target) || 0
    if (targetValue === 0) { setValue(0); return }

    let startTime = null
    let raf

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(targetValue * ease)
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      } else {
        setValue(targetValue)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return Number(value).toFixed(decimals)
}
