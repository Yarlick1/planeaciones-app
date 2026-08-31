import { CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export function AxesSuggestionCards({ loading, onRegenerate, onSelect, suggestions }) {
  if (loading) {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
        Generando propuestas...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onRegenerate}>
          <RefreshCw size={15} />
          Generar otras opciones
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <article key={`${suggestion.title}-${index}`} className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-950">{suggestion.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestion.value.map((axis) => (
                <span key={axis} className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {axis}
                </span>
              ))}
            </div>
            <Button type="button" className="mt-4 w-full" onClick={() => onSelect(suggestion.value)}>
              <CheckCircle2 size={16} />
              Usar estos ejes
            </Button>
          </article>
        ))}
      </div>
    </div>
  )
}
