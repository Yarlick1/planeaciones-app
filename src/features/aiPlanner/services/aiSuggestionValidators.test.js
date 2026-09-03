import { describe, expect, it } from 'vitest'
import { normalizeAiSuggestions } from './aiSuggestionValidators'

describe('normalizeAiSuggestions', () => {
  it('normalizes text suggestions', () => {
    const suggestions = normalizeAiSuggestions('purpose', [
      { title: ' Proposito contextual ', value: ' Fortalecer el aprendizaje esperado. ' },
    ])

    expect(suggestions).toEqual([
      {
        title: 'Proposito contextual',
        value: 'Fortalecer el aprendizaje esperado.',
      },
    ])
  })

  it('unwraps JSON-looking text suggestions before showing them', () => {
    const suggestions = normalizeAiSuggestions('formativeFieldPurposes', [
      {
        title: 'Campo formativo',
        value: '{"formativeFieldPurposes":"Promover acuerdos de convivencia mediante actividades vinculadas al PDA."}',
      },
    ])

    expect(suggestions[0].value).toBe('Promover acuerdos de convivencia mediante actividades vinculadas al PDA.')
  })

  it('extracts only the current field when AI includes multiple field labels', () => {
    const suggestions = normalizeAiSuggestions('purpose', [
      {
        title: 'purpose:',
        value:
          'formativeFieldPurposes: Favorecer la comunicacion tecnica en el taller.\n\npurpose: Mediante la lectura guiada de fichas tecnicas, el alumnado clasificara procedimientos y elaborara una carpeta de evidencias.',
      },
    ])

    expect(suggestions).toEqual([
      {
        title: 'Opcion 1',
        value:
          'Mediante la lectura guiada de fichas tecnicas, el alumnado clasificara procedimientos y elaborara una carpeta de evidencias.',
      },
    ])
  })

  it('trims formative field suggestions when AI appends purpose, axes and sequence content', () => {
    const suggestions = normalizeAiSuggestions('formativeFieldPurposes', [
      {
        title: 'Lenguaje técnico en contextos del taller',
        value:
          'El campo formativo se centra en que el alumnado identifique y use vocabulario técnico del textil para representar procesos y materiales, atendiendo rezagos en comprensión lectora y hábitos de estudio mediante actividades guiadas en equipo. Promueve consenso lingüístico para comunicar decisiones técnicas con respeto al contexto escolar y comunitario. Los estudiantes investigarán y consensuarán términos técnicos del taller, aplicarán representaciones gráficas básicas y explicarán sus decisiones; el producto esperado es un glosario ilustrado. Inclusión, Pensamiento crítico. Secuencia: Inicio: la docente presenta un ejemplo real.',
      },
    ])

    expect(suggestions[0].value).toBe(
      'El campo formativo se centra en que el alumnado identifique y use vocabulario técnico del textil para representar procesos y materiales, atendiendo rezagos en comprensión lectora y hábitos de estudio mediante actividades guiadas en equipo. Promueve consenso lingüístico para comunicar decisiones técnicas con respeto al contexto escolar y comunitario.',
    )
  })

  it('rejects purpose suggestions that only contain articulating axes', () => {
    expect(() =>
      normalizeAiSuggestions('purpose', [
        {
          title: 'Artes y pensamiento crítico',
          value: 'Artes y expresión artística, Pensamiento crítico',
        },
      ]),
    ).toThrow('no corresponde')
  })

  it('trims purpose suggestions before sequence details', () => {
    const suggestions = normalizeAiSuggestions('purpose', [
      {
        title: 'Propósito técnico',
        value:
          'El alumnado elaborará croquis y fichas técnicas para representar procesos textiles, acordando nomenclatura común y documentando un portafolio como evidencia del PDA trabajado. Secuencia: Inicio: recuperar saberes previos. Desarrollo: elaborar productos.',
      },
    ])

    expect(suggestions[0].value).toBe(
      'El alumnado elaborará croquis y fichas técnicas para representar procesos textiles, acordando nomenclatura común y documentando un portafolio como evidencia del PDA trabajado.',
    )
  })

  it('normalizes articulating axes suggestions', () => {
    const suggestions = normalizeAiSuggestions('articulatingAxes', [
      { title: 'Ejes', value: [' Pensamiento critico ', '', 'Inclusión'] },
    ])

    expect(suggestions[0].value).toEqual(['Pensamiento critico', 'Inclusión'])
  })

  it('rejects sequence suggestions with missing fields', () => {
    expect(() =>
      normalizeAiSuggestions('didacticSequence', [
        {
          title: 'Secuencia incompleta',
          value: {
            startDate: '2026-09-01',
            endDate: '2026-09-05',
          },
        },
      ]),
    ).toThrow('openingActivities')
  })
})
