const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
const SEQUENCE_FIELDS = [
  'startDate',
  'endDate',
  'openingActivities',
  'developmentActivities',
  'closingActivities',
  'resourcesMaterials',
  'evaluationCriteriaInstruments',
  'observations',
]

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini'

    if (!openAiApiKey) {
      throw createHttpError('Falta configurar OPENAI_API_KEY en Supabase Secrets.', 'missing_openai_api_key')
    }

    const { context, step } = await request.json()

    if (!context || typeof context !== 'object') {
      throw createHttpError('Falta el contexto base para generar propuestas.', 'missing_context')
    }

    if (!step || typeof step !== 'string') {
      throw createHttpError('Falta el paso que debe generar la IA.', 'missing_step')
    }

    if (!TEXT_STEPS.has(step) && step !== 'articulatingAxes' && step !== 'didacticSequence') {
      throw createHttpError(`El paso "${step}" no esta soportado.`, 'unsupported_step')
    }

    const requestBody: Record<string, unknown> = {
      model,
      input: [
        {
          role: 'system',
          content:
            'Eres un especialista en planeación didáctica para educación básica en México. Redactas propuestas útiles, concretas y contextualizadas al contenido, PDA y problemática del grupo. Evita frases genéricas.',
        },
        {
          role: 'user',
          content: buildPrompt(step, context),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'planner_step_suggestions',
          strict: true,
          schema: buildSuggestionSchema(step),
        },
      },
    }

    if (supportsReasoningEffort(model)) {
      requestBody.reasoning = { effort: 'low' }
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw await buildOpenAiError(response)
    }

    const data = await response.json()

    if (data?.status === 'incomplete') {
      throw createHttpError(
        'OpenAI corto la respuesta antes de completar el JSON. Vuelve a generar opciones.',
        'incomplete_openai_response',
      )
    }

    const outputText = extractOutputText(data)

    if (!outputText) {
      throw new Error('OpenAI respondió sin texto estructurado para procesar.')
    }

    const parsed = validateSuggestions(step, parseStructuredOutput(outputText))

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const functionError = error as { message?: string; code?: string; status?: number }
    const status = typeof functionError.status === 'number' ? functionError.status : 400

    return new Response(
      JSON.stringify({
        error: functionError.message || 'No pudimos generar propuestas con IA.',
        code: functionError.code || 'edge_function_error',
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function buildSuggestionSchema(step: string) {
  let valueSchema: Record<string, unknown>

  if (step === 'articulatingAxes') {
    valueSchema = {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: {
        type: 'string',
        enum: ARTICULATING_AXES,
      },
    }
  } else if (step === 'didacticSequence') {
    valueSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        openingActivities: { type: 'string' },
        developmentActivities: { type: 'string' },
        closingActivities: { type: 'string' },
        resourcesMaterials: { type: 'string' },
        evaluationCriteriaInstruments: { type: 'string' },
        observations: { type: 'string' },
      },
      required: SEQUENCE_FIELDS,
    }
  } else {
    valueSchema = {
      type: 'string',
    }
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      suggestions: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            value: valueSchema,
          },
          required: ['title', 'value'],
        },
      },
    },
    required: ['suggestions'],
  }
}

function extractOutputText(data: Record<string, unknown>) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text
  }

  if (!Array.isArray(data.output)) return ''

  const textParts: string[] = []

  for (const item of data.output) {
    if (!item || typeof item !== 'object') continue

    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue

    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== 'object') continue

      const text = (contentItem as { text?: unknown }).text
      if (typeof text === 'string') {
        textParts.push(text)
      }
    }
  }

  return textParts.join('').trim()
}

function supportsReasoningEffort(model: string) {
  return model.startsWith('gpt-5') || model.startsWith('o')
}

function parseStructuredOutput(outputText: string) {
  try {
    return JSON.parse(outputText)
  } catch {
    throw createHttpError(
      'OpenAI devolvio JSON incompleto. Genera nuevas opciones para obtener una respuesta completa.',
      'invalid_json_from_openai',
    )
  }
}

async function buildOpenAiError(response: Response) {
  const detail = await response.text()
  const parsedDetail = parseOpenAiErrorDetail(detail)

  return createHttpError(
    parsedDetail.message ? `OpenAI respondio con error: ${parsedDetail.message}` : 'OpenAI respondio con error.',
    parsedDetail.code || parsedDetail.type || 'openai_error',
    response.status,
  )
}

