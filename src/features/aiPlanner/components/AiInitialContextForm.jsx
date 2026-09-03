import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, BookOpenText, CalendarRange, GraduationCap, Sparkles, Target, UsersRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { useGsapReveal } from '../../../hooks/useGsapReveal'
import { aiPlannerInitialSchema } from '../schemas/aiPlannerSchema'

export function AiInitialContextForm({ catalogs, onStart }) {
  const formRef = useGsapReveal({ selector: '[data-form-reveal]', stagger: 0.05, y: 12 })
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
    <form
      ref={formRef}
      onSubmit={handleSubmit(onStart)}
      className="overflow-hidden rounded-md border border-white/15 bg-white text-stone-950 shadow-2xl shadow-cyan-950/30"
    >
      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative overflow-hidden bg-stone-950 p-5 text-white sm:p-6 lg:min-h-[36rem]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(34,211,238,0.22),transparent_42%,rgba(16,185,129,0.16)),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div data-form-reveal>
              <span className="inline-flex items-center gap-2 rounded-md border border-cyan-200/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                <Sparkles size={14} />
                IA guiada
              </span>
              <h2 className="mt-5 max-w-sm text-2xl font-semibold leading-tight sm:text-3xl">
                Construye tu planeación desde un contexto claro.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-cyan-50/70">
                La información inicial ayuda a generar finalidades, propósito, ejes y secuencias más alineadas al grupo.
              </p>
            </div>

            <div data-form-reveal className="grid gap-3 text-sm">
              <ContextPill icon={CalendarRange} label="Periodo" />
              <ContextPill icon={BookOpenText} label="Materia y contenido" />
              <ContextPill icon={UsersRound} label="Grado y grupo" />
              <ContextPill icon={Target} label="PDA y problemática" />
            </div>
          </div>
        </aside>

        <section className="p-4 sm:p-6 lg:p-7">
          <div data-form-reveal className="mb-6 flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Contexto base</p>
              <h3 className="mt-1 text-xl font-semibold text-stone-950">Datos para iniciar</h3>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600">
              <GraduationCap size={14} className="text-emerald-700" />
              Planeación didáctica
            </span>
          </div>

          <div className="space-y-5">
            <div data-form-reveal className="grid gap-4 md:grid-cols-2">
              <FormField label="Fecha inicio" error={errors.generalStartDate?.message} className="min-w-0">
                <Input type="date" className="h-11 bg-stone-50" {...register('generalStartDate')} />
              </FormField>

              <FormField label="Fecha fin" error={errors.generalEndDate?.message} className="min-w-0">
                <Input type="date" className="h-11 bg-stone-50" {...register('generalEndDate')} />
              </FormField>

              <FormField label="Materia" error={errors.subjectId?.message} className="min-w-0">
                <Select className="h-11 bg-stone-50" {...register('subjectId')}>
                  <option value="">Selecciona una materia</option>
                  {catalogs.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Grado y grupo" error={errors.groupId?.message} className="min-w-0">
                <Select className="h-11 bg-stone-50" {...register('groupId')}>
                  <option value="">Selecciona un grupo</option>
                  {catalogs.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div data-form-reveal className="grid gap-4">
              <FormField label="Contenido" error={errors.content?.message}>
                <Textarea rows={3} className="min-h-24 bg-stone-50" {...register('content')} />
              </FormField>

              <FormField label="PDA" error={errors.pda?.message}>
                <Textarea rows={3} className="min-h-24 bg-stone-50" {...register('pda')} />
              </FormField>

              <FormField label="Problemática general" error={errors.generalProblem?.message}>
                <Textarea rows={4} className="min-h-32 bg-stone-50" {...register('generalProblem')} />
              </FormField>
            </div>
          </div>

          <div data-form-reveal className="mt-6 flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-xs leading-5 text-stone-500">
              <AlertCircle size={15} className="shrink-0 text-cyan-700" />
              Revisa tus datos antes de iniciar el flujo de propuestas.
            </p>
            <Button type="submit" disabled={isSubmitting} className="w-full shadow-lg shadow-emerald-950/10 sm:w-auto">
              <Sparkles size={17} />
              Iniciar asistente IA
            </Button>
          </div>
        </section>
      </div>
    </form>
  )
}

function ContextPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-cyan-50/90 backdrop-blur">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-cyan-200/15 text-cyan-100">
        <Icon size={16} />
      </span>
      <span className="font-medium">{label}</span>
    </div>
  )
}
