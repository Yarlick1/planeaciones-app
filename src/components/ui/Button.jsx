import gsap from 'gsap'
import { useRef } from 'react'
import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
  secondary: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-stone-600 hover:bg-stone-100',
}

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  icon: 'size-9 p-0',
}

export function Button({
  children,
  className,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const buttonRef = useRef(null)

  function animateButton(event, animation, callback) {
    callback?.(event)
    if (props.disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.to(buttonRef.current, { duration: 0.18, ease: 'power2.out', ...animation })
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      onMouseDown={(event) => animateButton(event, { scale: 0.98 }, onMouseDown)}
      onMouseEnter={(event) => animateButton(event, { y: -1 }, onMouseEnter)}
      onMouseLeave={(event) => animateButton(event, { scale: 1, y: 0 }, onMouseLeave)}
      onMouseUp={(event) => animateButton(event, { scale: 1, y: -1 }, onMouseUp)}
      {...props}
    >
      {children}
    </button>
  )
}
