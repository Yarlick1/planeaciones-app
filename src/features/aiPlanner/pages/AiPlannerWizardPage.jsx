import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../../auth/hooks/useAuth'
import { createPlanner } from '../../planners/services/plannerService'
import { getTeacherProfile } from '../../profile/services/profileService'
import { allWizardSteps, sequenceStep } from '../config/aiPlannerSteps'
import { AiInitialContextForm } from '../components/AiInitialContextForm'
import { AxesSuggestionCards } from '../components/AxesSuggestionCards'
import { SequenceSuggestionCards } from '../components/SequenceSuggestionCards'
import { SuggestionCards } from '../components/SuggestionCards'
import { generatePlannerStep } from '../services/aiPlannerService'

export function AiPlannerWizardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [catalogs, setCatalogs] = useState({ subjects: [], groups: [] })
  const [loadingCatalogs, setLoadingCatalogs] = useState(true)
  const [baseValues, setBaseValues] = useState(null)
  const [plannerDraft, setPlannerDraft] = useState(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const currentStep = allWizardSteps[currentStepIndex]

  const aiContext = useMemo(
    () => buildAiContext({ baseValues, catalogs, plannerDraft }),
    [baseValues, catalogs, plannerDraft],
  )

  useEffect(() => {
    let mounted = true

    async function loadCatalogs() {
      try {
        const profileData = await getTeacherProfile(user.id)
        if (!mounted) return

        setCatalogs({
          subjects: profileData.subjects,
          groups: profileData.groups,
        })
      } catch (loadError) {
        setError(loadError.message || 'No pudimos cargar tu perfil docente.')
      } finally {
        if (mounted) setLoadingCatalogs(false)
      }
    }

    loadCatalogs()

    return () => {
      mounted = false
    }
  }, [user.id])

  async function loadSuggestions(step = currentStep, context = aiContext) {
    if (!step || !context) return

    setError('')
    setNotice('')
    setLoadingSuggestions(true)

    try {
      const result = await generatePlannerStep({ context, step: step.id })
      setSuggestions(result.suggestions)

      if (result.source === 'fallback') {
        setNotice(`Estoy usando propuestas locales de prueba. Motivo: ${result.reason}`)
      }
    } catch (suggestionError) {
      setError(suggestionError.message || 'No pudimos generar propuestas.')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  function handleStart(values) {
    const initialDraft = {
      ...values,
      generalProblem: '',
      formativeFieldPurposes: '',
      purpose: '',
      articulatingAxes: [],
      graduationProfile: '',
      sequences: [],
    }

    setBaseValues(values)
    setPlannerDraft(initialDraft)
    setCurrentStepIndex(0)
    setSuggestions([])
    loadSuggestions(allWizardSteps[0], buildAiContext({ baseValues: values, catalogs, plannerDraft: initialDraft }))
  }

  function handleSelect(value) {
    if (currentStep.id === sequenceStep.id) {
      setPlannerDraft((current) => ({
        ...current,
        sequences: [...current.sequences, value],
      }))
      setSuggestions([])
      return
    }

    const nextDraft = {
      ...plannerDraft,
      [currentStep.id]: value,
    }
    const nextStepIndex = currentStepIndex + 1
    const nextStep = allWizardSteps[nextStepIndex]

    setPlannerDraft(nextDraft)
    setSuggestions([])
    setCurrentStepIndex(nextStepIndex)

    if (nextStep) {
      loadSuggestions(nextStep, buildAiContext({ baseValues, catalogs, plannerDraft: nextDraft }))
    }
  }

  async function handleFinish() {
    setSaving(true)
    setError('')

    try {
      const plannerId = await createPlanner(user.id, plannerDraft, catalogs)
      navigate(`/planeaciones/${plannerId}`)
    } catch (saveError) {
      setError(saveError.message || 'No pudimos guardar la planeación.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingCatalogs) {
    return <p className="text-sm text-stone-600">Preparando asistente...</p>
  }

  return (
    <section className="space-y-6">
      <div>
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-stone-600">
          <ArrowLeft size={16} />
          Volver al dashboard
        </Link>
        <p className="text-sm font-medium text-emerald-800">Nueva planeación</p>
        <h1 className="mt-1 text-3xl font-semibold text-stone-950">Asistente IA para planeación didáctica</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Responde lo básico, revisa propuestas por campo y conserva siempre el control: puedes editar antes de usar
          cada sugerencia.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert variant="warning">{notice}</Alert>}

      {!baseValues ? (
        <AiInitialContextForm catalogs={catalogs} onStart={handleStart} />
      ) : (
        <div className="space-y-6">
          <WizardProgress currentStepIndex={currentStepIndex} />

          <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Paso {currentStepIndex + 1} de {allWizardSteps.length}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-stone-950">{currentStep.label}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{currentStep.description}</p>
              </div>
              <Sparkles className="shrink-0 text-emerald-700" size={24} />
            </div>
          </section>

          {suggestions.length === 0 && currentStep.id === sequenceStep.id && plannerDraft.sequences.length > 0 ? (
            <SequenceDecision
              count={plannerDraft.sequences.length}
              onAdd={() => loadSuggestions(sequenceStep)}
              onFinish={handleFinish}
              saving={saving}
            />
          ) : currentStep.id === 'articulatingAxes' ? (
            <AxesSuggestionCards
              loading={loadingSuggestions}
              onRegenerate={() => loadSuggestions(currentStep)}
              onSelect={handleSelect}
              suggestions={suggestions}
            />
          ) : currentStep.id === sequenceStep.id ? (
            <SequenceSuggestionCards
              loading={loadingSuggestions}
              onRegenerate={() => loadSuggestions(currentStep)}
              onSelect={handleSelect}
              suggestions={suggestions}
            />
          ) : (
            <SuggestionCards
              loading={loadingSuggestions}
              onRegenerate={() => loadSuggestions(currentStep)}
              onSelect={handleSelect}
              suggestions={suggestions}
            />
          )}
        </div>
      )}
    </section>
  )
}

function buildAiContext({ baseValues, catalogs, plannerDraft }) {
  if (!baseValues || !plannerDraft) return null

  const subject = catalogs.subjects.find((item) => item.id === baseValues.subjectId)
  const group = catalogs.groups.find((item) => item.id === baseValues.groupId)

  return {
    ...baseValues,
    ...plannerDraft,
    subjectName: subject?.name,
    groupLabel: group?.label,
  }
}

function WizardProgress({ currentStepIndex }) {
  return (
    <div className="grid gap-2 md:grid-cols-6">
      {allWizardSteps.map((step, index) => {
        const done = index < currentStepIndex
        const current = index === currentStepIndex

        return (
          <div
            key={step.id}
            className={`rounded-md border px-3 py-2 text-xs font-semibold ${
              done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : current
                  ? 'border-emerald-700 bg-white text-emerald-800'
                  : 'border-stone-200 bg-white text-stone-500'
            }`}
          >
            {done && <CheckCircle2 className="mb-1" size={14} />}
            {step.label}
          </div>
        )
      })}
    </div>
  )
}

function SequenceDecision({ count, onAdd, onFinish, saving }) {
  return (
    <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">Secuencia agregada</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        La planeación tiene {count} secuencia{count === 1 ? '' : 's'} didáctica{count === 1 ? '' : 's'}.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onAdd}>
          Agregar otra secuencia
        </Button>
        <Button type="button" onClick={onFinish} disabled={saving}>
          {saving ? 'Guardando...' : 'Finalizar y guardar'}
        </Button>
      </div>
    </section>
  )
}
