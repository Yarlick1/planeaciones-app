import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { useGsapReveal } from '../../../hooks/useGsapReveal'
import { AiThinkingState } from './AiThinkingState'

export function SequenceSuggestionCards({ loading, onRegenerate, onSelect, showToolbar = true, suggestions }) {
  const [drafts, setDrafts] = useState([])
  const cardsRef = useGsapReveal({ selector: '[data-sequence-card]', stagger: 0.08, y: 18 })

  if (loading) {
    return <AiThinkingState label="Diseñando secuencias..." />
  }

  function updateDraft(index, field, value) {
    setDrafts((current) => {
      const next = [...current]
      const currentDraft = next[index]?.title === suggestions[index].title ? next[index].value : suggestions[index].value
      next[index] = { title: suggestions[index].title, value: { ...currentDraft, [field]: value } }
      return next
    })
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

      <div className="grid gap-4 xl:grid-cols-3">
        {suggestions.map((suggestion, index) => {
          const draft = drafts[index]?.title === suggestion.title ? drafts[index].value : suggestion.value

          return (
            <article
              data-sequence-card
              key={`${suggestion.title}-${index}`}
              className="group flex flex-col rounded-md border border-white/70 bg-white/95 p-4 shadow-xl shadow-cyan-950/10 transition hover:-translate-y-1 hover:border-cyan-200 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-cyan-50 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">
                  {index + 1}
                </span>
                <h3 className="min-w-0 text-sm font-semibold leading-5 text-stone-950">{suggestion.title}</h3>
              </div>

              <div className="mt-4 grid flex-1 gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Inicio">
                    <Input
                      type="date"
                      className="h-10 bg-stone-50"
                      value={draft.startDate}
                      onChange={(event) => updateDraft(index, 'startDate', event.target.value)}
                    />
                  </FormField>
                  <FormField label="Fin">
                    <Input
                      type="date"
                      className="h-10 bg-stone-50"
                      value={draft.endDate}
                      onChange={(event) => updateDraft(index, 'endDate', event.target.value)}
                    />
                  </FormField>
                </div>

                <EditableSequenceField label="Inicio" value={draft.openingActivities} onChange={(value) => updateDraft(index, 'openingActivities', value)} />
                <EditableSequenceField
                  label="Desarrollo"
                  value={draft.developmentActivities}
                  onChange={(value) => updateDraft(index, 'developmentActivities', value)}
                />
                <EditableSequenceField label="Cierre" value={draft.closingActivities} onChange={(value) => updateDraft(index, 'closingActivities', value)} />
                <EditableSequenceField
                  label="Recursos"
                  value={draft.resourcesMaterials}
                  rows={3}
                  onChange={(value) => updateDraft(index, 'resourcesMaterials', value)}
                />
                <EditableSequenceField
                  label="Evaluación"
                  value={draft.evaluationCriteriaInstruments}
                  rows={3}
                  onChange={(value) => updateDraft(index, 'evaluationCriteriaInstruments', value)}
                />
                <EditableSequenceField label="Observaciones" value={draft.observations} rows={3} onChange={(value) => updateDraft(index, 'observations', value)} />
              </div>

              <Button type="button" className="mt-4 w-full shadow-lg shadow-emerald-950/10" onClick={() => onSelect(draft)}>
                <CheckCircle2 size={16} />
                Usar secuencia
              </Button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function EditableSequenceField({ label, onChange, rows = 4, value }) {
  return (
    <FormField label={label}>
      <Textarea
        rows={rows}
        className="min-h-24 resize-none border-stone-200 bg-stone-50/80 leading-6 focus:bg-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  )
}
