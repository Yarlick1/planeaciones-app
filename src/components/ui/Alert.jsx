import { cn } from '../../lib/utils'

const variants = {
  danger: 'bg-red-50 text-red-700',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'border border-amber-200 bg-amber-50 text-amber-950',
}

export function Alert({ children, className, variant = 'danger' }) {
  return <div className={cn('rounded-md px-3 py-2 text-sm leading-6', variants[variant], className)}>{children}</div>
}