function parseOpenAiErrorDetail(detail: string) {
  try {
    const payload = JSON.parse(detail)
    const openAiError = payload?.error

    if (openAiError && typeof openAiError === 'object') {
      return {
        message: typeof openAiError.message === 'string' ? openAiError.message : '',
        code: typeof openAiError.code === 'string' ? openAiError.code : '',
        type: typeof openAiError.type === 'string' ? openAiError.type : '',
      }
    }
  } catch {
    // OpenAI may return plain text for some infrastructure errors.
  }

  return { message: detail, code: '', type: '' }
}

function validateSuggestions(step: string, payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw createHttpError('OpenAI no devolvio un objeto JSON valido.', 'invalid_ai_payload')
  }

  const suggestions = (payload as { suggestions?: unknown }).suggestions

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw createHttpError('OpenAI no devolvio sugerencias validas.', 'invalid_ai_suggestions')
  }

  return {
    suggestions: suggestions.slice(0, 3).map((suggestion, index) => validateSuggestion(step, suggestion, index)),
  }
}

function validateSuggestion(step: string, suggestion: unknown, index: number) {
  if (!suggestion || typeof suggestion !== 'object') {
    throw createHttpError(`La sugerencia ${index + 1} no tiene un formato valido.`, 'invalid_ai_suggestion')
  }

  const candidate = suggestion as { title?: unknown; value?: unknown }

  if (typeof candidate.title !== 'string' || !candidate.title.trim()) {
    throw createHttpError(`La sugerencia ${index + 1} no incluye titulo.`, 'invalid_ai_suggestion_title')
  }

  if (TEXT_STEPS.has(step)) {
    const textValue = unwrapTextContent(candidate.value, step)

    if (typeof textValue !== 'string' || !textValue.trim()) {
      throw createHttpError(`La sugerencia ${index + 1} debe ser texto.`, 'invalid_ai_text_suggestion')
    }

    const cleanedValue = cleanTextForStep(textValue, step)

    if (!cleanedValue) {
      throw createHttpError(
        `La sugerencia ${index + 1} no corresponde al campo solicitado.`,
        'invalid_ai_step_content',
      )
    }

    return {
      title: cleanSuggestionTitle(candidate.title, index),
      value: cleanedValue,
    }
  }

  if (step === 'articulatingAxes') {
    if (!Array.isArray(candidate.value)) {
      throw createHttpError(`La sugerencia ${index + 1} debe incluir ejes articuladores.`, 'invalid_ai_axes')
    }

    const axes = candidate.value.filter((axis) => typeof axis === 'string' && axis.trim()).map((axis) => axis.trim())

    if (axes.length === 0) {
      throw createHttpError(`La sugerencia ${index + 1} debe incluir al menos un eje.`, 'invalid_ai_axes')
    }

    return {
      title: cleanSuggestionTitle(candidate.title, index),
      value: axes,
    }
  }

  if (step === 'didacticSequence') {
    return {
      title: cleanSuggestionTitle(candidate.title, index),
      value: validateSequence(candidate.value, index),
    }
  }

  throw createHttpError(`El paso "${step}" no esta soportado.`, 'unsupported_step')
}

function validateSequence(value: unknown, index: number) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createHttpError(`La sugerencia ${index + 1} debe ser una secuencia didactica.`, 'invalid_ai_sequence')
  }

  const candidate = value as Record<string, unknown>
  const sequence: Record<string, string> = {}

  for (const field of SEQUENCE_FIELDS) {
    const fieldValue = candidate[field]

    if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
      throw createHttpError(`La secuencia ${index + 1} no incluye el campo "${field}".`, 'invalid_ai_sequence_field')
    }

    sequence[field] = fieldValue.trim()
  }

  return sequence
}

function createHttpError(message: string, code = 'edge_function_error', status = 400) {
  return Object.assign(new Error(message), { code, status })
}

