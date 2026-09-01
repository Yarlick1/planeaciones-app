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
      max_output_tokens: getMaxOutputTokens(step),
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
    valueSchema = { type: 'string' }
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

function getMaxOutputTokens(step: string) {
  if (step === 'didacticSequence') return 1600
  if (step === 'articulatingAxes') return 650
  if (step === 'formativeFieldPurposes') return 900
  return 700
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
    if (typeof candidate.value !== 'string' || !candidate.value.trim()) {
      throw createHttpError(`La sugerencia ${index + 1} debe ser texto.`, 'invalid_ai_text_suggestion')
    }

    return {
      title: candidate.title.trim(),
      value: candidate.value.trim(),
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
      title: candidate.title.trim(),
      value: axes,
    }
  }

  if (step === 'didacticSequence') {
    return {
      title: candidate.title.trim(),
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

function buildPrompt(step: string, context: Record<string, unknown>) {
  return `
Genera exactamente 3 opciones para "${step}" en español.

Datos: materia=${context.subjectName}; grupo=${context.groupLabel}; fechas=${context.generalStartDate} a ${context.generalEndDate}; contenido=${context.content}; PDA=${context.pda}; problematica=${context.generalProblem}; finalidades=${context.formativeFieldPurposes || 'pendientes'}; proposito=${context.purpose || 'pendiente'}; ejes=${Array.isArray(context.articulatingAxes) ? context.articulatingAxes.join(', ') : 'pendientes'}.

Calidad: cada opcion debe sonar lista para una planeacion real, con verbo pedagogico, relacion clara con el PDA, conexion con la problematica y producto/evidencia cuando aplique. No uses frases como "fortalecer aprendizajes" sin decir como.

Formato:
- "formativeFieldPurposes": value con 2 oraciones; vincula campo formativo, contexto del grupo y sentido comunitario.
- "purpose": value con 1 oracion robusta; incluye accion del alumnado, contenido, PDA y evidencia esperada.
- "articulatingAxes": value con 2 a 3 ejes tomados solo de esta lista: ${ARTICULATING_AXES.join(', ')}. El title debe explicar el enfoque, por ejemplo "Convivencia y pensamiento critico".
- "didacticSequence": value es objeto completo; cada momento debe incluir actividad docente, actividad del alumnado y evidencia breve.

Sin explicaciones fuera del JSON.
`
}
