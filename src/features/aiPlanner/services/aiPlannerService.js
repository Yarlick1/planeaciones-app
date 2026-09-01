import { supabase } from '../../../lib/supabaseClient'
import { normalizeAiSuggestions } from './aiSuggestionValidators'

export async function generatePlannerStep({ context, step }) {
  try {
    if (!context) {
      throw new Error('Falta el contexto base para generar propuestas.')
    }

    const { data, error } = await supabase.functions.invoke('generate-planner-step', {
      body: { context, step },
    })

    if (error) {
      throw new Error(await getFunctionErrorMessage(error))
    }

    return {
      source: 'ai',
      suggestions: normalizeAiSuggestions(step, data?.suggestions),
    }
  } catch (error) {
    console.warn('No se pudo generar con la Edge Function de IA:', error)

    return {
      source: 'fallback',
      reason: getFriendlyErrorMessage(error),
      suggestions: normalizeAiSuggestions(step, buildFallbackSuggestions(step, context)),
    }
  }
}

async function getFunctionErrorMessage(error) {
  try {
    const payload = await error.context?.json?.()

    if (payload?.code || payload?.error) {
      return JSON.stringify({
        code: payload.code,
        message: payload.error,
      })
    }
  } catch {
    // Supabase may return a non-JSON network error.
  }

  return error.message || 'La Edge Function no respondió correctamente.'
}

function getFriendlyErrorMessage(error) {
  const message = error?.message || 'La Edge Function no respondio correctamente.'
  const payload = parseErrorPayload(message)
  const text = `${payload.code || ''} ${payload.message || message}`.toLowerCase()

  if (text.includes('credit_balance_exhausted') || text.includes('insufficient_quota')) {
    return 'La cuenta de OpenAI no tiene creditos disponibles o alcanzo su limite de uso.'
  }

  if (text.includes('invalid_api_key') || text.includes('incorrect api key')) {
    return 'La API key de OpenAI configurada en Supabase no es valida.'
  }

  if (text.includes('model_not_found') || text.includes('does not exist') || text.includes('model')) {
    return 'El modelo configurado para OpenAI no esta disponible para esta cuenta.'
  }

  if (text.includes('openai_api_key')) {
    return 'Falta configurar OPENAI_API_KEY en los secrets de Supabase.'
  }

  if (text.includes('incomplete_openai_response') || text.includes('invalid_json_from_openai')) {
    return 'OpenAI corto la respuesta antes de terminar. Genera nuevas opciones para recibir el JSON completo.'
  }

  if (text.includes('unterminated string') || text.includes('not valid json')) {
    return 'La IA devolvio una respuesta incompleta. Genera nuevas opciones para intentarlo de nuevo.'
  }

  if (text.includes('failed to send a request') || text.includes('failed to fetch')) {
    return 'No se pudo conectar con la Edge Function. Revisa que este desplegada y que las variables de entorno apunten al proyecto correcto.'
  }

  return payload.message || message
}

function parseErrorPayload(message) {
  try {
    const payload = JSON.parse(message)

    if (payload && typeof payload === 'object') {
      return payload
    }
  } catch {
    // Non-JSON errors are expected for network/runtime failures.
  }

  return { message }
}

