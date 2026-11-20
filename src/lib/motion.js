import { useEffect, useState } from 'react'

// Shared motion helpers. Everything here is a no-op on the server, so the
// prerendered HTML is complete and visible without JavaScript.

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return undefined
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  return reduced
}

// True while the element is within `margin` of the viewport.
export function useInView(ref, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    if (!('IntersectionObserver' in window)) { Promise.resolve().then(() => setInView(true)); return undefined }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: margin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, margin])
  return inView
}

export function useMediaQuery(media) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const query = window.matchMedia?.(media)
    if (!query) return undefined
    const update = () => setMatches(query.matches)
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [media])
  return matches
}

export function usePageVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

// Section entrances: elements marked data-reveal that start below the fold
// fade and rise 16 px once, the first time they enter the viewport. Anything
// already on screen, and everything when motion is reduced or the observer is
// missing, simply stays visible.
export function useRevealOnScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) return undefined
    const pending = [...root.querySelectorAll('[data-reveal]')].filter(element => element.getBoundingClientRect().top > window.innerHeight * 0.92)
    if (!pending.length) return undefined
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('reveal-in')
        entry.target.classList.remove('reveal-pending')
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    for (const element of pending) {
      element.classList.add('reveal-pending')
      observer.observe(element)
    }
    return () => {
      observer.disconnect()
      for (const element of pending) element.classList.remove('reveal-pending')
    }
  }, [rootRef])
}

// A small pointer-driven offset (in px, up to `strength`) for foreground
// annotations on desktop. Writes CSS variables; never moves charts or text.
export function usePointerDepth(ref, strength = 10) {
  useEffect(() => {
    const element = ref.current
    if (!element || prefersReducedMotion() || !window.matchMedia?.('(pointer: fine) and (min-width: 1000px)').matches) return undefined
    let frame = 0
    function move(event) {
      const bounds = element.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width - 0.5
      const y = (event.clientY - bounds.top) / bounds.height - 0.5
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        element.style.setProperty('--depth-x', `${(x * strength).toFixed(2)}px`)
        element.style.setProperty('--depth-y', `${(y * strength).toFixed(2)}px`)
      })
    }
    function leave() {
      cancelAnimationFrame(frame)
      element.style.setProperty('--depth-x', '0px')
      element.style.setProperty('--depth-y', '0px')
    }
    element.addEventListener('pointermove', move, { passive: true })
    element.addEventListener('pointerleave', leave)
    return () => { cancelAnimationFrame(frame); element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave) }
  }, [ref, strength])
}