function unwrapTextContent(value: unknown, step: string) {
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

function cleanSuggestionTitle(title: string, index: number) {
  const normalizedTitle = title.replace(/[{}"`]/g, '').trim()
  const technicalTitlePattern =
    /^(formativeFieldPurposes|purpose|generalProblem|graduationProfile|finalidades del campo formativo|prop[oó]sito|problem[aá]tica general|perfil de egreso)\s*:?\s*$/i

  if (technicalTitlePattern.test(normalizedTitle)) {
    return `Opcion ${index + 1}`
  }

  return normalizedTitle || `Opcion ${index + 1}`
}

function stripFieldLabels(value: string, step: string) {
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

function cleanTextForStep(value: string, step: string) {
  const withoutLabels = stripFieldLabels(value, step)
  const withoutForeignSections = trimForeignSections(withoutLabels, step)
  const normalized = withoutForeignSections.replace(/\s+/g, ' ').trim()

  if (step === 'purpose' && looksLikeOnlyAxes(normalized)) {
    return ''
  }

  return normalized
}

function trimForeignSections(value: string, step: string) {
  const boundaryPatterns: Record<string, RegExp[]> = {
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

function looksLikeOnlyAxes(value: string) {
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

function normalizeAxisText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.$/, '')
    .trim()
}

function isStepLabel(label: string, step: string) {
  const normalizedLabel = label.toLowerCase()

  if (step === 'formativeFieldPurposes') {
    return normalizedLabel === 'formativefieldpurposes' || normalizedLabel.includes('finalidades')
  }

  if (step === 'purpose') {
    return normalizedLabel === 'purpose' || normalizedLabel.includes('prop')
  }

  return false
}

function buildPrompt(step: string, context: Record<string, unknown>) {
  return `
Genera exactamente 3 opciones en español para el apartado "${getStepName(step)}".

Datos: materia=${context.subjectName}; grupo=${context.groupLabel}; fechas=${context.generalStartDate} a ${context.generalEndDate}; contenido=${context.content}; PDA=${context.pda}; problematica=${context.generalProblem}; finalidades=${context.formativeFieldPurposes || 'pendientes'}; proposito=${context.purpose || 'pendiente'}; ejes=${Array.isArray(context.articulatingAxes) ? context.articulatingAxes.join(', ') : 'pendiente'}.

Calidad: cada opcion debe sonar lista para una planeacion real, con verbo pedagogico observable, relacion clara con el PDA, conexion con la problematica y producto/evidencia cuando aplique. No uses frases vagas como "fortalecer aprendizajes" sin decir mediante que accion.

Formato:
- Responde solo el apartado solicitado: "${getStepName(step)}". No incluyas contenido de otros apartados.
- Cada title debe ser un nombre breve y natural, nunca el id del campo.
- Cada value debe iniciar directamente con la redaccion pedagogica, sin prefijos como "formativeFieldPurposes:", "purpose:", "valor:" o similares.
- ${getStepGuidance(step)}

Reglas estrictas:
- No escribas llaves, nombres de campos, markdown ni JSON dentro de ningun title o value.
- No anticipes apartados posteriores. No agregues ejes, perfil de egreso, secuencia, recursos, evaluacion ni observaciones salvo cuando el apartado solicitado sea precisamente "Secuencia didactica".
- El JSON lo controla el esquema; el contenido visible debe ser texto natural para el docente.
Sin explicaciones fuera del JSON.
`
}

function getStepName(step: string) {
  const names: Record<string, string> = {
    formativeFieldPurposes: 'Finalidades del campo formativo',
    purpose: 'Proposito',
    articulatingAxes: 'Ejes articuladores',
    didacticSequence: 'Secuencia didactica',
  }

  return names[step] || step
}

function getStepGuidance(step: string) {
  if (step === 'formativeFieldPurposes') {
    return 'Para Finalidades del campo formativo: value debe tener 2 oraciones sinteticas. Redacta el sentido formativo del campo, conectado con contenido, PDA, grupo y problematica. No escribas acciones especificas del alumnado, productos, evidencias, ejes, recursos, evaluacion ni secuencia.'
  }

  if (step === 'purpose') {
    return 'Para Proposito: value debe tener 1 oracion robusta de 35 a 60 palabras. Debe iniciar con una meta de aprendizaje del periodo e incluir accion del alumnado, contenido, PDA y evidencia esperada. No menciones ejes articuladores, perfil de egreso, recursos, evaluacion ni momentos de secuencia.'
  }

  if (step === 'articulatingAxes') {
    return `Para Ejes articuladores: value debe ser un arreglo con 2 a 3 ejes tomados solo de esta lista: ${ARTICULATING_AXES.join(', ')}. El title debe explicar el enfoque, por ejemplo "Convivencia y pensamiento critico".`
  }

  return 'Para Secuencia didactica: value debe ser un objeto completo; cada momento debe tener 1 o 2 oraciones e incluir actividad docente, actividad del alumnado y evidencia breve. Recursos, evaluacion y observaciones deben ser concretos, no listas largas.'
}
