const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const suggestionSchema = {
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
          value: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
              {
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
                required: [
                  'startDate',
                  'endDate',
                  'openingActivities',
                  'developmentActivities',
                  'closingActivities',
                  'resourcesMaterials',
                  'evaluationCriteriaInstruments',
                  'observations',
                ],
              },
            ],
          },
        },
        required: ['title', 'value'],
      },
    },
  },
  required: ['suggestions'],
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini'

    if (!openAiApiKey) {
      throw new Error('Falta configurar OPENAI_API_KEY en Supabase Secrets.')
    }

    const { context, step } = await request.json()

    if (!context || typeof context !== 'object') {
      throw new Error('Falta el contexto base para generar propuestas.')
    }

    if (!step || typeof step !== 'string') {
      throw new Error('Falta el paso que debe generar la IA.')
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content:
              'Eres un asistente pedagógico para docentes de educación básica en México. Propón opciones claras, contextualizadas y listas para integrarse en una planeación didáctica. Responde siempre en español.',
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
            schema: suggestionSchema,
          },
        },
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`OpenAI respondió con error: ${detail}`)
    }

    const data = await response.json()
    const outputText = extractOutputText(data)

    if (!outputText) {
      throw new Error('OpenAI respondió sin texto estructurado para procesar.')
    }

    const parsed = JSON.parse(outputText)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

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

function buildPrompt(step: string, context: Record<string, unknown>) {
  return `
Genera exactamente 3 propuestas para el paso "${step}".

Contexto:
- Materia: ${context.subjectName}
- Grado y grupo: ${context.groupLabel}
- Fecha inicio: ${context.generalStartDate}
- Fecha fin: ${context.generalEndDate}
- Contenido: ${context.content}
- PDA: ${context.pda}
- Problemática elegida: ${context.generalProblem || 'Aún no definida'}
- Finalidades elegidas: ${context.formativeFieldPurposes || 'Aún no definidas'}
- Propósito elegido: ${context.purpose || 'Aún no definido'}
- Ejes elegidos: ${Array.isArray(context.articulatingAxes) ? context.articulatingAxes.join(', ') : 'Aún no definidos'}

Reglas:
- Si el paso es "articulatingAxes", cada value debe ser un arreglo de strings.
- Si el paso es "didacticSequence", cada value debe ser un objeto de secuencia didáctica completo.
- Para otros pasos, cada value debe ser texto breve, claro y editable.
- Evita lenguaje genérico; vincula las propuestas con el contenido y PDA.
`
}
