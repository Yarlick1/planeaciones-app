import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { aiPlannerInitialSchema } from '../schemas/aiPlannerSchema'

export function AiInitialContextForm({ catalogs, onStart }) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(aiPlannerInitialSchema),
    defaultValues: {
      generalStartDate: '',
      generalEndDate: '',
      subjectId: '',
      groupId: '',
      content: '',
      pda: '',
      generalProblem: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onStart)} className="space-y-6">
      <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
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

          <FormField label="Problemática general" error={errors.generalProblem?.message}>
            <Textarea rows={4} {...register('generalProblem')} />
          </FormField>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Sparkles size={17} />
          Iniciar asistente IA
        </Button>
      </div>
    </form>
  )
}
