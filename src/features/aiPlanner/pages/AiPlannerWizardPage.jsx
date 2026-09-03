import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'
import gsap from 'gsap'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { useGsapReveal } from '../../../hooks/useGsapReveal'
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
import { AiThinkingState } from '../components/AiThinkingState'
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
  const generatingStepRef = useRef(false)
  const ambienceRef = useRef(null)
  const pageRef = useGsapReveal({ selector: '[data-ai-reveal]', stagger: 0.07, y: 22 })

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

  useLayoutEffect(() => {
    if (!ambienceRef.current) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const context = gsap.context(() => {
      gsap.to('[data-ai-ambience]', {
        backgroundPosition: '100% 50%',
        duration: 9,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, ambienceRef)

    return () => context.revert()
  }, [])

  async function loadSuggestions(step = currentStep, context = aiContext) {
    if (!step || !context) return
    if (generatingStepRef.current) return

    generatingStepRef.current = true
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
      generatingStepRef.current = false
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
    <section
      ref={(node) => {
        pageRef.current = node
        ambienceRef.current = node
      }}
      className="relative min-h-svh overflow-hidden bg-stone-950 px-4 py-5 text-white sm:px-6 lg:px-8 lg:py-8"
    >
      <div
        data-ai-ambience
        className="pointer-events-none absolute inset-0 bg-[length:180%_180%] bg-[linear-gradient(135deg,rgba(6,182,212,0.24),transparent_34%,rgba(16,185,129,0.18)_67%,transparent),radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%)]"
      />

      <div className="relative mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <div data-ai-reveal>
          <Link
            to="/dashboard"
            className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-cyan-100/80 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/50 hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver al dashboard
          </Link>
          <p className="text-sm font-medium text-cyan-200">Modo potenciado</p>
          <h1 className="mt-1 max-w-4xl text-3xl font-semibold text-white sm:text-4xl">Asistente IA para planeación didáctica</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/70">
            Responde lo básico, revisa propuestas por campo y conserva siempre el control: puedes editar antes de usar
            cada sugerencia.
          </p>
        </div>

        {error && <Alert>{error}</Alert>}
        {notice && <Alert variant="warning">{notice}</Alert>}

        {!baseValues ? (
          <div data-ai-reveal>
            <AiInitialContextForm catalogs={catalogs} onStart={handleStart} />
          </div>
        ) : (
          <div data-ai-reveal className="space-y-5">
            <WizardProgress currentStepIndex={currentStepIndex} />

            <section className="relative overflow-hidden rounded-md border border-cyan-300/25 bg-white/95 p-4 text-stone-950 shadow-2xl shadow-cyan-950/30 sm:p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Paso {currentStepIndex + 1} de {allWizardSteps.length}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-stone-950">{currentStep.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{currentStep.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-md border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800">
                  <Sparkles size={16} />
                  Asistencia activa
                </div>
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
                generating={loadingSuggestions}
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
      </div>
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
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0">
      {allWizardSteps.map((step, index) => {
        const done = index < currentStepIndex
        const current = index === currentStepIndex

        return (
          <div
            key={step.id}
            className={`relative min-w-40 overflow-hidden rounded-md border px-3 py-2.5 text-xs font-semibold shadow-sm sm:min-w-0 ${
              done
                ? 'border-emerald-300/60 bg-emerald-300/15 text-emerald-100'
                : current
                  ? 'border-cyan-300 bg-white text-emerald-800 shadow-cyan-500/20'
                  : 'border-white/10 bg-white/5 text-cyan-50/55'
            }`}
          >
            {current && <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400" />}
            <span className="flex items-center gap-2">
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${
                  done ? 'bg-emerald-300 text-emerald-950' : current ? 'bg-emerald-700 text-white' : 'bg-white/10 text-cyan-50/60'
                }`}
              >
                {done ? <CheckCircle2 size={12} /> : index + 1}
              </span>
              <span className="truncate">{step.label}</span>
            </span>
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
      <CatalogOrAiShell loading={loading} mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
        <SuggestionCards loading={loading} onRegenerate={onGenerate} onSelect={onSelect} showToolbar={false} suggestions={suggestions} />
      </CatalogOrAiShell>
    )
  }

  return (
    <CatalogOrAiShell loading={loading} mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
      <section className="rounded-md border border-white/70 bg-white/95 p-4 shadow-xl shadow-cyan-950/10 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-2">
          {formativeFieldPurposesCatalog.map((purpose, index) => (
            <label
              key={purpose}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm leading-6 transition ${
                selected.includes(purpose)
                  ? 'border-emerald-300 bg-emerald-50 text-stone-800 shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-cyan-200 hover:bg-cyan-50/40'
              }`}
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
      <CatalogOrAiShell loading={loading} mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
        <AxesAiCards loading={loading} onSelect={onSelect} suggestions={suggestions} />
      </CatalogOrAiShell>
    )
  }

  return (
    <CatalogOrAiShell loading={loading} mode={mode} onGenerate={onGenerate} onModeChange={setMode}>
      <section className="rounded-md border border-white/70 bg-white/95 p-4 shadow-xl shadow-cyan-950/10 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {availableAxes.map((axis) => (
            <label
              key={axis}
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                selected.includes(axis)
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-cyan-200 hover:bg-cyan-50/40'
              }`}
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

function CatalogOrAiShell({ children, loading, mode, onGenerate, onModeChange }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/10 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-cyan-50/80">
          {mode === 'catalog' ? 'Selecciona opciones existentes del catálogo.' : 'Revisa y edita las propuestas generadas.'}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button type="button" variant={mode === 'catalog' ? 'primary' : 'secondary'} size="sm" onClick={() => onModeChange('catalog')}>
            Elegir existentes
          </Button>
          <Button
          type="button"
          variant={mode === 'ai' ? 'primary' : 'secondary'}
          size="sm"
          disabled={loading}
          onClick={() => {
            onModeChange('ai')
            onGenerate()
            }}
          >
            <Sparkles size={15} />
            {loading ? 'Generando...' : mode === 'ai' ? 'Generar otras' : 'Proponer con IA'}
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}

function AxesAiCards({ loading, onSelect, suggestions }) {
  const cardsRef = useGsapReveal({ selector: '[data-axis-card]', stagger: 0.09, y: 16 })

  if (loading) {
    return <AiThinkingState />
  }

  return (
    <div ref={cardsRef} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <article
            data-axis-card
            key={`${suggestion.title}-${index}`}
            className="group rounded-md border border-white/70 bg-white/95 p-4 shadow-xl shadow-cyan-950/10 transition hover:-translate-y-1 hover:border-cyan-200 hover:bg-white"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-cyan-50 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">
                {index + 1}
              </span>
              <h3 className="min-w-0 text-sm font-semibold leading-5 text-stone-950">{suggestion.title}</h3>
            </div>
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
    <section className="rounded-md border border-white/70 bg-white/95 p-4 shadow-xl shadow-cyan-950/10 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-950">Selecciona un perfil de egreso</h3>
          <p className="mt-1 text-sm text-stone-500">Los destacados son sugerencias locales según el contexto capturado.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {graduationProfilesCatalog.map((profile, index) => {
          const recommended = recommendedProfiles.includes(profile.id)

          return (
            <article
              key={profile.id}
              className={`rounded-md border p-4 ${
                recommended ? 'border-emerald-300 bg-emerald-50/80 shadow-sm' : 'border-stone-200 bg-white hover:border-cyan-200'
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

function SequenceDecision({ count, generating, onAdd, onFinish, saving }) {
  return (
    <section className="overflow-hidden rounded-md border border-white/70 bg-white/95 shadow-xl shadow-cyan-950/10">
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Secuencia agregada</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            La planeación tiene {count} secuencia{count === 1 ? '' : 's'} didáctica{count === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button type="button" variant="secondary" onClick={onAdd} disabled={generating}>
            {generating ? 'Generando...' : 'Agregar otra secuencia'}
          </Button>
          <Button type="button" onClick={onFinish} disabled={saving}>
            {saving ? 'Guardando...' : 'Finalizar y guardar'}
          </Button>
        </div>
      </div>
    </section>
  )
}
