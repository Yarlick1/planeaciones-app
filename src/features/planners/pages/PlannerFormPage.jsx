import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { getTeacherProfile } from '../../profile/services/profileService'
import { PlannerForm } from '../components/PlannerForm'
import { plannerDefaultValues } from '../schemas/plannerSchema'
import { createPlanner, getPlannerById, mapPlannerToFormValues, updatePlanner } from '../services/plannerService'

export function PlannerFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [catalogs, setCatalogs] = useState({ subjects: [], groups: [] })
  const [defaultValues, setDefaultValues] = useState(plannerDefaultValues)
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const [profileData, planner] = await Promise.all([
          getTeacherProfile(user.id),
          isEditing ? getPlannerById(id) : Promise.resolve(null),
        ])

        if (!mounted) return

        setCatalogs({
          subjects: profileData.subjects,
          groups: profileData.groups,
        })

        if (isEditing) {
          if (!planner) {
            setFormError('No encontramos esta planeación o no tienes acceso.')
          } else {
            setDefaultValues(mapPlannerToFormValues(planner))
          }
        }
      } catch (error) {
        setFormError(error.message || 'No pudimos cargar la información.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [id, isEditing, user.id])

  async function handleSave(values) {
    setFormError('')

    try {
      if (isEditing) {
        await updatePlanner(id, user.id, values, catalogs)
      } else {
        await createPlanner(user.id, values, catalogs)
      }

      navigate('/dashboard')
    } catch (error) {
      setFormError(error.message || 'No pudimos guardar la planeación.')
    }
  }

  if (loading) {
    return <p className="text-sm text-stone-600">Cargando formulario...</p>
  }

  const hasCatalogs = catalogs.subjects.length > 0 && catalogs.groups.length > 0

  return (
    <section>
      <div className="mb-6">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-stone-600">
          <ArrowLeft size={16} />
          Volver al dashboard
        </Link>
        <p className="text-sm font-medium text-emerald-800">{isEditing ? 'Editar' : 'Nueva'} planeación</p>
        <h1 className="mt-1 text-3xl font-semibold text-stone-950">
          {isEditing ? 'Actualizar planeación didáctica' : 'Crear planeación didáctica'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Captura los datos generales y organiza una o varias secuencias dentro del periodo de trabajo.
        </p>
      </div>

      {!hasCatalogs ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-950">Completa tu perfil primero</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Necesitas al menos una materia y un grado/grupo para crear planeaciones.
          </p>
          <Link
            to="/perfil"
            className="mt-4 inline-flex rounded-md bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir al perfil
          </Link>
        </div>
      ) : (
        <PlannerForm
          catalogs={catalogs}
          defaultValues={defaultValues}
          formError={formError}
          isEditing={isEditing}
          onSubmit={handleSave}
        />
      )}
    </section>
  )
}
