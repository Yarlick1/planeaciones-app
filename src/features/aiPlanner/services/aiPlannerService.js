import { supabase } from '../../../lib/supabaseClient'

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
    if (!Array.isArray(data?.suggestions) || data.suggestions.length === 0) {
      throw new Error('La IA no devolvió sugerencias válidas.')
    }

    return {
      source: 'ai',
      suggestions: data.suggestions.slice(0, 3),
    }
  } catch (error) {
    console.warn('No se pudo generar con la Edge Function de IA:', error)

    return {
      source: 'fallback',
      reason: error.message || 'La Edge Function no respondió correctamente.',
      suggestions: buildFallbackSuggestions(step, context),
    }
  }
}

async function getFunctionErrorMessage(error) {
  try {
    const payload = await error.context?.json?.()

    if (payload?.error) return payload.error
  } catch {
    // Supabase may return a non-JSON network error.
  }

  return error.message || 'La Edge Function no respondió correctamente.'
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
        value: ['Vida saludable', 'Apropiación de las culturas'],
      },
      {
        title: 'Interculturalidad y expresión',
        value: ['Interculturalidad crítica', 'Artes y experiencias estéticas'],
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
