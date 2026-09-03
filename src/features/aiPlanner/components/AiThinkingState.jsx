import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'

export function AiThinkingState({ label = 'Generando propuestas...' }) {
  const scopeRef = useRef(null)

  useLayoutEffect(() => {
    if (!scopeRef.current) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const context = gsap.context(() => {
      gsap.to('[data-orbit="outer"]', { rotate: 360, duration: 4, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })
      gsap.to('[data-orbit="inner"]', { rotate: -360, duration: 3, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })
      gsap.to('[data-pulse]', { scale: 1.14, opacity: 0.55, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' })
      gsap.to('[data-dot]', { y: -4, duration: 0.75, yoyo: true, repeat: -1, stagger: 0.16, ease: 'sine.inOut' })
    }, scopeRef)

    return () => context.revert()
  }, [])

  return (
    <div
      ref={scopeRef}
      className="relative overflow-hidden rounded-md border border-cyan-200/70 bg-white/90 p-6 text-sm text-stone-600 shadow-sm shadow-cyan-950/5 backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
        <svg viewBox="0 0 120 120" className="size-24 overflow-visible" aria-hidden="true">
          <defs>
            <radialGradient id="ai-thinking-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="55%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <circle data-pulse cx="60" cy="60" r="22" fill="url(#ai-thinking-core)" opacity="0.75" />
          <circle cx="60" cy="60" r="11" fill="#ecfeff" />
          <g data-orbit="outer">
            <circle cx="60" cy="60" r="43" fill="none" stroke="#22d3ee" strokeDasharray="52 28" strokeWidth="2" />
            <circle data-dot cx="102" cy="60" r="4" fill="#22d3ee" />
          </g>
          <g data-orbit="inner">
            <circle cx="60" cy="60" r="31" fill="none" stroke="#34d399" strokeDasharray="22 18" strokeWidth="2" />
            <circle data-dot cx="60" cy="29" r="3.5" fill="#34d399" />
          </g>
          <circle data-dot cx="46" cy="66" r="3" fill="#0f766e" />
          <circle data-dot cx="74" cy="54" r="3" fill="#0891b2" />
        </svg>
        <div>
          <p className="font-semibold text-stone-950">{label}</p>
          <p className="mt-1 text-xs text-stone-500">Preparando opciones editables para tu planeación.</p>
        </div>
      </div>
    </div>
  )
}
