import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Plus, Save, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { plannerDefaultValues, plannerSchema } from '../schemas/plannerSchema'

const articulatingAxes = [
  'Inclusión',
  'Pensamiento crítico',
  'Interculturalidad crítica',
  'Igualdad de género',
  'Vida saludable',
  'Apropiación de las culturas',
  'Artes y experiencias estéticas',
]

export function PlannerForm({ catalogs, defaultValues, formError, isEditing, onSubmit }) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(plannerSchema),
    defaultValues: defaultValues ?? plannerDefaultValues,
  })

  const sequences = useFieldArray({ control, name: 'sequences' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays size={18} className="text-emerald-700" />
          <h2 className="text-base font-semibold text-stone-950">Datos generales</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Fecha inicio" error={errors.generalStartDate?.message}>
            <Input type="date" {...register('generalStartDate')} />
          </FormField>

          <FormField label="Fecha fin" error={errors.generalEndDate?.message}>
            <Input type="date" {...register('generalEndDate')} />
          </FormField>

          <FormField label="Materia" error={errors.subjectId?.message}>
            <Select {...register('subjectId')}>
              <option value="">Selecciona una materia</option>
              {catalogs.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Grado y grupo" error={errors.groupId?.message}>
            <Select {...register('groupId')}>
              <option value="">Selecciona un grupo</option>
              {catalogs.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="mt-4 grid gap-4">
          <FormField label="Contenido" error={errors.content?.message}>
            <Textarea rows={3} {...register('content')} />
          </FormField>

          <FormField label="PDA" error={errors.pda?.message}>
            <Textarea rows={3} {...register('pda')} />
          </FormField>

          <FormField label="Problemática general">
            <Textarea rows={3} {...register('generalProblem')} />
          </FormField>

          <FormField label="Finalidades del campo formativo">
            <Textarea rows={3} {...register('formativeFieldPurposes')} />
          </FormField>

          <FormField label="Propósito" error={errors.purpose?.message}>
            <Textarea rows={3} {...register('purpose')} />
          </FormField>

          <div>
            <span className="text-sm font-medium text-stone-700">Ejes articuladores</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {articulatingAxes.map((axis) => (
                <label
                  key={axis}
                  className="flex min-h-10 items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-700"
                >
                  <input
                    type="checkbox"
                    value={axis}
                    className="size-4 rounded border-stone-300 accent-emerald-700"
                    {...register('articulatingAxes')}
                  />
                  {axis}
                </label>
              ))}
            </div>
          </div>

          <FormField label="Perfil de egreso">
            <Textarea rows={3} {...register('graduationProfile')} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-950">Secuencia didáctica</h2>
            <p className="mt-1 text-sm text-stone-600">Agrega una o más secuencias dentro del rango general.</p>
          </div>
          <Button
            type="button"
            onClick={() => sequences.append(plannerDefaultValues.sequences[0])}
            size="sm"
            variant="secondary"
          >
            <Plus size={15} />
            Agregar secuencia
          </Button>
        </div>

        {errors.sequences?.message && <p className="text-sm text-red-600">{errors.sequences.message}</p>}

        {sequences.fields.map((sequence, index) => (
          <div key={sequence.id} className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-stone-950">Secuencia {index + 1}</h3>
              <Button
                type="button"
                onClick={() => sequences.fields.length > 1 && sequences.remove(index)}
                disabled={sequences.fields.length === 1}
                size="sm"
                variant="secondary"
              >
                <Trash2 size={15} />
                Eliminar
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Fecha inicio" error={errors.sequences?.[index]?.startDate?.message}>
                <Input type="date" {...register(`sequences.${index}.startDate`)} />
              </FormField>

              <FormField label="Fecha fin" error={errors.sequences?.[index]?.endDate?.message}>
                <Input type="date" {...register(`sequences.${index}.endDate`)} />
              </FormField>
            </div>

            <div className="mt-4 grid gap-4">
              <FormField label="Inicio" error={errors.sequences?.[index]?.openingActivities?.message}>
                <Textarea rows={4} {...register(`sequences.${index}.openingActivities`)} />
              </FormField>

              <FormField label="Desarrollo" error={errors.sequences?.[index]?.developmentActivities?.message}>
                <Textarea rows={4} {...register(`sequences.${index}.developmentActivities`)} />
              </FormField>

              <FormField label="Cierre" error={errors.sequences?.[index]?.closingActivities?.message}>
                <Textarea rows={4} {...register(`sequences.${index}.closingActivities`)} />
              </FormField>

              <FormField label="Recursos y materiales">
                <Textarea rows={3} {...register(`sequences.${index}.resourcesMaterials`)} />
              </FormField>

              <FormField label="Criterios e instrumentos de evaluación">
                <Textarea rows={3} {...register(`sequences.${index}.evaluationCriteriaInstruments`)} />
              </FormField>

              <FormField label="Observaciones">
                <Textarea rows={3} {...register(`sequences.${index}.observations`)} />
              </FormField>
            </div>
          </div>
        ))}
      </section>

      {formError && <Alert>{formError}</Alert>}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          <Save size={17} />
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar planeación' : 'Guardar planeación'}
        </Button>
      </div>
    </form>
  )
}
