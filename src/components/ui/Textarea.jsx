import { cn } from '../../lib/utils'

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm leading-6 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100',
        className,
      )}
      {...props}
    />
  )
}
