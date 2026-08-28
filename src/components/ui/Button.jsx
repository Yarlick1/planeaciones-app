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
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
