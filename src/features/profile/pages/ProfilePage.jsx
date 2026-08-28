import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { useAuth } from '../../auth/hooks/useAuth'
import { profileSchema } from '../schemas/profileSchema'
import { getTeacherProfile, saveTeacherProfile } from '../services/profileService'

const emptyDefaults = {
  fullName: '',
  institution: '',
  subjects: [{ value: '' }],
  groups: [{ value: '' }],
}

export function ProfilePage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [formError, setFormError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: emptyDefaults,
  })

  const subjects = useFieldArray({ control, name: 'subjects' })
  const groups = useFieldArray({ control, name: 'groups' })

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      try {
        const data = await getTeacherProfile(user.id)

        if (!mounted) return

        reset({
          fullName: data.profile?.full_name ?? '',
          institution: data.profile?.institution ?? '',
          subjects: data.subjects.length ? data.subjects.map((subject) => ({ value: subject.name })) : [{ value: '' }],
          groups: data.groups.length ? data.groups.map((group) => ({ value: group.label })) : [{ value: '' }],
        })
      } catch (error) {
        setFormError(error.message || 'No pudimos cargar el perfil.')
      } finally {
        if (mounted) setLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [reset, user.id])

  async function onSubmit(values) {
    setFormError('')
    setSavedMessage('')

    try {
      await saveTeacherProfile(user.id, values)
      setSavedMessage('Perfil docente guardado correctamente.')
      navigate('/perfil', { replace: true })
    } catch (error) {
      setFormError(error.message || 'No pudimos guardar el perfil.')
    }
  }

  if (loadingProfile) {
    return <p className="text-sm text-stone-600">Cargando perfil docente...</p>
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-800">Configuración inicial</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-stone-950">Perfil docente</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Estos datos alimentarán los encabezados de tus planeaciones y los selectores de materia, grado y grupo.
        </p>
      </div>

      {location.state?.reason === 'profile_required' && (
        <Alert variant="warning" className="mb-6 px-4 py-3">
          Completa tu nombre, institución, materias y grupos para poder crear y gestionar planeaciones.
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 rounded-md border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <FormField label="Nombre completo" error={errors.fullName?.message}>
            <Input {...register('fullName')} />
          </FormField>

          <FormField label="Escuela / Institución educativa" error={errors.institution?.message}>
            <Input {...register('institution')} />
          </FormField>
        </div>

        <DynamicList
          title="Materias que imparte"
          addLabel="Agregar materia"
          fieldName="subjects"
          fieldArray={subjects}
          register={register}
          error={errors.subjects?.message}
          placeholder="Ej. Matemáticas"
        />

        <DynamicList
          title="Grados y grupos asignados"
          addLabel="Agregar grupo"
          fieldName="groups"
          fieldArray={groups}
          register={register}
          error={errors.groups?.message}
          placeholder="Ej. 1°A"
        />

        {formError && <Alert>{formError}</Alert>}
        {savedMessage && (
          <Alert
            variant="success"
            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{savedMessage}</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 font-semibold text-emerald-900">
              Ir al dashboard
              <ArrowRight size={15} />
            </Link>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            <Save size={17} />
            {isSubmitting ? 'Guardando...' : 'Guardar perfil'}
          </Button>
        </div>
      </form>
    </section>
  )
}

function DynamicList({ addLabel, error, fieldArray, fieldName, placeholder, register, title }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-950">{title}</h2>
        <Button
          type="button"
          onClick={() => fieldArray.append({ value: '' })}
          size="sm"
          variant="secondary"
        >
          <Plus size={15} />
          {addLabel}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {fieldArray.fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder={placeholder}
              {...register(`${fieldName}.${index}.value`)}
            />
            <Button
              type="button"
              onClick={() => fieldArray.fields.length > 1 && fieldArray.remove(index)}
              disabled={fieldArray.fields.length === 1}
              className="size-10 shrink-0 text-stone-500"
              size="icon"
              variant="secondary"
              aria-label="Eliminar"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
