import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../../auth/hooks/useAuth'
import { createPlanner } from '../../planners/services/plannerService'
import { getTeacherProfile } from '../../profile/services/profileService'
import {
  allWizardSteps,
  availableAxes,
  formativeFieldPurposesCatalog,
  graduationProfilesCatalog,
  sequenceStep,
} from '../config/aiPlannerSteps'
import { AiInitialContextForm } from '../components/AiInitialContextForm'
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

    if (nextStep && shouldAutoLoadSuggestions(nextStep)) {
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

          {currentStep.id === 'formativeFieldPurposes' ? (
            <FormativePurposesStep
              loading={loadingSuggestions}
              onGenerate={() => loadSuggestions(currentStep)}
              onSelect={handleSelect}
              suggestions={suggestions}
            />
          ) : currentStep.id === 'articulatingAxes' ? (
            <ArticulatingAxesStep
              loading={loadingSuggestions}
              onGenerate={() => loadSuggestions(currentStep)}
              onSelect={handleSelect}
              suggestions={suggestions}
            />
          ) : currentStep.id === 'graduationProfile' ? (
            <GraduationProfileStep context={aiContext} onSelect={handleSelect} />
          ) : suggestions.length === 0 && currentStep.id === sequenceStep.id && plannerDraft.sequences.length > 0 ? (
            <SequenceDecision
              count={plannerDraft.sequences.length}
              onAdd={() => loadSuggestions(sequenceStep)}
              onFinish={handleFinish}
              saving={saving}
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

function shouldAutoLoadSuggestions(step) {
  return !step.mode || step.id === 'purpose' || step.id === sequenceStep.id
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
    <div className="grid gap-2 md:grid-cols-5">
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

function FormativePurposesStep({ loading, onGenerate, onSelect, suggestions }) {
  const [mode, setMode] = useState(suggestions.length > 0 ? 'ai' : 'catalog')
  const [selected, setSelected] = useState([])

  function togglePurpose(purpose) {
    setSelected((current) => (current.includes(purpose) ? current.filter((item) => item !== purpose) : [...current, purpose]))
  }

  if (mode === 'ai') {
    return (
      <CatalogOrAiShell mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
        <SuggestionCards loading={loading} onRegenerate={onGenerate} onSelect={onSelect} suggestions={suggestions} />
      </CatalogOrAiShell>
    )
  }

  return (
    <CatalogOrAiShell mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
      <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          {formativeFieldPurposesCatalog.map((purpose, index) => (
            <label
              key={purpose}
              className="flex items-start gap-3 rounded-md border border-stone-200 px-3 py-3 text-sm leading-6 text-stone-700"
            >
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-stone-300 accent-emerald-700"
                checked={selected.includes(purpose)}
                onChange={() => togglePurpose(purpose)}
              />
              <span>
                <strong className="text-stone-950">{index + 1}.</strong> {purpose}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={() => onSelect(selected.map((item) => `- ${item}`).join('\n'))}
            disabled={selected.length === 0}
          >
            <CheckCircle2 size={16} />
            Usar finalidades seleccionadas
          </Button>
        </div>
      </section>
    </CatalogOrAiShell>
  )
}

function ArticulatingAxesStep({ loading, onGenerate, onSelect, suggestions }) {
  const [mode, setMode] = useState(suggestions.length > 0 ? 'ai' : 'catalog')
  const [selected, setSelected] = useState([])

  function toggleAxis(axis) {
    setSelected((current) => (current.includes(axis) ? current.filter((item) => item !== axis) : [...current, axis]))
  }

  if (mode === 'ai') {
    return (
      <CatalogOrAiShell mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
        <AxesAiCards loading={loading} onRegenerate={onGenerate} onSelect={onSelect} suggestions={suggestions} />
      </CatalogOrAiShell>
    )
  }

  return (
    <CatalogOrAiShell mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
      <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {availableAxes.map((axis) => (
            <label
              key={axis}
              className="flex min-h-12 items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-700"
            >
              <input
                type="checkbox"
                className="size-4 rounded border-stone-300 accent-emerald-700"
                checked={selected.includes(axis)}
                onChange={() => toggleAxis(axis)}
              />
              {axis}
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={() => onSelect(selected)} disabled={selected.length === 0}>
            <CheckCircle2 size={16} />
            Usar ejes seleccionados
          </Button>
        </div>
      </section>
    </CatalogOrAiShell>
  )
}

function CatalogOrAiShell({ children, mode, onGenerate, onModeChange }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant={mode === 'catalog' ? 'primary' : 'secondary'} size="sm" onClick={() => onModeChange('catalog')}>
          Elegir existentes
        </Button>
        <Button
          type="button"
          variant={mode === 'ai' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => {
            onModeChange('ai')
            onGenerate()
          }}
        >
          <Sparkles size={15} />
          Proponer con IA
        </Button>
      </div>
      {children}
    </div>
  )
}

function AxesAiCards({ loading, onRegenerate, onSelect, suggestions }) {
  if (loading) {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
        Generando propuestas...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onRegenerate}>
          <RefreshCw size={15} />
          Generar otras opciones
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <article key={`${suggestion.title}-${index}`} className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-950">{suggestion.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestion.value.map((axis) => (
                <span key={axis} className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {axis}
                </span>
              ))}
            </div>
            <Button type="button" className="mt-4 w-full" onClick={() => onSelect(suggestion.value)}>
              <CheckCircle2 size={16} />
              Usar estos ejes
            </Button>
          </article>
        ))}
      </div>
    </div>
  )
}

function GraduationProfileStep({ context, onSelect }) {
  const recommendedProfiles = useMemo(() => getRecommendedGraduationProfiles(context), [context])

  return (
    <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3">
        {graduationProfilesCatalog.map((profile, index) => {
          const recommended = recommendedProfiles.includes(profile.id)

          return (
            <article
              key={profile.id}
              className={`rounded-md border p-4 ${
                recommended ? 'border-emerald-300 bg-emerald-50/70' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-stone-950">Perfil {index + 1}</h3>
                    {recommended && (
                      <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                        Sugerido por el asistente
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{profile.text}</p>
                </div>
                <Button type="button" className="shrink-0" onClick={() => onSelect(profile.text)}>
                  <CheckCircle2 size={16} />
                  Usar perfil
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function getRecommendedGraduationProfiles(context) {
  const source = [
    context?.content,
    context?.pda,
    context?.generalProblem,
    context?.formativeFieldPurposes,
    context?.purpose,
    ...(Array.isArray(context?.articulatingAxes) ? context.articulatingAxes : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const scoredProfiles = graduationProfilesCatalog
    .map((profile) => ({
      id: profile.id,
      score: profile.keywords.reduce((score, keyword) => (source.includes(keyword.toLowerCase()) ? score + 1 : score), 0),
    }))
    .filter((profile) => profile.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scoredProfiles.length === 0) {
    return ['profile-5', 'profile-7', 'profile-10']
  }

  return scoredProfiles.slice(0, 3).map((profile) => profile.id)
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
