import { CalendarDays, Edit3, Eye, FilePlus2, FileText, FileType2, PencilLine, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { formatDateRange } from '../../../lib/dateFormatters'
import { useGsapReveal } from '../../../hooks/useGsapReveal'
import { useAuth } from '../../auth/hooks/useAuth'
import { getTeacherProfile } from '../../profile/services/profileService'
import { deletePlanner, getPlannerById, listPlanners } from '../services/plannerService'

export function DashboardPage() {
  const { user } = useAuth()
  const [planners, setPlanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportingId, setExportingId] = useState('')
  const [plannerToDelete, setPlannerToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const dashboardRef = useGsapReveal()

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonth = planners.filter((planner) => {
      const updatedAt = new Date(planner.updated_at)
      return updatedAt.getMonth() === currentMonth && updatedAt.getFullYear() === currentYear
    }).length
    const latestPlanner = planners[0]

    return [
      { label: 'Planeaciones', value: planners.length, helper: 'Guardadas en tu cuenta' },
      { label: 'Este mes', value: thisMonth, helper: 'Actualizadas recientemente' },
      {
        label: 'Última edición',
        value: latestPlanner ? formatShortDate(latestPlanner.updated_at) : 'Sin datos',
        helper: latestPlanner?.subject_name ?? 'Crea una nueva planeación',
      },
    ]
  }, [planners])

  useEffect(() => {
    let mounted = true

    async function loadPlanners() {
      try {
        const data = await listPlanners(user.id)
        if (mounted) setPlanners(data)
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'No pudimos cargar las planeaciones.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPlanners()

    return () => {
      mounted = false
    }
  }, [user.id])

  async function handleDelete() {
    if (!plannerToDelete) return

    setDeleting(true)
    try {
      await deletePlanner(plannerToDelete.id)
      setPlanners((current) => current.filter((planner) => planner.id !== plannerToDelete.id))
      setPlannerToDelete(null)
    } catch (deleteError) {
      setError(deleteError.message || 'No pudimos eliminar la planeación.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleExport(plannerId, format) {
    setError('')
    setExportingId(`${plannerId}-${format}`)

    try {
      const [planner, profileData] = await Promise.all([getPlannerById(plannerId), getTeacherProfile(user.id)])

      if (!planner) {
        setError('No encontramos esta planeación o no tienes acceso.')
        return
      }

      const payload = {
        planner,
        profile: profileData.profile,
      }

      if (format === 'word') {
        const { exportPlannerToWord } = await import('../../exports/services/wordExportService')
        await exportPlannerToWord(payload)
      } else {
        const { exportPlannerToPdf } = await import('../../exports/services/pdfExportService')
        await exportPlannerToPdf(payload)
      }
    } catch (exportError) {
      setError(exportError.message || 'No pudimos exportar la planeación.')
    } finally {
      setExportingId('')
    }
  }

  return (
    <section ref={dashboardRef} className="space-y-6">
      <div data-reveal className="relative overflow-hidden rounded-md border border-stone-200 bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-50 via-cyan-50/60 to-transparent" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">Panel principal</p>
            <h1 className="mt-1 text-3xl font-semibold text-stone-950">Planeaciones didácticas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Gestiona tus planeaciones, crea borradores con apoyo de IA y exporta documentos listos para compartir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/planeaciones/asistente"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:shadow-cyan-900/25"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400 opacity-80 transition group-hover:opacity-100" />
              <span className="relative inline-flex items-center gap-2">
                <Sparkles size={17} />
                Crear con IA
              </span>
            </Link>
            <Link
              to="/planeaciones/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-100"
            >
              <PencilLine size={17} />
              Manual
            </Link>
          </div>
        </div>
      </div>

      <div data-reveal className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-stone-950">{stat.value}</p>
            <p className="mt-1 truncate text-sm text-stone-500">{stat.helper}</p>
          </article>
        ))}
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div data-reveal className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
          Cargando planeaciones...
        </div>
      ) : planners.length === 0 ? (
        <div data-reveal className="rounded-md border border-dashed border-emerald-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-md bg-emerald-50 text-emerald-700">
            <FilePlus2 size={22} />
          </div>
          <h2 className="text-lg font-semibold text-stone-950">Aún no hay planeaciones</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">
            Crea tu primera planeación con apoyo del asistente IA o llena el formulario manualmente.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to="/planeaciones/asistente"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              <FilePlus2 size={16} />
              Crear con IA
            </Link>
            <Link
              to="/perfil"
              className="inline-flex rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Revisar perfil
            </Link>
          </div>
        </div>
      ) : (
        <div data-reveal className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-200 bg-stone-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-stone-950">Archivo de planeaciones</h2>
              <p className="text-sm text-stone-500">Consulta, edita o exporta tus documentos.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600">
              <CalendarDays size={15} className="text-emerald-700" />
              Ordenado por última edición
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-stone-100 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Materia</th>
                  <th className="px-4 py-3 font-semibold">Grupo</th>
                  <th className="px-4 py-3 font-semibold">Periodo</th>
                  <th className="px-4 py-3 font-semibold">Contenido</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {planners.map((planner) => (
                  <tr key={planner.id} className="align-top transition hover:bg-emerald-50/40">
                    <td className="px-4 py-4 text-sm font-medium text-stone-950">{planner.subject_name}</td>
                    <td className="px-4 py-4 text-sm text-stone-700">{planner.group_label}</td>
                    <td className="px-4 py-4 text-sm text-stone-700">
                      {formatDateRange(planner.general_start_date, planner.general_end_date)}
                    </td>
                    <td className="max-w-sm px-4 py-4 text-sm text-stone-700">
                      <span className="line-clamp-2">{planner.content}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/planeaciones/${planner.id}`}
                          className="grid size-9 place-items-center rounded-md border border-stone-300 text-stone-600 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                          aria-label="Ver"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/planeaciones/${planner.id}/editar`}
                          className="grid size-9 place-items-center rounded-md border border-stone-300 text-stone-600 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleExport(planner.id, 'word')}
                          disabled={Boolean(exportingId)}
                          className="grid size-9 place-items-center rounded-md border border-stone-300 text-stone-600 transition hover:-translate-y-0.5 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Exportar Word"
                          title="Exportar Word"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport(planner.id, 'pdf')}
                          disabled={Boolean(exportingId)}
                          className="grid size-9 place-items-center rounded-md border border-stone-300 text-stone-600 transition hover:-translate-y-0.5 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Exportar PDF"
                          title="Exportar PDF"
                        >
                          <FileType2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlannerToDelete(planner)}
                          disabled={Boolean(exportingId) || deleting}
                          className="grid size-9 place-items-center rounded-md border border-red-200 text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50"
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(plannerToDelete)}
        title="Eliminar planeación"
        description={`Se eliminará la planeación de ${plannerToDelete?.subject_name ?? 'esta materia'} para ${
          plannerToDelete?.group_label ?? 'este grupo'
        }. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onCancel={() => setPlannerToDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  )
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
