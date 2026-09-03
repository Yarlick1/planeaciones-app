import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Textarea } from '../../../components/ui/Textarea'
import { useGsapReveal } from '../../../hooks/useGsapReveal'
import { AiThinkingState } from './AiThinkingState'

export function SuggestionCards({ loading, onRegenerate, onSelect, showToolbar = true, suggestions }) {
  const [drafts, setDrafts] = useState([])
  const cardsRef = useGsapReveal({ selector: '[data-suggestion-card]', stagger: 0.09, y: 16 })

  if (loading) {
    return <AiThinkingState />
  }

  return (
    <div ref={cardsRef} className="space-y-4">
      {showToolbar && (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onRegenerate}>
            <RefreshCw size={15} />
            Generar otras opciones
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => {
          const draft = drafts[index]?.title === suggestion.title ? drafts[index].value : suggestion.value

          return (
            <article
              data-suggestion-card
              key={`${suggestion.title}-${index}`}
              className="group flex flex-col rounded-md border border-white/70 bg-white/95 p-4 shadow-xl shadow-cyan-950/10 transition hover:-translate-y-1 hover:border-cyan-200 hover:bg-white lg:min-h-[20rem]"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-cyan-50 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">
                  {index + 1}
                </span>
                <h3 className="min-w-0 text-sm font-semibold leading-5 text-stone-950">{suggestion.title}</h3>
              </div>
              <Textarea
                rows={7}
                className="mt-4 min-h-36 flex-1 resize-y border-stone-200 bg-stone-50/80 leading-6 focus:bg-white sm:min-h-40 lg:resize-none"
                value={draft}
                onChange={(event) => {
                  setDrafts((current) => {
                    const next = [...current]
                    next[index] = { title: suggestion.title, value: event.target.value }
                    return next
                  })
                }}
              />
              <Button type="button" className="mt-4 w-full shadow-lg shadow-emerald-950/10" onClick={() => onSelect(draft)}>
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