function buildFallbackSuggestions(step, context) {
  const safeContext = context ?? {}
  const subject = safeContext.subjectName || 'la materia'
  const group = safeContext.groupLabel || 'el grupo'
  const content = safeContext.content || 'el contenido seleccionado'
  const pda = safeContext.pda || 'el PDA indicado'

  if (step === 'articulatingAxes') {
    return [
      {
        title: 'Pensamiento crítico e inclusión',
        value: ['Pensamiento crítico', 'Inclusión'],
      },
      {
        title: 'Vida saludable y comunidad',
        value: ['Vida Saludable', 'Equidad de Género'],
      },
      {
        title: 'Interculturalidad y expresión',
        value: ['Interculturalidad crítica', 'Artes y expresión artística'],
      },
    ]
  }

  if (step === 'didacticSequence') {
    return [
      {
        title: 'Secuencia colaborativa',
        value: buildSequence({
          context,
          opening: `Recuperar saberes previos sobre ${content} mediante preguntas detonadoras y lluvia de ideas.`,
          development: `Organizar equipos para analizar situaciones relacionadas con ${pda}, registrar hallazgos y construir una explicación común.`,
          closing: 'Socializar conclusiones, contrastar procedimientos y registrar aprendizajes logrados.',
        }),
      },
      {
        title: 'Secuencia basada en problema',
        value: buildSequence({
          context,
          opening: `Presentar una situación cercana a ${group} relacionada con ${content}.`,
          development: `Guiar la resolución del problema con apoyo de recursos, ejemplos y diálogo grupal enfocado en ${pda}.`,
          closing: 'Elaborar una evidencia breve y comentar cómo se aplicó lo aprendido.',
        }),
      },
      {
        title: 'Secuencia de exploración guiada',
        value: buildSequence({
          context,
          opening: `Explorar ideas iniciales del grupo sobre ${subject} y ${content}.`,
          development: `Realizar actividades escalonadas para practicar, comparar respuestas y mejorar producciones vinculadas con ${pda}.`,
          closing: 'Aplicar una autoevaluación sencilla y definir acuerdos para la siguiente sesión.',
        }),
      },
    ]
  }

  const textOptions = {
    generalProblem: [
      `El grupo requiere fortalecer la aplicación de ${content} en situaciones cercanas, ya que se observan dificultades para explicar procedimientos y relacionarlos con su contexto.`,
      `Se identifica la necesidad de favorecer la participación activa de ${group} para comprender ${content} y avanzar en el PDA: ${pda}.`,
      `Las y los estudiantes necesitan vincular ${content} con problemas cotidianos para construir aprendizajes significativos y argumentar sus decisiones.`,
    ],
    formativeFieldPurposes: [
      `Favorecer que el alumnado analice, dialogue y construya explicaciones relacionadas con ${content}, fortaleciendo aprendizajes útiles para su vida escolar y comunitaria.`,
      `Promover experiencias de aprendizaje que permitan comprender ${content}, resolver situaciones y comunicar ideas con claridad.`,
      `Impulsar el desarrollo de habilidades para interpretar información, colaborar y aplicar saberes vinculados con ${subject}.`,
    ],
    purpose: [
      `Que las y los estudiantes desarrollen aprendizajes relacionados con ${content} mediante actividades contextualizadas que atiendan el PDA: ${pda}.`,
      `Fortalecer la comprensión de ${content} a través de situaciones didácticas que promuevan análisis, participación y reflexión.`,
      `Guiar al grupo para aplicar saberes de ${subject} en actividades progresivas, colaborativas y evaluables.`,
    ],
    graduationProfile: [
      'Contribuye a que el alumnado actúe con pensamiento crítico, comunique ideas con claridad y participe de manera responsable en la solución de situaciones escolares.',
      'Favorece el desarrollo de autonomía, colaboración y capacidad para aplicar conocimientos en contextos diversos.',
      'Aporta al fortalecimiento de habilidades para analizar, argumentar, convivir y tomar decisiones informadas.',
    ],
  }

  return textOptions[step].map((value, index) => ({
    title: `Opción ${index + 1}`,
    value,
  }))
}

function buildSequence({ context, opening, development, closing }) {
  const safeContext = context ?? {}

  return {
    startDate: safeContext.generalStartDate,
    endDate: safeContext.generalEndDate,
    openingActivities: opening,
    developmentActivities: development,
    closingActivities: closing,
    resourcesMaterials: 'Cuaderno, pizarrón, materiales impresos y recursos disponibles en el aula.',
    evaluationCriteriaInstruments:
      'Lista de cotejo, observación directa, participación y revisión de evidencias producidas durante la sesión.',
    observations: 'Ajustar tiempos y apoyos de acuerdo con el avance del grupo.',
  }
}
