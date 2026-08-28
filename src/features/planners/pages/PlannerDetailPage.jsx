import { ArrowLeft, Edit3, FileText, FileType2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { formatAxes, formatText, sortSequences } from '../../exports/services/exportFormatters'
import { getTeacherProfile } from '../../profile/services/profileService'
import { formatDateRange } from '../../../lib/dateFormatters'
import { getPlannerById } from '../services/plannerService'

export function PlannerDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [planner, setPlanner] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadPlanner() {
      try {
        const [plannerData, profileData] = await Promise.all([getPlannerById(id), getTeacherProfile(user.id)])

        if (!mounted) return

        if (!plannerData) {
          setError('No encontramos esta planeación o no tienes acceso.')
          return
        }

        setPlanner(plannerData)
        setProfile(profileData.profile)
      } catch (loadError) {
        setError(loadError.message || 'No pudimos cargar la planeación.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPlanner()

    return () => {
      mounted = false
    }
  }, [id, user.id])

  async function handleExport(format) {
    setError('')
    setExporting(format)

    try {
      const payload = { planner, profile }

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
      setExporting('')
    }
  }

  if (loading) {
    return <p className="text-sm text-stone-600">Cargando vista previa...</p>
  }

  if (error && !planner) {
    return (
      <section>
        <BackLink />
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      </section>
    )
  }

  const sequences = sortSequences(planner)

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BackLink />
          <p className="mt-4 text-sm font-medium text-emerald-800">Vista previa</p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-950">{planner.subject_name}</h1>
          <p className="mt-2 text-sm text-stone-600">
            {planner.group_label} · {formatDateRange(planner.general_start_date, planner.general_end_date)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/planeaciones/${planner.id}/editar`}
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            <Edit3 size={16} />
            Editar
          </Link>
          <button
            type="button"
            onClick={() => handleExport('word')}
            disabled={Boolean(exporting)}
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText size={16} />
            Word
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={Boolean(exporting)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileType2 size={16} />
            PDF
          </button>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <PreviewSection title="Encabezado institucional">
        <InfoGrid
          items={[
            ['Docente', profile?.full_name],
            ['Institución', profile?.institution],
            ['Materia', planner.subject_name],
            ['Grado y grupo', planner.group_label],
            ['Periodo', formatDateRange(planner.general_start_date, planner.general_end_date)],
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Datos generales">
        <InfoGrid
          items={[
            ['Contenido', planner.content],
            ['PDA', planner.pda],
            ['Problemática general', planner.general_problem],
            ['Finalidades del campo formativo', planner.formative_field_purposes],
            ['Propósito', planner.purpose],
            ['Ejes articuladores', formatAxes(planner.articulating_axes)],
            ['Perfil de egreso', planner.graduation_profile],
          ]}
        />
      </PreviewSection>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-950">Secuencia didáctica</h2>
        {sequences.map((sequence, index) => (
          <PreviewSection key={sequence.id} title={`Secuencia ${index + 1}`}>
            <InfoGrid
              items={[
                ['Periodo', formatDateRange(sequence.start_date, sequence.end_date)],
                ['Inicio', sequence.opening_activities],
                ['Desarrollo', sequence.development_activities],
                ['Cierre', sequence.closing_activities],
                ['Recursos y materiales', sequence.resources_materials],
                ['Evaluación', sequence.evaluation_criteria_instruments],
                ['Observaciones', sequence.observations],
              ]}
            />
          </PreviewSection>
        ))}
      </div>
    </section>
  )
}

function BackLink() {
  return (
    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-stone-600">
      <ArrowLeft size={16} />
      Volver al dashboard
    </Link>
  )
}

function PreviewSection({ children, title }) {
  return (
    <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-stone-950">{title}</h2>
      {children}
    </section>
  )
}

function InfoGrid({ items }) {
  return (
    <dl className="grid gap-0 overflow-hidden rounded-md border border-stone-200 md:grid-cols-[220px_1fr]">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="border-b border-stone-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950 md:border-r">
            {label}
          </dt>
          <dd className="whitespace-pre-wrap border-b border-stone-200 px-4 py-3 text-sm leading-6 text-stone-700">
            {formatText(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
