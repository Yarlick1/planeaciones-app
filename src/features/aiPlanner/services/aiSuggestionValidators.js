const TEXT_STEPS = new Set(['formativeFieldPurposes', 'purpose'])
const REQUIRED_SEQUENCE_FIELDS = [
  'startDate',
  'endDate',
  'openingActivities',
  'developmentActivities',
  'closingActivities',
  'resourcesMaterials',
  'evaluationCriteriaInstruments',
  'observations',
]

export function normalizeAiSuggestions(step, suggestions) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error('La IA no devolvio sugerencias validas.')
  }

  const normalized = suggestions.map((suggestion, index) => normalizeSuggestion(step, suggestion, index))

  if (normalized.length === 0) {
    throw new Error('La IA no devolvio sugerencias utiles para este paso.')
  }

  return normalized.slice(0, 3)
}

function normalizeSuggestion(step, suggestion, index) {
  if (!suggestion || typeof suggestion !== 'object') {
    throw new Error(`La sugerencia ${index + 1} no tiene un formato valido.`)
  }

  const title = normalizeTitle(suggestion.title, index)

  if (TEXT_STEPS.has(step)) {
    return normalizeTextSuggestion(title, suggestion.value, index)
  }

  if (step === 'articulatingAxes') {
    return normalizeAxesSuggestion(title, suggestion.value, index)
  }

  if (step === 'didacticSequence') {
    return normalizeSequenceSuggestion(title, suggestion.value, index)
  }

  throw new Error(`El paso "${step}" no esta configurado para recibir propuestas de IA.`)
}

function normalizeTitle(title, index) {
  if (typeof title === 'string' && title.trim()) {
    return title.trim()
  }

  return `Opcion ${index + 1}`
}

function normalizeTextSuggestion(title, value, index) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`La sugerencia ${index + 1} debe ser texto.`)
  }

  return {
    title,
    value: value.trim(),
  }
}

function normalizeAxesSuggestion(title, value, index) {
  if (!Array.isArray(value)) {
    throw new Error(`La sugerencia ${index + 1} debe contener ejes articuladores.`)
  }

  const axes = value.filter((axis) => typeof axis === 'string' && axis.trim()).map((axis) => axis.trim())

  if (axes.length === 0) {
    throw new Error(`La sugerencia ${index + 1} debe incluir al menos un eje articulador.`)
  }

  return {
    title,
    value: axes,
  }
}

function normalizeSequenceSuggestion(title, value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`La sugerencia ${index + 1} debe ser una secuencia didactica.`)
  }

  const sequence = {}

  for (const field of REQUIRED_SEQUENCE_FIELDS) {
    const fieldValue = value[field]

    if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
      throw new Error(`La secuencia ${index + 1} no incluye el campo "${field}".`)
    }

    sequence[field] = fieldValue.trim()
  }

  return {
    title,
    value: sequence,
  }
}
