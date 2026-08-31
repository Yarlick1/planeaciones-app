import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'

export function SequenceSuggestionCards({ loading, onRegenerate, onSelect, suggestions }) {
  const [drafts, setDrafts] = useState([])

  if (loading) {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
        Generando secuencias...
      </div>
    )
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onRegenerate}>
          <RefreshCw size={15} />
          Generar otras opciones
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {suggestions.map((suggestion, index) => {
          const draft = drafts[index]?.title === suggestion.title ? drafts[index].value : suggestion.value

          return (
            <article key={`${suggestion.title}-${index}`} className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-950">{suggestion.title}</h3>

              <div className="mt-3 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <FormField label="Inicio">
                    <Input
                      type="date"
                      value={draft.startDate}
                      onChange={(event) => updateDraft(index, 'startDate', event.target.value)}
                    />
                  </FormField>
                  <FormField label="Fin">
                    <Input
                      type="date"
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

              <Button type="button" className="mt-4 w-full" onClick={() => onSelect(draft)}>
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
      <Textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </FormField>
  )
}
