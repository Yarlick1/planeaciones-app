const TEXT_STEPS = new Set(['formativeFieldPurposes', 'purpose'])
const ARTICULATING_AXES = [
  'Inclusión',
  'Pensamiento crítico',
  'Interculturalidad crítica',
  'Equidad de Género',
  'Artes y expresión artística',
  'Igualdad de género',
  'Vida Saludable',
]
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

  const normalized = []
  const errors = []

  suggestions.forEach((suggestion, index) => {
    try {
      normalized.push(normalizeSuggestion(step, suggestion, index))
    } catch (error) {
      errors.push(error)
    }
  })

  if (normalized.length === 0) {
    throw errors[0] ?? new Error('La IA no devolvio sugerencias utiles para este paso.')
  }

  return normalized.slice(0, 3)
}

function normalizeSuggestion(step, suggestion, index) {
  if (!suggestion || typeof suggestion !== 'object') {
    throw new Error(`La sugerencia ${index + 1} no tiene un formato valido.`)
  }

  const title = normalizeTitle(suggestion.title, index)

  if (TEXT_STEPS.has(step)) {
    return normalizeTextSuggestion(step, title, suggestion.value, index)
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
    return cleanSuggestionTitle(title.trim(), index)
  }

  return `Opcion ${index + 1}`
}

function normalizeTextSuggestion(step, title, value, index) {
  const textValue = unwrapTextValue(value, step)

  if (typeof textValue !== 'string' || !textValue.trim()) {
    throw new Error(`La sugerencia ${index + 1} debe ser texto.`)
  }

  const cleanedValue = cleanTextForStep(textValue, step)

  if (!cleanedValue) {
    throw new Error(`La sugerencia ${index + 1} no corresponde al campo solicitado.`)
  }

  return {
    title,
    value: cleanedValue,
  }
}

function unwrapTextValue(value, step) {
  if (typeof value !== 'string') return value

  const cleanValue = stripFieldLabels(value.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim(), step)

  if (!cleanValue.startsWith('{') || !cleanValue.endsWith('}')) {
    return cleanValue
  }

  try {
    const parsed = JSON.parse(cleanValue)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return cleanValue
    }

    const firstStringValue = Object.values(parsed).find((item) => typeof item === 'string' && item.trim())
    return typeof firstStringValue === 'string' ? stripFieldLabels(firstStringValue, step) : cleanValue
  } catch {
    return cleanValue
  }
}

function cleanSuggestionTitle(title, index) {
  const normalizedTitle = title.replace(/[{}"`]/g, '').trim()
  const technicalTitlePattern =
    /^(formativeFieldPurposes|purpose|generalProblem|graduationProfile|finalidades del campo formativo|prop[oó]sito|problem[aá]tica general|perfil de egreso)\s*:?\s*$/i

  if (technicalTitlePattern.test(normalizedTitle)) {
    return `Opcion ${index + 1}`
  }

  return normalizedTitle || `Opcion ${index + 1}`
}

function stripFieldLabels(value, step) {
  const fieldLabelPattern =
    /\b(formativeFieldPurposes|purpose|generalProblem|graduationProfile|finalidades del campo formativo|prop[oó]sito|problem[aá]tica general|perfil de egreso)\b\s*:\s*/gi
  const matches = [...value.matchAll(fieldLabelPattern)]

  if (matches.length === 0) return value

  const targetMatch = matches.find((match) => isStepLabel(match[1], step)) ?? matches[0]
  const nextMatch = matches.find((match) => (match.index ?? 0) > (targetMatch.index ?? 0))
  const start = (targetMatch.index ?? 0) + targetMatch[0].length
  const end = nextMatch?.index ?? value.length

  return value.slice(start, end).trim()
}

function cleanTextForStep(value, step) {
  const withoutLabels = stripFieldLabels(value, step)
  const withoutForeignSections = trimForeignSections(withoutLabels, step)
  const normalized = withoutForeignSections.replace(/\s+/g, ' ').trim()

  if (step === 'purpose' && looksLikeOnlyAxes(normalized)) {
    return ''
  }

  return normalized
}

function trimForeignSections(value, step) {
  const boundaryPatterns = {
    formativeFieldPurposes: [
      /\b(prop[oó]sito|purpose)\s*:/i,
      /\b(ejes articuladores|articulatingAxes)\s*:/i,
      /\b(perfil de egreso|graduationProfile)\s*:/i,
      /\b(secuencia(?: did[aá]ctica)?|inicio|desarrollo|cierre|recursos|evaluaci[oó]n|observaciones)\s*:/i,
      /\b(producto esperado|evidencia esperada)\s*:/i,
      /\bLos estudiantes\s+(investigar[aá]n|elaborar[aá]n|realizar[aá]n|aplicar[aá]n|documentar[aá]n)\b/i,
      /\bEl alumnado\s+(investigar[aá]|elaborar[aá]|realizar[aá]|aplicar[aá]|documentar[aá])\b/i,
    ],
    purpose: [
      /\b(ejes articuladores|articulatingAxes)\s*:/i,
      /\b(perfil de egreso|graduationProfile)\s*:/i,
      /\b(secuencia(?: did[aá]ctica)?|inicio|desarrollo|cierre|recursos|evaluaci[oó]n|observaciones)\s*:/i,
    ],
  }

  const matches = (boundaryPatterns[step] ?? [])
    .map((pattern) => value.search(pattern))
    .filter((position) => position > 0)

  if (matches.length === 0) return value

  return value.slice(0, Math.min(...matches)).trim()
}

function looksLikeOnlyAxes(value) {
  const normalizedValue = normalizeAxisText(value)

  if (!normalizedValue) return false

  const selectedAxes = value
    .split(',')
    .map((axis) => normalizeAxisText(axis))
    .filter(Boolean)

  return (
    selectedAxes.length > 0 &&
    selectedAxes.every((axis) => ARTICULATING_AXES.some((knownAxis) => normalizeAxisText(knownAxis) === axis))
  )
}

function normalizeAxisText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.$/, '')
    .trim()
}

function isStepLabel(label, step) {
  const normalizedLabel = label.toLowerCase()

  if (step === 'formativeFieldPurposes') {
    return normalizedLabel === 'formativefieldpurposes' || normalizedLabel.includes('finalidades')
  }

  if (step === 'purpose') {
    return normalizedLabel === 'purpose' || normalizedLabel.includes('prop')
  }

  return false
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
