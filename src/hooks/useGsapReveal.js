import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'

export function useGsapReveal({ selector = '[data-reveal]', stagger = 0.08, y = 18 } = {}) {
  const scopeRef = useRef(null)

  useLayoutEffect(() => {
    if (!scopeRef.current) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const context = gsap.context(() => {
      gsap.fromTo(
        selector,
        { autoAlpha: 0, y },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger },
      )
    }, scopeRef)

    return () => context.revert()
  }, [selector, stagger, y])

  return scopeRef
}
