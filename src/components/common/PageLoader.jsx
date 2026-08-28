export function PageLoader({ message = 'Cargando...' }) {
  return (
    <div className="grid min-h-[320px] place-items-center rounded-md border border-stone-200 bg-white px-4 py-8 text-stone-600">
      <div className="flex items-center gap-3 text-sm font-medium">
        <span className="size-4 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-700" />
        {message}
      </div>
    </div>
  )
}
