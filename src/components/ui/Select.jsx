import { cn } from '../../lib/utils'

export function Select({ children, className, ...props }) {
  return (
    <select
      className={cn(
        'w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
