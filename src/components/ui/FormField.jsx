import { cn } from '../../lib/utils'

export function FormField({ children, className, error, label, ...props }) {
  return (
    <label className={cn('block', className)} {...props}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}
