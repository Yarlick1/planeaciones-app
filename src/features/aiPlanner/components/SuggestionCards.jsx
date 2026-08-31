import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Textarea } from '../../../components/ui/Textarea'

export function SuggestionCards({ loading, onRegenerate, onSelect, suggestions }) {
  const [drafts, setDrafts] = useState([])

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
        {suggestions.map((suggestion, index) => {
          const draft = drafts[index]?.title === suggestion.title ? drafts[index].value : suggestion.value

          return (
            <article key={`${suggestion.title}-${index}`} className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-950">{suggestion.title}</h3>
              <Textarea
                rows={8}
                className="mt-3"
                value={draft}
                onChange={(event) => {
                  setDrafts((current) => {
                    const next = [...current]
                    next[index] = { title: suggestion.title, value: event.target.value }
                    return next
                  })
                }}
              />
              <Button type="button" className="mt-3 w-full" onClick={() => onSelect(draft)}>
                <CheckCircle2 size={16} />
                Usar esta opción
              </Button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
